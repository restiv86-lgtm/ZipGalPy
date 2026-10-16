import type { ReactNode } from "react";
export type AppIconName = "home" | "box" | "plus" | "user" | "people" | "search" | "arrow" | "camera" | "file" | "calendar" | "tool" | "wallet";
const paths: Record<AppIconName, ReactNode> = {
    home: <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/></>,
    box: <><path d="m3 7 9-4 9 4-9 4Z"/><path d="M3 7v10l9 4 9-4V7M12 11v10M7.5 5l9 4"/></>,
    plus: <path d="M12 5v14M5 12h14"/>, user: <><circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/></>,
    people: <><circle cx="9" cy="8" r="3"/><path d="M2 20v-2a7 7 0 0 1 14 0v2M16 5a3 3 0 0 1 0 6M19 14a6 6 0 0 1 3 6"/></>,
    search: <><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></>, arrow: <path d="M4 12h16m-6-6 6 6-6 6"/>,
    camera: <><path d="M3 7h4l2-3h6l2 3h4v14H3Z"/><circle cx="12" cy="13" r="4"/></>,
    file: <><path d="M5 2h9l5 5v15H5ZM14 2v6h5M8 13h8M8 17h6"/></>, calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 2v6M17 2v6M3 11h18M7 15h3M14 15h3"/></>,
    tool: <path d="m14 6 4-4a6 6 0 0 1-7 8L3 18a2 2 0 0 0 3 3l8-8a6 6 0 0 0 8-7l-4 4Z"/>,
    wallet: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 8V4l14-2v3M21 11h-6v6h6M17 14h1"/></>,
};
export function AppIcon({ name, size = 22, className }: {
    name: AppIconName;
    size?: number;
    className?: string;
}) { return <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{paths[name]}</svg>; }
