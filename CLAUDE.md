@AGENTS.md

# Feedback triggers when building PWA / geofencing

The PWA (push notifications, service worker) and geofencing are deliberately not implemented
yet. When you build either, also wire the feedback triggers described in `docs/FEEDBACK.md`
("Triggers — status"):
- Time trigger: notify / pop up `/feedback/<slug>` when a form opens (`feedback_forms.opens_at`)
  for users who attended and have not submitted.
- Geofence exit: prompt for feedback when leaving the event area. Browsers give no background
  geolocation (iOS PWAs especially), so treat this as best-effort while the app is open and keep
  the QR + time trigger as the reliable paths.
