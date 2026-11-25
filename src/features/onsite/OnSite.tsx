"use client"

import { useCallback, useState } from "react"

import FeedbackPrompts from "./FeedbackPrompts"
import PresenceTracker from "./PresenceTracker"

/** D-day helpers for signed-in visitors: opt-in booth presence, and feedback prompts. */
export default function OnSite() {
  // Bumped when the tracker sees the visitor leave the event zone (geofence-exit trigger).
  const [exits, setExits] = useState(0)
  const onVenueExit = useCallback(() => setExits((count) => count + 1), [])

  return (
    <>
      <PresenceTracker onVenueExit={onVenueExit} />
      <FeedbackPrompts venueExits={exits} />
    </>
  )
}
