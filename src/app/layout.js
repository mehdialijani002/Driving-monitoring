import Providers from "./provider";

export const metadata = {
  title: "Navigation App",
  description: "Viewer and Sender Navigation",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
