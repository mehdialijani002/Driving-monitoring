"use client";

import { useState, useRef, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  Container,
  Typography,
  Stack,
  Chip,
  Button,
  Paper,
  Grid,
  Box,
} from "@mui/material";
import Image from "next/image";

const supabase = createClient();

export default function Sender() {
  const [sessionCode] = useState("TEST124");
  const [status, setStatus] = useState("Ready...");
  const [isRunning, setIsRunning] = useState(false);

  // Added "heading" to the local debugger state
  const [localData, setLocalData] = useState({
    speed: 0,
    lat: 0,
    lng: 0,
    acc: 0,
    heading: 0,
    braking: false,
  });

  const watchIdRef = useRef(null);
  const intervalRef = useRef(null);

  const lastGPS = useRef({
    latitude: null,
    longitude: null,
    speed_ms: 0,
    heading: 0, // This will now be powered by the compass
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

  // ---------------- COMPASS HANDLER ----------------
  const handleOrientation = useCallback((e) => {
    let compassHeading = null;

    // iOS provides a dedicated webkit property for compass heading
    if (e.webkitCompassHeading) {
      compassHeading = e.webkitCompassHeading;
    }
    // Android uses absolute alpha (which is inverted)
    else if (e.absolute && e.alpha !== null) {
      compassHeading = 360 - e.alpha;
    }

    if (compassHeading !== null) {
      lastGPS.current.heading = compassHeading;
      setLocalData((prev) => ({ ...prev, heading: compassHeading }));
    }
  }, []);

  // ---------------- MOTION HANDLER ----------------
  const handleMotion = useCallback((e) => {
    const acc = e.accelerationIncludingGravity;
    if (!acc) return;

    const acc_x = acc.x || 0;
    const acc_y = acc.y || 0;
    const acc_z = acc.z || 0;

    const magnitude = Math.sqrt(acc_x ** 2 + acc_y ** 2 + acc_z ** 2);
    const isBraking = acc_y < -2;

    motionRef.current = {
      acc_x,
      acc_y,
      acc_z,
      is_braking: isBraking,
      sudden_stop: magnitude > 22,
    };

    setLocalData((prev) => ({ ...prev, acc: magnitude, braking: isBraking }));
  }, []);

  // ---------------- START ----------------
  // Made this function async to handle Apple's permission requests
  const startSender = async () => {
    setIsRunning(true);
    setStatus("Acquiring Sensors...");

    // 1. Request Compass Permission (Crucial for iPhones)
    if (
      typeof DeviceOrientationEvent !== "undefined" &&
      typeof DeviceOrientationEvent.requestPermission === "function"
    ) {
      try {
        const permissionState =
          await DeviceOrientationEvent.requestPermission();
        if (permissionState === "granted") {
          window.addEventListener("deviceorientation", handleOrientation);
        } else {
          setStatus("Compass permission denied");
        }
      } catch (error) {
        console.error(error);
      }
    } else {
      // Android / Older browsers
      window.addEventListener("deviceorientationabsolute", handleOrientation);
      window.addEventListener("deviceorientation", handleOrientation);
    }

    // 2. Start GPS
    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, speed, accuracy } = pos.coords;

          lastGPS.current = {
            ...lastGPS.current, // Keep the compass heading intact
            latitude,
            longitude,
            speed_ms: speed || 0,
          };

          setStatus(`Sensors Locked (Accuracy: ${Math.round(accuracy)}m)`);
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

    // 3. Start Accelerometer
    window.addEventListener("devicemotion", handleMotion);

    // 4. Start Streaming
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
    window.removeEventListener("deviceorientation", handleOrientation);
    window.removeEventListener("deviceorientationabsolute", handleOrientation);

    await sendData({ is_online: false });
  };

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Stack sx={{ display: "flex" }} spacing={2}>
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          sx={{ width: "100%", textAlign: "center", mb: 2 }}
        >
          <Image src="/var_logo.png" alt="Logo" width={200} height={180} />
          <Typography variant="h5" fontWeight="bold" sx={{ mt: 1 }}>
            Soapbox Driver
          </Typography>
          <Typography variant="subtitle2" color="text.secondary">
            Session: <b>{sessionCode}</b>
          </Typography>
        </Box>
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
          <Paper sx={{ p: 3, mt: 4 }}>
            <Typography variant="h6" color="primary" gutterBottom>
              Raw Sensor Debugger
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
                  Compass Angle
                </Typography>
                <Typography variant="h5" fontWeight="bold" color="secondary">
                  {localData.heading.toFixed(0)}°
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  G-Force Magnitude
                </Typography>
                <Typography variant="h6">
                  {(localData.acc / 9.81).toFixed(2)} G
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  GPS Status
                </Typography>
                <Typography variant="h6">
                  {localData.lat !== 0 ? "Locked" : "Searching..."}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        )}
      </Stack>
    </Container>
  );
}
