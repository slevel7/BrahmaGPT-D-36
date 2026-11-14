import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "BrahmaGPT · Singularity",
  description:
    "D-36 administrative productivity workspace. Demonstration environment.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
