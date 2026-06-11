"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  Container,
  Typography,
  Stack,
  Paper,
  Chip,
  Divider,
} from "@mui/material";

const supabase = createClient();

export default function Viewer() {
  const [sessionCode] = useState("TEST124");
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("در حال اتصال...");

  // 🔄 fetch latest fallback
  const fetchLatestData = async () => {
    const { data: latest } = await supabase
      .from("driving_data")
      .select("*")
      .eq("session_code", sessionCode)
      .single();

    if (!latest) {
      setData(null);
      setStatus("منتظر Sender...");
      return;
    }

    // 🔴 offline check
    if (latest.is_online === false) {
      setData(null);
      setStatus("Sender offline...");
      return;
    }

    // ⏱ stale check
    const lastUpdate = new Date(latest.updated_at).getTime();
    const now = Date.now();

    // if (now - lastUpdate > 10000) {
    //   setData(null);
    //   setStatus("Sender disconnected...");
    //   return;
    // }

    setData(latest);
    setStatus("Live ✓");
  };

  useEffect(() => {
    fetchLatestData();

    const channel = supabase
      .channel(`driving-${sessionCode}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "driving_data",
          filter: `session_code=eq.${sessionCode}`,
        },
        (payload) => {
          if (!payload.new) return;

          const newData = payload.new;

          // 🔴 sender offline
          if (newData.is_online === false) {
            setData(null);
            setStatus("منتظر Sender...");
            return;
          }

          setData(newData);
          setStatus(`Live - ${new Date().toLocaleTimeString("fa-IR")}`);
        },
      )
      .subscribe((status) => {
        console.log("Realtime:", status);

        if (status === "SUBSCRIBED") {
          setStatus("متصل به realtime ✓");
        }
      });

    // 🔁 backup polling
    const interval = setInterval(() => {
      fetchLatestData();
    }, 3000);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [sessionCode]);

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Stack spacing={3}>
        <Typography variant="h4" fontWeight={700}>
          👀 Viewer (ناظر)
        </Typography>

        <Typography>
          Session Code: <strong>{sessionCode}</strong>
        </Typography>

        <Chip
          label={status}
          color={data ? "success" : "default"}
          variant="outlined"
        />

        <Divider />

        {data ? (
          <Paper elevation={3} sx={{ p: 4 }}>
            <Stack spacing={2}>
              <Typography>
                🚗 سرعت:{" "}
                <strong>{Number(data.speed_kmh || 0).toFixed(1)} km/h</strong>
              </Typography>

              <Typography>
                🧭 جهت: <strong>{Number(data.heading || 0).toFixed(0)}°</strong>
              </Typography>

              <Typography>
                📍 موقعیت: {data.latitude?.toFixed(6)},{" "}
                {data.longitude?.toFixed(6)}
              </Typography>

              <Typography
                color={data.is_braking ? "error.main" : "success.main"}
                fontWeight={600}
              >
                ⚡ ترمز: {data.is_braking ? "فعال 🚨" : "خیر"}
              </Typography>

              <Typography
                color={data.sudden_stop ? "warning.main" : "success.main"}
                fontWeight={600}
              >
                ⛔ توقف ناگهانی: {data.sudden_stop ? "بله ⚠️" : "خیر"}
              </Typography>

              <Divider />

              <Typography variant="caption" color="text.secondary">
                آخرین آپدیت:{" "}
                {data.updated_at
                  ? new Date(data.updated_at).toLocaleTimeString("en-GB")
                  : "-"}
              </Typography>
            </Stack>
          </Paper>
        ) : (
          <Paper sx={{ p: 4, textAlign: "center" }}>
            <Typography color="text.secondary">
              منتظر داده از Sender...
            </Typography>
          </Paper>
        )}
      </Stack>
    </Container>
  );
}
