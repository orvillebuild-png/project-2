import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Project 2",
  description: "Nonprofit relationship, events, invitations, and RSVP platform"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
