# design-sources

Originals and raw exports that the site does not load. They used to sit in `public/`, where every
file is uploaded with each deploy and served to anyone who requests it. Paths mirror their old
location under `public/` (e.g. `images/mor.png` was `public/images/mor.png`).

| File | What ships instead |
| --- | --- |
| `images/mor.png`, `oe.png`, `bpc.png`, `icon-bpc.png` | `public/images/*.webp`, 800 px wide (`icon-bpc.png` is the 2026 BPC logo, shipped as `public/assets/icon-bpc-2026.png` and `public/images/icon-bpc-2026.webp`; `bpc.png` is the old one) |
| `images/shape9.png`, `shape10.png`, `deco/decor2.png` | `public/images/*.webp`, `public/deco/decor2.webp` |
| `images/gallery/*.JPG` | `public/images/gallery/*.webp` |
| `images/bg-main.png`, `bg-main.webp`, `bg-main.png` | nothing: the landing background is a CSS gradient now (the old raster is kept in a comment in `LandingPage.module.css`) |
| `images/dashboard-bg.png` | nothing (unused) |
| `itb-model/Final Comp_Export4.glb` | nothing yet: the Blender model is not shipped (see `public/itb-model/ITB-MODEL.md`) |
| `itb-model/fallback/_MConverter.eu_ONE TAKE *.webm` | source renders for the scroll video |
| `itb-model/fallback/scrub-*.{webm,mp4}` | `public/itb-model/fallback/scrub-*-v2.mp4` |

## Re-encoding the scroll video

H.264 only (hardware-decoded on practically every phone; VP9 often is not, which costs scroll
smoothness), a keyframe every 10 frames so scrubbing seeks fast, and no audio:

```sh
ffmpeg -i "ONE TAKE 9.16.webm" -an -vf "scale=540:960:flags=lanczos" -c:v libx264 -preset veryslow \
  -tune animation -crf 32 -g 10 -keyint_min 10 -sc_threshold 0 -pix_fmt yuv420p -movflags +faststart scrub-9x16-v3.mp4
# desktop: scale=1280:720, -crf 31
```

Bump the version suffix in the file name when the content changes: `public/itb-model/` is served
with a one-year immutable cache (see `next.config.ts`).

These files are still in git history. To shrink clones, move them to Drive or Git LFS and delete
them here.
