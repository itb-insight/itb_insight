"use client"

import { useState } from "react"

import { mockLiveBoard } from "../mockData"
import QuestLiveBoard from "./QuestLiveBoard"

export default function QuestLivePage() {
  const [initial] = useState(() => mockLiveBoard())
  return <QuestLiveBoard initial={initial} />
}
