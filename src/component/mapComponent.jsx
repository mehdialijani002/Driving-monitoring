"use client";

import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// This invisible component forces the map to pan and follow the car automatically
function MapRecenter({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng]);
  }, [lat, lng, map]);
  return null;
}

export default function LiveMap({ pathData }) {
  if (!pathData || pathData.length === 0) return null;

  // Extract array of [lat, lng] for the Polyline
  const positions = pathData.map((p) => [p.lat, p.lng]);
  const currentPos = positions[positions.length - 1];

  // We create a custom HTML dot to avoid Next.js image-loader bugs with Leaflet's default pins
  const customIcon = L.divIcon({
    className: "custom-car-icon",
    html: `<div style="background-color: #d32f2f; width: 14px; height: 14px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });

  return (
    <MapContainer
      center={currentPos}
      zoom={17} // Zoomed in tight for street-level driving
      style={{ height: "100%", width: "100%", zIndex: 1 }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap"
      />
      {/* Draws the blue trailing path */}
      <Polyline
        positions={positions}
        color="#1976d2"
        weight={5}
        opacity={0.8}
      />
      {/* Shows the red dot for current location */}
      <Marker position={currentPos} icon={customIcon} />
      {/* Keeps the map centered on the car */}
      <MapRecenter lat={currentPos[0]} lng={currentPos[1]} />
    </MapContainer>
  );
}
