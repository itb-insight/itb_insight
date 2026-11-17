### Fallback:
If, by check, the loading of the blender model is too heavy, then use the .webm fallback. The landing page is divided into 3 sections of the scroll:
- Section 1: 0:00 - 0:13
- Transtion 1-2: 0:13 - 0:15
- Section 2: 0:15 - 0:28
- Transition 2-3: 0:28 - 0:29
- Section 3: 0:29 - 0:44
Both the mobile (9:16) and desktop (16:9) versions shares the same time stamp.

The blender model is to be awaited. (Currently only the fallback is implemented — the page always uses the video.)

The sections corresponds to the part of the landing page of scroll. Since its the percentage of the page, it needs to be tuned manually to fit.
SECTION 1: Countdown, the "ITB Insight" explanation, and the event stats.
<transition 1-2>
SECTION 2: gallery through timeline.
<transition 2-3>
SECTION 3: Partners and below.

### Playback behaviour
- **Sections loop.** While the viewport is inside a section's part of the scroll, that section's
  part of the video plays at normal speed and loops (e.g. staying in Section 2 loops 0:15 → 0:28).
- **Transitions follow the scroll.** Inside a transition's part of the scroll the video pauses and
  the transition footage is scrubbed by the scroll position, forwards and backwards.
- Leaving a transition before it finishes (scrolling down into the next section) plays the rest of
  it at normal speed into the section loop instead of cutting. Scrolling back up into a section
  starts that section's loop from its beginning.
- With "reduce motion" turned on in the OS, sections show a still frame instead of looping.

Where the transitions sit on the page (`TRANSITIONS` in
`src/features/landing/components/ScrollVideoBackground/ScrollVideoBackground.tsx`):
- Transition 1-2: from the gallery's top entering at the bottom of the screen, until it is 25% from
  the top of the screen.
- Transition 2-3: same, using the sponsors ("Our Sponsors") section.
Everything above / between / below those is Section 1 / 2 / 3. Tune the `viewport` values there.

### Background transparency
The video sits behind the page, so the background layers (page gradient, background objects, hero
patterns) are semi-transparent. Content (text, timeline, cards, etc.) is not affected.
Knobs at the top of `src/features/landing/LandingPage.module.css`:
- `--landing-bg-opacity` — opacity of all background layers (0 = pure video, 1 = video hidden).
- `--landing-bg-opacity-countdown` — the same while the countdown (hero) is on screen; normally lower
  so more video shows. It fades to `--landing-bg-opacity` while scrolling out of the hero
  (`FADE_START` / `FADE_END` in `ScrollVideoBackground.tsx`).

### Files (`fallback/`)
- `scrub-16x9.{webm,mp4}` — desktop/landscape, 1280×720.
- `scrub-9x16.{webm,mp4}` — mobile/portrait, 720×1280.
- These are re-encodes of the `_MConverter.eu_ONE TAKE *.webm` originals with a keyframe every 10
  frames (the originals had one every ~5 s, which makes seeking stutter). WebM/VP9 is used where
  supported, MP4/H.264 otherwise (older iOS Safari). Portrait viewports get the 9:16 video.
- To re-export from a new render:
  ```
  ffmpeg -i in.webm -an -vf scale=1280:720 -c:v libvpx-vp9 -crf 40 -b:v 0 -g 10 -keyint_min 10 -row-mt 1 scrub-16x9.webm
  ffmpeg -i in.webm -an -vf scale=1280:720 -c:v libx264 -preset slow -crf 28 -g 10 -keyint_min 10 -sc_threshold 0 -pix_fmt yuv420p -movflags +faststart scrub-16x9.mp4
  ```
  (use `scale=720:1280` and `scrub-9x16.*` for the portrait one). If the timestamps change, update
  `SECTIONS` and `TRANSITIONS[].time` in `ScrollVideoBackground.tsx` and the list above.
