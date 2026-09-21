import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "집갈피 | ZipGalPy",
    short_name: "집갈피",
    description: "내 집의 모든 정보를 한곳에 관리하는 스마트 주거 정보 서비스",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#087f72",
  };
}
