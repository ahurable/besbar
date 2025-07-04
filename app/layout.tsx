import type React from "react"
import type { Metadata } from "next"
import localFont from "next/font/local";
import "./globals.css"

// font declaration

const yekanbakh = localFont({
    src: [
        {
        path: '../assets/font/YekanBakhFaNum-Thin.woff',
        weight: '300',
        style: 'normal'
        },
        {
        path: '../assets/font/YekanBakhFaNum-Light.woff',
        weight: '400',
        style: 'normal'
        },
        {
        path: '../assets/font/YekanBakhFaNum-Regular.woff',
        weight: '500',
        style: 'normal'
        },
        {
        path: '../assets/font/YekanBakhFaNum-SemiBold.woff',
        weight: '600',
        style: 'normal'
        },
        {
        path: '../assets/font/YekanBakhFaNum-Bold.woff',
        weight: '700',
        style: 'normal'
        },
        {
        path: '../assets/font/YekanBakhFaNum-ExtraBold.woff',
        weight: '800',
        style: 'normal'
        },
        {
        path: '../assets/font/YekanBakhFaNum-Black.woff',
        weight: '900',
        style: 'normal'
        },
        {
        path: '../assets/font/YekanBakhFaNum-ExtraBlack.woff',
        weight: '950',
        style: 'normal'
        }
    ]
    })


export const metadata: Metadata = {
  title: "سرویس حمل و نقل بار",
  description: "سرویس آنلاین حمل و نقل بار با قیمت مناسب",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body className={yekanbakh.className}>{children}</body>
    </html>
  )
}
