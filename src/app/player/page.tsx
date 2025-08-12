import { Suspense } from "react"
import PlayerPopout from "../../component/PlayerPopout"

export default function PlayerPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-zinc-500">Loading video...</div>}>
      <PlayerPopout />
    </Suspense>
  )
}