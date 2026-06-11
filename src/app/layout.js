import { ReactNode } from "react";

export const metadata = {
  title: "Navigation App",
  description: "Viewer and Sender Navigation",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
