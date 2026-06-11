"use client";

import { Button, Container, Stack, Typography, Box } from "@mui/material";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  return (
    <Box>
      <Stack spacing={4} sx={{ minHeight: "100vh" }}>
        <Typography variant="h3" fontWeight={700}>
          Main Page
        </Typography>

        <Button
          variant="contained"
          size="large"
          fullWidth
          onClick={() => router.push("/viewer")}
        >
          Go to Viewer
        </Button>

        <Button
          variant="outlined"
          size="large"
          fullWidth
          onClick={() => router.push("/sender")}
        >
          Go to Sender
        </Button>
      </Stack>
    </Box>
  );
}
