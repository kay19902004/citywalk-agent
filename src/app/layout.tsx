import type { Metadata, Viewport } from "next";
import { AppShell } from "./app-client";
import "./globals.css";
import "../styles/city-adventure.css";

export const metadata: Metadata = {
  title: "CityWalk 动态故事 Agent",
  description: "基于故事素材库的单人 CityWalk 叙事重组 MVP"
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
