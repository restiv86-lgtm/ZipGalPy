import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./enhancements.css";

export const metadata: Metadata = { title: "집갈피 | 내 집의 모든 정보를 한곳에", description: "집과 관련된 모든 정보를 쉽고 편리하게 관리하는 스마트 주거 정보 관리 서비스, 집갈피입니다.", metadataBase: new URL("https://zipgalpy.co.kr"), alternates: { canonical: "/" }, openGraph: { title: "집갈피 | 내 집의 모든 정보를 한곳에", description: "집과 관련된 모든 정보를 쉽고 편리하게 관리하세요.", url: "https://zipgalpy.co.kr", siteName: "집갈피", locale: "ko_KR", type: "website" } };
export const viewport: Viewport = { themeColor: "#087f72", width: "device-width", initialScale: 1 };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="ko"><body>{children}</body></html>; }
