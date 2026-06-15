"use client";

import { useState, useEffect, useRef } from "react";
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
import { ScatterChart } from "@mui/x-charts/ScatterChart";
import { Gauge, gaugeClasses } from "@mui/x-charts/Gauge";

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

      // Always poll exactly every 5 seconds
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

  const gpsPathData = history
    .filter((d) => d.longitude && d.latitude)
    .map((d, index) => ({
      id: d.id || index.toString(),
      x: d.longitude,
      y: d.latitude,
    }));

  const brakingData = history.map((d) => (d.is_braking ? 1 : 0));
  const suddenStopData = history.map((d) => (d.sudden_stop ? 1 : 0));

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
            {/* SECTION 1: LIVE SPEED (Line Chart) */}
            <Grid item size={{ xs: 12, md: 6, lg: 4 }}>
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

            {/* SECTION 2: HEADING (Gauge) */}
            <Grid item size={{ xs: 12, md: 6, lg: 4 }}>
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

            {/* SECTION 3: GPS TRAJECTORY (Scatter Chart as a Map) */}
            <Grid item size={{ xs: 12, md: 6, lg: 4 }}>
              <Paper
                sx={{
                  p: 3,
                  height: 300,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  GPS Trajectory (Local Path)
                </Typography>
                <Box sx={{ flexGrow: 1 }}>
                  {gpsPathData.length > 0 ? (
                    <ScatterChart
                      series={[{ data: gpsPathData, color: "#2e7d32" }]}
                      margin={{ top: 10, bottom: 20, left: 20, right: 10 }}
                      xAxis={[{ disableTicks: true, disableLine: true }]}
                      yAxis={[{ disableTicks: true, disableLine: true }]}
                    />
                  ) : (
                    <Typography color="text.secondary" align="center" mt={10}>
                      Acquiring GPS Lock...
                    </Typography>
                  )}
                </Box>
              </Paper>
            </Grid>

            {/* SECTION 4: G-FORCE & ACCELERATION (Line Chart) */}
            <Grid item size={{ xs: 12, md: 6, lg: 4 }}>
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

            {/* SECTION 5: DRIVING EVENTS (Step Chart) */}
            <Grid item size={{ xs: 12, md: 6, lg: 4 }}>
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
