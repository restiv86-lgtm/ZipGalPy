import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "86px", background: "linear-gradient(120deg, #f2fbf8, #e5f2ff)", color: "#193534" }}>
      <div style={{ display: "flex", width: 70, height: 70, alignItems: "center", justifyContent: "center", borderRadius: 20, background: "#087f72", color: "white", fontSize: 48 }}>⌂</div>
      <div style={{ marginTop: 40, fontSize: 68, fontWeight: 700, letterSpacing: -4 }}>내 집의 모든 정보를 한곳에, 집갈피</div>
      <div style={{ marginTop: 22, color: "#50716a", fontSize: 30 }}>스마트 주거 정보 관리 서비스</div>
    </div>,
    size,
  );
}
