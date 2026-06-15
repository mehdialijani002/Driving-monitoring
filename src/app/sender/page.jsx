"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  Container,
  Typography,
  Stack,
  Chip,
  Button,
  Paper,
  Grid,
} from "@mui/material";

const supabase = createClient();

export default function Sender() {
  const [sessionCode] = useState("TEST124");
  const [status, setStatus] = useState("Ready...");
  const [isRunning, setIsRunning] = useState(false);

  // State strictly for local UI debugging so you can see what the phone senses
  const [localData, setLocalData] = useState({
    speed: 0,
    lat: 0,
    lng: 0,
    acc: 0,
    braking: false,
  });

  const watchIdRef = useRef(null);
  const intervalRef = useRef(null);

  const lastGPS = useRef({
    latitude: null,
    longitude: null,
    speed_ms: 0,
    heading: 0,
  });

  const motionRef = useRef({});

  // ---------------- SEND TO SUPABASE ----------------
  const sendData = async (payload) => {
    try {
      await supabase.from("driving_data").insert({
        session_code: sessionCode,
        ...payload,
        created_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Failed to send data:", err);
    }
  };

  // ---------------- MOTION HANDLER ----------------
  const handleMotion = useCallback((e) => {
    const acc = e.accelerationIncludingGravity;
    if (!acc) return;

    const acc_x = acc.x || 0;
    const acc_y = acc.y || 0;
    const acc_z = acc.z || 0;

    // G-Force Magnitude
    const magnitude = Math.sqrt(acc_x ** 2 + acc_y ** 2 + acc_z ** 2);
    const isBraking = acc_y < -2; // Shaking the phone forward will trigger this

    motionRef.current = {
      acc_x,
      acc_y,
      acc_z,
      is_braking: isBraking,
      sudden_stop: magnitude > 22, // Shaking violently will trigger this
    };

    // Update debug UI
    setLocalData((prev) => ({ ...prev, acc: magnitude, braking: isBraking }));
  }, []);

  // ---------------- START ----------------
  const startSender = () => {
    setIsRunning(true);
    setStatus("Acquiring GPS...");

    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, speed, heading, accuracy } = pos.coords;

          lastGPS.current = {
            latitude,
            longitude,
            speed_ms: speed || 0, // Will be 0 if walking!
            heading: heading || 0,
          };

          setStatus(`GPS Locked (Accuracy: ${Math.round(accuracy)}m)`);

          // Update debug UI
          setLocalData((prev) => ({
            ...prev,
            speed: speed || 0,
            lat: latitude,
            lng: longitude,
          }));
        },
        (err) => setStatus("GPS error: " + err.message),
        { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 },
      );
    }

    window.addEventListener("devicemotion", handleMotion);

    intervalRef.current = setInterval(() => {
      sendData({
        ...lastGPS.current,
        ...motionRef.current,
        is_online: true,
      });
    }, 1000);
  };

  // ---------------- STOP ----------------
  const stopSender = async () => {
    setIsRunning(false);
    setStatus("Stopped");

    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    window.removeEventListener("devicemotion", handleMotion);
    await sendData({ is_online: false });
  };

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Stack spacing={3}>
        <Typography variant="h4">📱 Soapbox Sender</Typography>
        <Typography>
          Session: <b>{sessionCode}</b>
        </Typography>
        <Chip label={status} color={isRunning ? "success" : "default"} />

        <Stack direction="row" spacing={2}>
          <Button
            onClick={startSender}
            disabled={isRunning}
            variant="contained"
            size="large"
            fullWidth
          >
            Start Sending
          </Button>
          <Button
            onClick={stopSender}
            disabled={!isRunning}
            color="error"
            variant="contained"
            size="large"
            fullWidth
          >
            Stop
          </Button>
        </Stack>

        {/* --- RAW DEBUGGER UI --- */}
        {isRunning && (
          <Paper sx={{ p: 3, mt: 4, bgcolor: "#f8f9fa" }}>
            <Typography variant="h6" color="primary" gutterBottom>
              Raw Sensor Debugger
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              If values here are 0, your phone is filtering out the movement.
              Try a bicycle or shake the phone!
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Raw Speed (m/s)
                </Typography>
                <Typography variant="h5" fontWeight="bold">
                  {localData.speed.toFixed(2)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  G-Force Magnitude
                </Typography>
                <Typography variant="h5" fontWeight="bold">
                  {(localData.acc / 9.81).toFixed(2)} G
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">
                  GPS Coordinates
                </Typography>
                <Typography variant="body1">
                  {localData.lat.toFixed(5)}, {localData.lng.toFixed(5)}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Chip
                  label={localData.braking ? "BRAKING TRIGGERED" : "No Braking"}
                  color={localData.braking ? "error" : "success"}
                  variant={localData.braking ? "filled" : "outlined"}
                />
              </Grid>
            </Grid>
          </Paper>
        )}
      </Stack>
    </Container>
  );
}
