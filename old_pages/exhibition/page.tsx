"use client"

import { useState } from "react"
import ExhibitionPage from "@/features/exhibition/ExhibitionPage"
import ContentPage from "@/features/exhibition/ContentPage"

export default function ExhibitionRoute() {
  const [view, setView] = useState<"exhibition" | "content">("exhibition")

  return (
    <>
      {view === "exhibition" && (
        <ExhibitionPage onExplore={() => setView("content")} />
      )}
      {view === "content" && (
        <ContentPage onBack={() => setView("exhibition")} />
      )}
    </>
  )
}