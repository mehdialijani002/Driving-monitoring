"use client";

import {
  Box,
  Button,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CellTowerIcon from "@mui/icons-material/CellTower";
import ArchitectureIcon from "@mui/icons-material/Architecture";
import MemoryIcon from "@mui/icons-material/Memory";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SpeedIcon from "@mui/icons-material/Speed";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function HomePage() {
  const router = useRouter();

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", pb: 10 }}>
      {/* 1. HERO SECTION */}
      <Box
        sx={{
          pt: { xs: 8, md: 12 },
          pb: { xs: 12, md: 16 },
          bgcolor: "primary.dark", // Fallback color
          color: "primary.contrastText",
          // Updated to use an image with a dark gradient overlay for text readability
          backgroundImage:
            "linear-gradient(to right,rgba(0, 0, 0, 0.85), rgba(0, 0, 0, 0.6)), url('/var_car_logo.png')",
          backgroundSize: "contain",
          backgroundPosition: "right  center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <Container maxWidth="lg">
          <Typography
            variant="overline"
            fontWeight={700}
            sx={{ letterSpacing: 2, opacity: 0.8, color: "white" }}
          >
            Project Hub
          </Typography>
          <Typography
            variant="h2"
            fontWeight={800}
            gutterBottom
            sx={{
              mt: 1,
              letterSpacing: "-0.02em",
              fontSize: { xs: "3rem", md: "4rem" },
              color: "white",
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Image
              src="/var_logo.png"
              alt="Soapbox Telemetry"
              width={100}
              height={100}
            />
            Soapbox Telemetry
          </Typography>
          <Typography
            variant="h6"
            sx={{
              maxWidth: 800,
              opacity: 0.9,
              mb: 5,
              fontWeight: 400,
              lineHeight: 1.6,
              color: "white",
            }}
          >
            A real-time, browser-based telemetry tracking system built
            specifically for soapbox racers and custom vehicles. Transform a
            standard smartphone into a professional-grade telemetry logger.
          </Typography>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={3}>
            <Button
              variant="contained"
              size="large"
              color="error"
              startIcon={<VisibilityIcon />}
              onClick={() => router.push("/viewer")}
              sx={{
                px: 4,
                py: 1.5,
                borderRadius: 2,
                fontWeight: 700,
                fontSize: "1.1rem",
              }}
              disableElevation
            >
              Open Viewer
            </Button>
            <Button
              variant="outlined"
              size="large"
              startIcon={<CellTowerIcon />}
              onClick={() => router.push("/sender")}
              sx={{
                px: 4,
                py: 1.5,
                borderRadius: 2,
                fontWeight: 700,
                fontSize: "1.1rem",
                color: "white",
                borderColor: "rgba(255,255,255,0.5)",
                "&:hover": {
                  borderColor: "white",
                  bgcolor: "rgba(255,255,255,0.1)",
                },
              }}
            >
              Launch Sender App
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* 2. MAIN CONTENT LAYOUT */}
      <Container maxWidth="lg" sx={{ mt: -8 }}>
        <Grid container spacing={4}>
          {/* Architecture & Tech Stack (Left Column) */}
          <Grid item size={{ xs: 12, md: 7 }}>
            <Paper
              elevation={3}
              sx={{ p: 4, borderRadius: 3, height: "100%", mb: 4 }}
            >
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <ArchitectureIcon
                  color="primary"
                  sx={{ mr: 1.5, fontSize: 32 }}
                />
                <Typography variant="h5" fontWeight={700}>
                  Idea & Architecture
                </Typography>
              </Box>
              <Typography variant="body1" color="text.secondary" paragraph>
                Standard real-time applications often rely on WebSockets, but
                mobile networks during a race can be spotty. This project is
                built on an <strong>Optimized HTTP Polling Architecture</strong>
                .
              </Typography>
              <Box
                component="ul"
                sx={{
                  pl: 2,
                  color: "text.secondary",
                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
                }}
              >
                <li>
                  <strong>The Sender:</strong> Hooks into native Device APIs
                  (Geolocation, DeviceMotion) to read physical forces and pushes
                  a payload every second.
                </li>
                <li>
                  <strong>The Database:</strong> Supabase acts as a high-speed
                  middleman with an append-only stream model and optimized
                  Composite Indexing for O(1) queries.
                </li>
                <li>
                  <strong>The Viewer:</strong> Queries every 1-2 seconds, using
                  data interpolation and CSS transitions to smooth the polling
                  interval into fluid visuals.
                </li>
              </Box>

              <Divider sx={{ my: 4 }} />

              <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                <MemoryIcon color="primary" sx={{ mr: 1.5, fontSize: 32 }} />
                <Typography variant="h5" fontWeight={700}>
                  Technology Stack
                </Typography>
              </Box>

              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
              >
                Frontend
              </Typography>
              <Stack
                direction="row"
                spacing={1}
                flexWrap="wrap"
                useFlexGap
                sx={{ mb: 2 }}
              >
                {[
                  "Next.js",
                  "React",
                  "Material UI",
                  "@mui/x-charts",
                  "Leaflet",
                ].map((tech) => (
                  <Chip
                    key={tech}
                    label={tech}
                    color="primary"
                    variant="outlined"
                    size="small"
                  />
                ))}
              </Stack>

              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
              >
                Backend & DB
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {["Supabase", "PostgreSQL", "Time-Series Indexing"].map(
                  (tech) => (
                    <Chip
                      key={tech}
                      label={tech}
                      color="secondary"
                      variant="outlined"
                      size="small"
                    />
                  ),
                )}
              </Stack>
            </Paper>
          </Grid>

          {/* Key Features (Right Column) */}
          <Grid item size={{ xs: 12, md: 5 }}>
            <Stack spacing={3}>
              <Card elevation={3} sx={{ borderRadius: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <SpeedIcon
                      color="secondary"
                      sx={{ mr: 1.5, fontSize: 28 }}
                    />
                    <Typography variant="h6" fontWeight={700}>
                      📱 Sender Features
                    </Typography>
                  </Box>
                  <Box
                    component="ul"
                    sx={{
                      pl: 2,
                      m: 0,
                      color: "text.secondary",
                      display: "flex",
                      flexDirection: "column",
                      gap: 1,
                    }}
                  >
                    <li>
                      <strong>GPS Velocity:</strong> Accurate m/s speed and
                      coordinates.
                    </li>
                    <li>
                      <strong>3D Accelerometer:</strong> Calculates G-Force
                      magnitude via 3D Pythagorean theorem.
                    </li>
                    <li>
                      <strong>Digital Compass:</strong> Tracks true vehicle
                      heading (0-360°).
                    </li>
                    <li>
                      <strong>Physics-Based Events:</strong> Auto-detects hard
                      braking (&lt; -2G) and sudden impacts (&gt; 22G).
                    </li>
                  </Box>
                </CardContent>
              </Card>

              <Card elevation={3} sx={{ borderRadius: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <VisibilityIcon
                      color="secondary"
                      sx={{ mr: 1.5, fontSize: 28 }}
                    />
                    <Typography variant="h6" fontWeight={700}>
                      💻 Viewer Features
                    </Typography>
                  </Box>
                  <Box
                    component="ul"
                    sx={{
                      pl: 2,
                      m: 0,
                      color: "text.secondary",
                      display: "flex",
                      flexDirection: "column",
                      gap: 1,
                    }}
                  >
                    <li>
                      <strong>Live Map:</strong> Breadcrumb trail of street
                      path.
                    </li>
                    <li>
                      <strong>Performance Charts:</strong> Scrolling timelines
                      for Speed and G-Force.
                    </li>
                    <li>
                      <strong>Safety Diagnostics:</strong> Step-charts for
                      extreme deceleration.
                    </li>
                    <li>
                      <strong>Live Compass:</strong> Rotating SVG nose heading
                      indicator.
                    </li>
                  </Box>
                </CardContent>
              </Card>
            </Stack>
          </Grid>

          {/* 3. DOCUMENTATION SECTION (Accordions) */}
          <Grid item size={{ xs: 12 }}>
            <Typography variant="h5" fontWeight={700} sx={{ mt: 4, mb: 3 }}>
              Documentation & Setup
            </Typography>

            <Accordion
              elevation={2}
              sx={{
                borderRadius: "12px !important",
                mb: 2,
                "&:before": { display: "none" },
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ p: 2 }}>
                <Typography variant="subtitle1" fontWeight={600}>
                  1. Database Setup (Supabase)
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 3, pt: 0, bgcolor: "grey.50" }}>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Run the following SQL script to build the time-series table
                  and performance index:
                </Typography>
                <Paper
                  sx={{
                    p: 2,
                    bgcolor: "#1e1e1e",
                    color: "#d4d4d4",
                    overflowX: "auto",
                  }}
                >
                  <pre style={{ margin: 0, fontSize: "0.85rem" }}>
                    {`DROP TABLE IF EXISTS driving_data;

CREATE TABLE driving_data (
  id uuid primary key default gen_random_uuid(),
  session_code text not null,
  created_at timestamptz not null default now(),
  -- GPS DATA
  latitude double precision,
  longitude double precision,
  speed_ms real default 0,
  heading real default 0,
  -- MOTION DATA
  acc_x real default 0,
  acc_y real default 0,
  acc_z real default 0,
  -- DRIVING EVENTS
  is_braking boolean default false,
  sudden_stop boolean default false,
  -- CONNECTION STATE
  is_online boolean default true
);

-- CRITICAL: Performance Index for rapid polling
CREATE INDEX idx_driving_data_session_time 
ON driving_data (session_code, created_at DESC);`}
                  </pre>
                </Paper>
              </AccordionDetails>
            </Accordion>

            <Accordion
              elevation={2}
              sx={{
                borderRadius: "12px !important",
                mb: 2,
                "&:before": { display: "none" },
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ p: 2 }}>
                <Typography variant="subtitle1" fontWeight={600}>
                  2. Local Installation & Mobile Testing
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 3, pt: 0, bgcolor: "grey.50" }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    mb: 3,
                    p: 2,
                    bgcolor: "warning.light",
                    borderRadius: 2,
                  }}
                >
                  <WarningAmberIcon color="warning" sx={{ mr: 2, mt: 0.5 }} />
                  <Typography variant="body2">
                    <strong>Secure Context Required:</strong> Apple (iOS) and
                    Google (Android) strictly mandate HTTPS to access hardware
                    sensors. If you open localhost on your phone, sensors will
                    be blocked. Use a secure tunnel like <code>ngrok</code> for
                    local testing.
                  </Typography>
                </Box>

                <Typography variant="subtitle2" gutterBottom>
                  Environment Variables (.env.local)
                </Typography>
                <Paper
                  sx={{
                    p: 2,
                    mb: 3,
                    bgcolor: "#1e1e1e",
                    color: "#d4d4d4",
                    overflowX: "auto",
                  }}
                >
                  <pre style={{ margin: 0, fontSize: "0.85rem" }}>
                    {`NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key`}
                  </pre>
                </Paper>

                <Typography variant="subtitle2" gutterBottom>
                  How to Run a Test
                </Typography>
                <Box
                  component="ol"
                  sx={{ pl: 3, color: "text.secondary", m: 0 }}
                >
                  <li>
                    Securely mount your smartphone inside the vehicle, ensuring
                    the screen is facing up or forward.
                  </li>
                  <li>
                    Open the <strong>Sender</strong> page on the phone and tap
                    "Start Sending".
                  </li>
                  <li>
                    Open the <strong>Viewer</strong> dashboard on your pit-wall
                    laptop.
                  </li>
                  <li>
                    As the vehicle moves, the dashboard will automatically pick
                    up the live signal!
                  </li>
                </Box>
              </AccordionDetails>
            </Accordion>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
