"use client";

import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

// Create a Dark Theme instance
const darkTheme = createTheme({
  palette: {
    mode: "dark", // Tells MUI to use dark mode globally
    primary: {
      main: "#90caf9",
    },
    secondary: {
      main: "#f48fb1",
    },
    background: {
      default: "#121212", // Deep dark background for the page
      paper: "#1e1e1e", // Slightly lighter dark color for the Paper cards
    },
  },
});

export default function Providers({ children }) {
  return (
    <ThemeProvider theme={darkTheme}>
      {/* CssBaseline forces the dark background and white text globally */}
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
