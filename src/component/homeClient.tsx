"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import YouTube, { YouTubeProps } from "react-youtube"
import { useSearchParams } from "next/navigation"

// Parse many YouTube link forms
function extractYouTubeId(raw: string): string | null {
  if (!raw) return null
  try {
    const url = new URL(raw.trim())
    if (url.hostname.includes("youtu.be")) {
      const id = url.pathname.split("/").filter(Boolean)[0]
      return id || null
    }
    if (url.searchParams.has("v")) return url.searchParams.get("v")
    if (url.pathname.startsWith("/shorts/")) return url.pathname.split("/")[2] || null
    if (url.pathname.startsWith("/live/")) return url.pathname.split("/")[2] || null
    if (url.pathname.startsWith("/embed/")) return url.pathname.split("/")[2] || null
    const m = raw.match(/[a-zA-Z0-9_-]{11}/)
    return m ? m[0] : null
  } catch {
    const m = raw.match(/[a-zA-Z0-9_-]{11}/)
    return m ? m[0] : null
  }
}

function clsx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ")
}

// Floating, draggable, resizable player (no external libs)
function FloatingPlayer({
  videoId,
  onClose,
  initial = { x: 24, y: 24, w: 480, h: 270 },
}: {
  videoId: string
  onClose: () => void
  initial?: { x: number; y: number; w: number; h: number }
}) {
  const [pos, setPos] = useState({ x: initial.x, y: initial.y })
  const [size, setSize] = useState({ w: initial.w, h: initial.h })
  const dragging = useRef<{ dx: number; dy: number } | null>(null)
  const resizing = useRef<{ startW: number; startH: number; sx: number; sy: number } | null>(null)

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      // If no button pressed anymore, stop any in‑progress drag/resize
      if (e.buttons === 0) {
        dragging.current = null
        resizing.current = null
        document.body.style.userSelect = ""
        return
      }

      const d = dragging.current
      if (d) {
        // local copy so we don't read from possibly nulled ref later
        const { dx, dy } = d
        const nextX = e.clientX - dx
        const nextY = e.clientY - dy
        setPos((p) => ({
          x: Math.max(0, Math.min(window.innerWidth - size.w, nextX)),
          y: Math.max(0, Math.min(window.innerHeight - size.h, nextY)),
        }))
        return
      }

      const r = resizing.current
      if (r) {
        const { startW, startH, sx, sy } = r
        const newW = Math.max(300, Math.min(window.innerWidth - pos.x, startW + (e.clientX - sx)))
        const newH = Math.max(170, Math.min(window.innerHeight - pos.y, startH + (e.clientY - sy)))
        setSize({ w: newW, h: newH })
      }
    }

    const onUp = () => {
      dragging.current = null
      resizing.current = null
      document.body.style.userSelect = ""
    }

    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
    return () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
    }
  }, [pos.x, pos.y, size.w, size.h])

  const opts: YouTubeProps["opts"] = {
    width: "100%",
    height: "100%",
    playerVars: { autoplay: 1, controls: 1, rel: 0, modestbranding: 1, playsinline: 1 },
  }

  const openPopOut = () => {
    const url = `/player?v=${encodeURIComponent(videoId)}`
    window.open(
      url,
      "yt-popout",
      "width=520,height=320,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=no"
    )
  }

  return (
    <div
      className="fixed z-[9999] rounded-xl shadow-2xl border border-zinc-200 bg-white overflow-hidden"
      style={{ left: pos.x, top: pos.y, width: size.w, height: size.h }}
    >
      {/* Title bar (drag handle) */}
      <div
        onMouseDown={(e) => {
          if (e.button !== 0) return
          const rect = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect()
          dragging.current = { dx: e.clientX - rect.left, dy: e.clientY - rect.top }
          document.body.style.userSelect = "none"
        }}
        className="cursor-move select-none flex items-center justify-between px-3 py-1.5 border-b bg-zinc-50"
      >
        <div className="text-xs font-medium text-black">Floating YouTube Player</div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={openPopOut}
            className="text-xs rounded-md border px-2 py-1 hover:bg-zinc-100 text-black border-black"
            title="Open pop-out window"
          >
            Pop‑out
          </button>
          <button
            onClick={onClose}
            className="rounded-md p-1 hover:bg-zinc-100"
            aria-label="Close"
            title="Close"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4">
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="black"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Player area (fills remaining space) */}
      <div className="relative w-full h-[calc(100%-34px)] bg-black">
        <YouTube videoId={videoId} opts={opts} className="absolute inset-0 w-full h-full" />
      </div>

      {/* Resize handle (bottom-right) */}
      <div
        onMouseDown={(e) => {
          if (e.button !== 0) return
          resizing.current = { startW: size.w, startH: size.h, sx: e.clientX, sy: e.clientY }
          document.body.style.userSelect = "none"
        }}
        className="absolute right-0 bottom-0 w-4 h-4 cursor-se-resize"
        style={{
          background:
            "linear-gradient(135deg, transparent 0 50%, rgba(0,0,0,0.15) 50% 100%)",
        }}
        title="Drag to resize"
      />
    </div>
  )
}

export default function HomePage() {
  const searchParams = useSearchParams()
  const [videoUrl, setVideoUrl] = useState("")
  const [videoId, setVideoId] = useState<string | null>(null)
  const [showFloat, setShowFloat] = useState(false)
  const [touched, setTouched] = useState(false)

  const error = useMemo(() => {
    if (!touched) return ""
    if (!videoUrl) return "Paste a YouTube link"
    return extractYouTubeId(videoUrl) ? "" : "Invalid YouTube URL"
  }, [videoUrl, touched])

  useEffect(() => {
    const v = searchParams.get("v")
    if (v && v.length >= 8) {
      setVideoId(v)
      setShowFloat(true)
    }
  }, [searchParams])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setTouched(true)
    const id = extractYouTubeId(videoUrl)
    if (id) {
      setVideoId(id)
      setShowFloat(true)
    }
  }

  return (
    <div className="min-h-screen bg-gray-300 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow">
        <h1 className="mb-4 text-center text-2xl font-bold text-black">Floating YouTube Player</h1>
        <form onSubmit={submit} className="space-y-3">
          <input
            type="text"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder="Paste YouTube link (watch/youtu.be/shorts/live/embed)"
            className={clsx(
              "w-full rounded-lg border px-3 py-2 text-sm outline-none transition",
              error ? "border-red-400 focus:border-red-500" : "border-zinc-300 focus:border-zinc-500 text-black"
            )}
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Play in Floating Window
            </button>
          </div>
          <p className="text-xs text-zinc-500">
            Tip: Use the player’s menu to enable <strong>Picture‑in‑Picture</strong> (PiP) if
            available.
          </p>
        </form>
      </div>

      {showFloat && videoId && (
        <FloatingPlayer
          videoId={videoId}
          onClose={() => {
            setShowFloat(false)
            setVideoId(null)
          }}
        />
      )}
    </div>
  )
}