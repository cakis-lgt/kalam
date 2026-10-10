import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ALIKHTIBAR — Arabic & English Speaking Proficiency Test",
  description:
    "Take the Speaking test in Arabic or English from anywhere, scored by real examiners. ALIKHTIBAR-standard speaking assessment (Pre-A1–C2) with self-paced video recording.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Source+Serif+4:opsz,wght@8..60,400;8..60,500;8..60,600;8..60,700&family=Amiri:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
