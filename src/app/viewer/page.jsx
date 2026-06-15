"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { createClient } from "@/utils/supabase/client";
import {
  Container,
  Typography,
  Stack,
  Paper,
  Chip,
  Grid,
  Box,
} from "@mui/material";
import { LineChart } from "@mui/x-charts/LineChart";
import { Gauge, gaugeClasses } from "@mui/x-charts/Gauge";

// Dynamically import the map to prevent Next.js SSR crashes
const LiveMap = dynamic(() => import("@/component/mapComponent"), {
  ssr: false,
  loading: () => (
    <Typography color="text.secondary" align="center" mt={10}>
      Loading Map Engine...
    </Typography>
  ),
});

const supabase = createClient();
const MAX_HISTORY_LENGTH = 60;

export default function Viewer() {
  const sessionCode = "TEST124";

  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  const [status, setStatus] = useState("Connecting...");

  const lastFetchedId = useRef(null);

  useEffect(() => {
    let isMounted = true;
    let timeoutId = null;

    const fetchLatestData = async () => {
      const { data: latest, error } = await supabase
        .from("driving_data")
        .select("*")
        .eq("session_code", sessionCode)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) console.error("Fetch error:", error);
      if (!isMounted) return;

      if (latest) {
        if (latest.id !== lastFetchedId.current) {
          lastFetchedId.current = latest.id;
          setData(latest);

          setHistory((prev) => {
            const newHistory = [...prev, latest];
            return newHistory.length > MAX_HISTORY_LENGTH
              ? newHistory.slice(newHistory.length - MAX_HISTORY_LENGTH)
              : newHistory;
          });
        }

        if (latest.is_online) {
          setStatus("Live Telemetry Active");
        } else {
          setStatus("Vehicle Offline");
        }
      } else {
        setStatus("Awaiting Signal...");
      }

      timeoutId = setTimeout(fetchLatestData, 5000);
    };

    fetchLatestData();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [sessionCode]);

  // ==========================================
  // CHART DATA PREPARATION
  // ==========================================
  const timeAxis = history.map((d) => new Date(d.created_at));
  const speedData = history.map((d) => d.speed_ms || 0);

  const gForceData = history.map((d) => {
    const mag = Math.sqrt(
      (d.acc_x || 0) ** 2 + (d.acc_y || 0) ** 2 + (d.acc_z || 0) ** 2,
    );
    return Number((mag / 9.81).toFixed(2));
  });

  const brakingData = history.map((d) => (d.is_braking ? 1 : 0));
  const suddenStopData = history.map((d) => (d.sudden_stop ? 1 : 0));

  // Format data specifically for the new Leaflet map
  const mapPathData = history
    .filter((d) => d.latitude && d.longitude)
    .map((d) => ({ lat: d.latitude, lng: d.longitude }));

  return (
    <Container
      maxWidth="xl"
      sx={{ py: 4, backgroundColor: "#f5f7fa", minHeight: "100vh" }}
    >
      <Stack spacing={4}>
        {/* HEADER */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems="center"
          spacing={2}
        >
          <Typography variant="h4" fontWeight="bold" color="primary.main">
            Soapbox Telemetry
          </Typography>
          <Chip
            label={status}
            color={data?.is_online ? "success" : "default"}
            variant="filled"
            sx={{ fontWeight: "bold", px: 2 }}
          />
        </Stack>

        {!data ? (
          <Paper sx={{ p: 4, textAlign: "center" }}>
            Waiting for vehicle data...
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {/* SECTION 1: LIVE SPEED */}
            <Grid item xs={12} md={6} lg={4}>
              <Paper
                sx={{
                  p: 3,
                  height: 350,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Speed Profile (m/s)
                </Typography>
                <Box sx={{ flexGrow: 1 }}>
                  <LineChart
                    xAxis={[
                      {
                        data: timeAxis,
                        scaleType: "time",
                        valueFormatter: (d) => d.toLocaleTimeString(),
                      },
                    ]}
                    series={[
                      {
                        data: speedData,
                        color: "#1976d2",
                        area: true,
                        showMark: false,
                      },
                    ]}
                    margin={{ top: 10, bottom: 40, left: 40, right: 10 }}
                  />
                </Box>
              </Paper>
            </Grid>

            {/* SECTION 2: HEADING */}
            <Grid item xs={12} md={6} lg={4}>
              <Paper
                sx={{
                  p: 3,
                  height: 350,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Current Heading
                </Typography>
                <Box sx={{ flexGrow: 1, width: "100%", position: "relative" }}>
                  <Gauge
                    value={data.heading || 0}
                    valueMin={0}
                    valueMax={360}
                    startAngle={-180}
                    endAngle={180}
                    text={`${data.heading?.toFixed(0)}°`}
                    sx={{
                      [`& .${gaugeClasses.valueText}`]: {
                        fontSize: 40,
                        fontWeight: "bold",
                      },
                      [`& .${gaugeClasses.valueArc}`]: { fill: "#ed6c02" },
                    }}
                  />
                </Box>
              </Paper>
            </Grid>

            {/* SECTION 3: REAL OPENSTREETMAP (Leaflet Integration) */}
            <Grid item xs={12} md={6} lg={4}>
              <Paper
                sx={{
                  p: 3,
                  height: 350,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  gutterBottom
                >
                  <Typography variant="h6" color="text.secondary">
                    Live Route Map
                  </Typography>
                  {mapPathData.length > 0 && (
                    <Typography
                      variant="caption"
                      color="primary"
                      fontWeight="bold"
                    >
                      {mapPathData[mapPathData.length - 1].lat.toFixed(5)},{" "}
                      {mapPathData[mapPathData.length - 1].lng.toFixed(5)}
                    </Typography>
                  )}
                </Stack>
                <Box
                  sx={{
                    flexGrow: 1,
                    borderRadius: 2,
                    overflow: "hidden",
                    border: "1px solid #e0e0e0",
                  }}
                >
                  {mapPathData.length > 0 ? (
                    <LiveMap pathData={mapPathData} />
                  ) : (
                    <Typography color="text.secondary" align="center" mt={10}>
                      Acquiring GPS Lock...
                    </Typography>
                  )}
                </Box>
              </Paper>
            </Grid>

            {/* SECTION 4: G-FORCE */}
            <Grid item xs={12} md={6} lg={4}>
              <Paper
                sx={{
                  p: 3,
                  height: 300,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Acceleration (G-Force)
                </Typography>
                <Box sx={{ flexGrow: 1 }}>
                  <LineChart
                    xAxis={[
                      {
                        data: timeAxis,
                        scaleType: "time",
                        valueFormatter: (d) => d.toLocaleTimeString(),
                      },
                    ]}
                    series={[
                      {
                        data: gForceData,
                        color: "#9c27b0",
                        showMark: false,
                        curve: "catmullRom",
                      },
                    ]}
                    margin={{ top: 10, bottom: 40, left: 40, right: 10 }}
                  />
                </Box>
              </Paper>
            </Grid>

            {/* SECTION 5: SAFETY EVENTS */}
            <Grid item xs={12} md={6} lg={4}>
              <Paper
                sx={{
                  p: 3,
                  height: 300,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Safety Events
                </Typography>
                <Box sx={{ flexGrow: 1 }}>
                  <LineChart
                    xAxis={[
                      {
                        data: timeAxis,
                        scaleType: "time",
                        valueFormatter: (d) => d.toLocaleTimeString(),
                      },
                    ]}
                    series={[
                      {
                        data: brakingData,
                        label: "Braking",
                        color: "#ff9800",
                        curve: "step",
                        showMark: false,
                      },
                      {
                        data: suddenStopData,
                        label: "Sudden Stop",
                        color: "#d32f2f",
                        curve: "step",
                        showMark: false,
                      },
                    ]}
                    margin={{ top: 10, bottom: 40, left: 20, right: 10 }}
                  />
                </Box>
              </Paper>
            </Grid>
          </Grid>
        )}
      </Stack>
    </Container>
  );
}
