"use client";

import Link from "next/link";
import { ApiService } from "@/lib/api";

interface LogoProps {
  height?: number; // rendered height in px (defaults to 32)
  className?: string;
}

export function Logo({ height = 32, className = "" }: LogoProps) {
  // 直接使用文字占位符，不再使用图片
  
  return (
    <Link
      href="/"
      className={`flex items-center ${className}`}
      aria-label="AI ThreadStash Home"
      style={{ height }}
    >
      <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">AI ThreadStash</span>
    </Link>
  );

}

export default Logo;