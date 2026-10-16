import Link from "next/link";

export function Logo({ href = "#top", className = "" }: { href?: string; className?: string }) {
  return <Link className={`logo ${className}`.trim()} href={href} aria-label="집갈피 홈으로 이동"><svg width="30" height="34" viewBox="0 0 30 34" aria-hidden="true"><path d="M4 2h22v30L15 25 4 32Z" fill="currentColor"/><path d="m9 15 6-5 6 5v7H9Z" fill="#e4edb2"/></svg>집갈피</Link>;
}
