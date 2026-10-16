"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppIcon, type AppIconName } from "./app-icon";
const links: {
    href: string;
    label: string;
    icon: AppIconName;
}[] = [{ href: "/dashboard", label: "홈", icon: "home" }, { href: "/items", label: "내 물건", icon: "box" }, { href: "/items/new", label: "물건 추가", icon: "plus" }, { href: "/apartments", label: "이웃", icon: "people" }, { href: "/account", label: "내 정보", icon: "user" }];
export function AppNavigation() { const path = usePathname(); return <nav className="app-bottom-nav" aria-label="모바일 주요 메뉴">{links.map(link => { const add = link.href === "/items/new"; const active = add ? path === "/items/new" : link.href === "/items" ? path === "/items" || path.startsWith("/homes/") && path.includes("/items") : path.startsWith(link.href); return <Link key={link.href} href={link.href} className={add ? "app-add" : undefined} aria-current={active ? "page" : undefined} aria-label={link.label}><AppIcon name={link.icon} size={24}/><span>{add ? "추가" : link.label}</span></Link>; })}</nav>; }
