import { Suspense } from "react"
import HomePage from "../component/homeClient"

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-zinc-500">Loading…</div>}>
      <HomePage />
    </Suspense>
  )
}
