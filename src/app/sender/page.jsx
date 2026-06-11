"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  Container,
  Typography,
  Stack,
  Paper,
  Chip,
  Button,
} from "@mui/material";

const supabase = createClient();

export default function Sender() {
  const [sessionCode] = useState("TEST124");
  const [status, setStatus] = useState("آماده شروع...");
  const [isRunning, setIsRunning] = useState(false);

  const watchIdRef = useRef(null);
  const intervalRef = useRef(null);
  const lastUpdateRef = useRef(0);

  const updateDrivingData = async (data) => {
    try {
      await supabase.from("driving_data").upsert(
        {
          session_code: sessionCode,
          ...data,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "session_code",
        },
      );
    } catch (err) {
      console.error(err);
    }
  };

  // ================= START =================
  const startSender = () => {
    setIsRunning(true);
    setStatus("در حال ارسال...");

    // mark online
    updateDrivingData({
      is_online: true,
    });

    // GPS
    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          if (!isRunning) return;

          const { latitude, longitude, speed, heading } = pos.coords;

          updateDrivingData({
            latitude,
            longitude,
            speed_kmh: speed ? (speed * 3.6).toFixed(1) : 0,
            heading: heading || 0,
            is_online: true,
          });

          setStatus("ارسال GPS...");
        },
        (err) => {
          setStatus("GPS Error: " + err.message);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
        },
      );
    }

    // Motion
    const handleMotion = (e) => {
      if (!isRunning) return;

      const now = Date.now();
      if (now - lastUpdateRef.current < 500) return;
      lastUpdateRef.current = now;

      const acc = e.accelerationIncludingGravity;
      if (!acc) return;

      const totalAcc = Math.sqrt(
        (acc.x || 0) ** 2 + (acc.y || 0) ** 2 + (acc.z || 0) ** 2,
      );

      updateDrivingData({
        acc_x: acc.x || 0,
        acc_y: acc.y || 0,
        acc_z: acc.z || 0,
        is_braking: (acc.y || 0) < -2,
        sudden_stop: totalAcc > 22,
        is_online: true,
      });
    };

    window.addEventListener("devicemotion", handleMotion);

    // heartbeat UI
    intervalRef.current = setInterval(() => {
      setStatus("در حال ارسال realtime...");
    }, 1000);
  };

  // ================= STOP =================
  const stopSender = async () => {
    setIsRunning(false);
    setStatus("متوقف شد ❌");

    await updateDrivingData({
      is_online: false,
    });

    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    window.removeEventListener("devicemotion", () => {});
  };

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Stack spacing={3}>
        <Typography variant="h4" fontWeight={700}>
          📱 Sender (راننده)
        </Typography>

        <Typography>
          Session Code: <strong>{sessionCode}</strong>
        </Typography>

        <Chip
          label={status}
          color={isRunning ? "success" : "default"}
          variant="outlined"
        />

        {/* Controls */}
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            color="success"
            onClick={startSender}
            disabled={isRunning}
          >
            Start Sender
          </Button>

          <Button
            variant="contained"
            color="error"
            onClick={stopSender}
            disabled={!isRunning}
          >
            Stop Sender
          </Button>
        </Stack>

        <Paper elevation={3} sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Typography>این صفحه را روی گوشی راننده باز نگه دار</Typography>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}
