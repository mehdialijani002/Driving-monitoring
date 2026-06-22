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
import Image from "next/image";

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

  // --- NEW TIMER STATES ---
  const [sessionStart, setSessionStart] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

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
          // If the timer hasn't started yet, start it now
          setSessionStart((prev) => prev || new Date());
        } else {
          setStatus("Vehicle Offline");
          // Reset timer if offline
          setSessionStart(null);
        }
      } else {
        setStatus("Awaiting Signal...");
      }

      timeoutId = setTimeout(fetchLatestData, 2000);
    };

    fetchLatestData();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [sessionCode]);

  // 2. LIVE TICKING CLOCK
  useEffect(() => {
    let interval;
    if (sessionStart) {
      interval = setInterval(() => {
        setElapsedSeconds(
          Math.floor((Date.now() - sessionStart.getTime()) / 1000),
        );
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => clearInterval(interval);
  }, [sessionStart]);

  // Helper function to format seconds into MM:SS
  const formatTime = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (totalSeconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

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

  const mapPathData = history
    .filter((d) => d.latitude && d.longitude)
    .map((d) => ({ lat: d.latitude, lng: d.longitude }));

  return (
    <Container maxWidth="xl" sx={{ py: 2, minHeight: "100vh" }}>
      <Stack spacing={4}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Image src="/var_logo.png" alt="Logo" width={150} height={150} />
            <Typography variant="h6" fontWeight="bold" color="primary.main">
              Soapbox Telemetry
              <Typography variant="subtitle2" color="text.secondary">
                Group 4 - Digital Car / Innovation Management & Customer Design
                (SS26)
              </Typography>
            </Typography>
          </Box>
          {/* TOP RIGHT CONTROLS */}
          {/* NEW: LIVE TIMER */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {sessionStart && (
              <Paper
                elevation={0}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  px: 2,
                  py: 0.5,
                  borderRadius: 5,
                  border: "1px solid #e0e0e0",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: "bold",
                    color: "text.secondary",
                    fontFamily: "monospace",
                    fontSize: "1rem",
                  }}
                >
                  ⏱️ {formatTime(elapsedSeconds)}
                </Typography>
              </Paper>
            )}

            {/* COMPASS ARROW */}
            {data && (
              <Paper
                elevation={0}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  px: 2,
                  py: 0.5,
                  borderRadius: 5,
                  border: "1px solid #e0e0e0",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ mr: 1, fontWeight: "bold", color: "text.secondary" }}
                >
                  {data.heading?.toFixed(0)}°
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    transform: `rotate(${data.heading || 0}deg)`,
                    transition: "transform 1s linear",
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24">
                    <path
                      d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"
                      fill="#ed6c02"
                    />
                  </svg>
                </Box>
              </Paper>
            )}

            <Chip
              label={status}
              color={data?.is_online ? "success" : "default"}
              variant="filled"
              sx={{ fontWeight: "bold", px: 2 }}
            />
          </Box>
        </Box>
        {!data ? (
          <Paper sx={{ p: 4, textAlign: "center" }}>
            Waiting for vehicle data...
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {/* SECTION 1: LIVE SPEED */}
            <Grid item size={{ xs: 12, md: 6, lg: 6 }}>
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
                    margin={{ top: 0, bottom: 0, left: 0, right: 0 }}
                  />
                </Box>
              </Paper>
            </Grid>

            {/* SECTION 2: LIVE ROUTE MAP */}
            <Grid item size={{ xs: 12, md: 6, lg: 6 }}>
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

            {/* SECTION 3: G-FORCE */}
            <Grid item size={{ xs: 12, md: 6, lg: 6 }}>
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
                    margin={{ top: 0, bottom: 0, left: 0, right: 0 }}
                  />
                </Box>
              </Paper>
            </Grid>

            {/* SECTION 4: SAFETY EVENTS */}
            <Grid item size={{ xs: 12, md: 6, lg: 6 }}>
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
                    margin={{ top: 0, bottom: 0, left: 0, right: 0 }}
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
