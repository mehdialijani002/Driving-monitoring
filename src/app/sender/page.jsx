"use client";

import { useState, useRef, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { Container, Typography, Stack, Chip, Button } from "@mui/material";

const supabase = createClient();

export default function Sender() {
  const [sessionCode] = useState("TEST124");
  const [status, setStatus] = useState("Ready...");
  const [isRunning, setIsRunning] = useState(false);

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

    motionRef.current = {
      acc_x: acc.x || 0,
      acc_y: acc.y || 0,
      acc_z: acc.z || 0,
      is_braking: (acc.y || 0) < -2,
      sudden_stop:
        Math.sqrt((acc.x || 0) ** 2 + (acc.y || 0) ** 2 + (acc.z || 0) ** 2) >
        22,
    };
  }, []);

  // ---------------- START ----------------
  const startSender = () => {
    setIsRunning(true);
    setStatus("GPS tracking...");

    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, speed, heading } = pos.coords;
          lastGPS.current = {
            latitude,
            longitude,
            speed_ms: speed || 0, // Native m/s
            heading: heading || 0,
          };
        },
        (err) => setStatus("GPS error: " + err.message),
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 5000 },
      );
    }

    window.addEventListener("devicemotion", handleMotion);

    // Stream 1 row every 1 second
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

    // Send offline ping
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
          >
            Start
          </Button>
          <Button
            onClick={stopSender}
            disabled={!isRunning}
            color="error"
            variant="contained"
          >
            Stop
          </Button>
        </Stack>
      </Stack>
    </Container>
  );
}
