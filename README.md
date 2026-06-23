# 🏎️ Soapbox Telemetry Dashboard

A real-time, browser-based telemetry tracking system built specifically for soapbox racers and custom vehicles.

This project transforms a standard smartphone into a professional-grade telemetry logger. The phone rides in the vehicle, captures raw sensor data (GPS, accelerometer, magnetometer), and streams it to a centralized database. A separate web-based dashboard fetches this data in real-time, visualizing speed, physical G-forces, vehicle heading, and a live map trajectory.

---

## 💡 The Project Idea & Architecture

Standard real-time applications often rely on WebSockets, but mobile networks during a race can be spotty. This project is built on an **Optimized HTTP Polling Architecture**.

1. **The Sender (Mobile Device):** Runs in the phone's mobile browser. It hooks into the native Device API (Geolocation, DeviceMotion, DeviceOrientation) to read physical forces and speed. It pushes a data payload to the database exactly once every second.
2. **The Database (Supabase):** Acts as the high-speed middleman. It uses an append-only stream model (inserting rows, never updating) combined with a highly optimized Composite Index to ensure data queries happen in O(1) time.
3. **The Viewer (Pit Wall Laptop):** A responsive dashboard that queries the database every 1-2 seconds. It uses data interpolation and CSS transitions to smooth out the polling interval, making the charts and map appear completely fluid and real-time.

---

## 🛠 Technology Stack

### Frontend (Viewer & Sender)

- **[Next.js](https://nextjs.org/) (React):** The core framework for routing and server-side rendering.
- **[Material UI](https://mui.com/):** Component library for a clean, professional interface.
- **`@mui/x-charts`:** Used for high-performance SVG rendering of live line charts and step charts.
- **[Leaflet](https://leafletjs.com/) & `react-leaflet`:** Powers the live route-tracking map using OpenStreetMap data.

### Backend & Database

- **[Supabase](https://supabase.com/):** An open-source Firebase alternative.
- **PostgreSQL:** The underlying database, utilizing specific indexing for sub-second time-series queries.

---

## ✨ Key Features

### 📱 Sender App

- **GPS Velocity Tracking:** Captures highly accurate m/s speed and coordinates.
- **3D Accelerometer Math:** Calculates total G-Force magnitude using the 3D Pythagorean theorem to measure structural stress and cornering limits.
- **Digital Compass:** Uses the magnetometer to track the true heading of the vehicle (0-360°).
- **Physics-Based Event Detection:** \* Automatically detects hard braking (`Y-axis force < -2G`).
  - Automatically detects sudden stops or crashes (`Total Magnitude > 22G`).

### 💻 Viewer Dashboard

- **Live Telemetry Map:** A dynamic Leaflet map that draws a breadcrumb trail of the vehicle's exact street path.
- **Performance Charts:** Scrolling timeline charts for Speed (m/s) and G-Force.
- **Safety Diagnostics:** Step-charts indicating exact moments of extreme deceleration.
- **Live Compass:** A dynamic, rotating SVG indicator showing the vehicle's real-time nose heading.

---

## 🚀 Getting Started

### 1. Database Setup

Create a new project in [Supabase](https://supabase.com/). Open the SQL Editor and run the following script to build the time-series table and the critical performance index:

```sql
DROP TABLE IF EXISTS driving_data;

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
ON driving_data (session_code, created_at DESC);
```

### 2. Local Installation

Clone the repository and install the dependencies:

```bash
npm install
npm install @mui/material @emotion/react @emotion/styled @mui/x-charts leaflet react-leaflet
```

Create a `.env.local` file in the root of your project:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Run the development server:

```bash
npm run dev
```

---

## ⚠️ Important: Mobile Sensor Requirements

Apple (iOS) and Google (Android) strictly mandate a secure context (`https://`) to access hardware sensors. **If you open `http://localhost:3000` or a local IP on your phone, the GPS and Accelerometer will be blocked.**

To test the sender locally, use a secure tunnel like **ngrok**:

1. Leave your Next.js server running.
2. In a new terminal, run: `npx ngrok http 3000`
3. Open the secure `https://<your-ngrok-id>.ngrok-free.app/sender` link on your phone.
4. Grant the requested Location and Motion permissions.

_(For production, deploy to Vercel, Netlify, or any host that provides standard HTTPS)._

---

## 🏁 How to Run a Test

1. Securely mount your smartphone inside the soapbox vehicle, ensuring the screen is facing up or forward.
2. Open the **Sender** page on the phone and tap **"Start Sending"**.
3. Open the **Viewer** dashboard on your pit-wall laptop.
4. As the vehicle moves, the dashboard will automatically pick up the live signal and begin graphing the physics of the run!


Developed by Mehdi Alijanibaei
mehdi.alijanibaei@stud.th-deg.de

