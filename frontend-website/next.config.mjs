// Next.js configuration migrated from next.config.ts to next.config.mjs (ESM)
// 保留原有配置，去除 TypeScript 类型并使用 ESM 导出

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // 自定义构建目录以绕过 Windows 对 .next/trace 的占用问题
  distDir: '.next-build',

  // Optimize for production
  compress: true,

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' }
        ]
      }
    ];
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },

  // Image optimization
  images: {
    domains: ['avatars.githubusercontent.com', 'lh3.googleusercontent.com'],
    formats: ['image/avif', 'image/webp'],
  },

  // Webpack configuration
  webpack: (config, { dev }) => {
    // Production optimizations
    if (!dev) {
      config.optimization.minimize = true;
    }
    return config;
  },
};

export default nextConfig;