import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Abstract Sponsored Transaction",
  description: "NFT mint with Paymaster on Abstract",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
