"use client"

import React from "react"
import { useSearchParams } from "next/navigation"
import YouTube, { YouTubeProps } from "react-youtube"

export default function PlayerPopout() {
   const sp = useSearchParams()
   const v = sp.get("v") || ""

   const opts = {
      width: "100%",
      height: "100%",
      playerVars: { autoplay: 1, controls: 1, rel: 0, modestbranding: 1, playsinline: 1 },
   }

   return (
      <div className="w-screen h-screen bg-black">
         {v ? (
            <YouTube videoId={v} opts={opts} className="w-full h-full" />
         ) : (
            <div className="text-white p-4">No video id (?v=) provided.</div>
         )}
      </div>
   )
}