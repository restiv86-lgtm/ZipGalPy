import Link from "next/link";

export function Logo({ href = "#top", className = "" }: { href?: string; className?: string }) {
  return <Link className={`logo ${className}`.trim()} href={href} aria-label="집갈피 홈으로 이동"><i aria-hidden="true">⌂</i>집갈피</Link>;
}
