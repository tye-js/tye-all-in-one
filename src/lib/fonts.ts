import { Inter, JetBrains_Mono } from "next/font/google";

// 配置主要字体 - Inter (Turbopack 兼容配置)
// 注意：所有配置项必须使用字面量值，简化配置以确保 Turbopack 兼容性
export const geistSans = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

// 配置等宽字体 - JetBrains Mono (Turbopack 兼容配置)
export const geistMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

// 字体类名组合
export const fontClassNames = `${geistSans.variable} ${geistMono.variable} antialiased`;

// 导出字体变量用于 CSS
export const fontVariables = {
  sans: geistSans.variable,
  mono: geistMono.variable,
};
