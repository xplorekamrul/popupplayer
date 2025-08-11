import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Floating YouTube Player",
  description: "Draggable and resizable YouTube popup",
  icons: {
    icon: "/favicon.ico", 
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
