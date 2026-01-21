# CampusHub Video Editor Documentation

## Overview

The CampusHub Video Editor is a browser-based video editing application deployed on Vercel at [https://video-editor-eight-tau.vercel.app/](https://video-editor-eight-tau.vercel.app/).

It is a fork of the **DesignCombo React Video Editor** and uses **Remotion** as its core rendering engine.

---

## Tech Stack & Architecture

### Frontend Framework
- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **TailwindCSS 4** - Styling
- **Zustand** - State management
- **Framer Motion** - Animations

### Video Engine
| Component | Package | Purpose |
|-----------|---------|---------|
| **Timeline** | `@designcombo/timeline` | Visual timeline with tracks |
| **State Management** | `@designcombo/state` | Editor state (undo/redo) |
| **Animations** | `@designcombo/animations` | Built-in animations |
| **Transitions** | `@designcombo/transitions` | Video transitions |
| **Frames** | `@designcombo/frames` | Frame-by-frame rendering |

### Remotion (Video Rendering)
| Package | Purpose |
|---------|---------|
| `remotion` | Core video rendering |
| `@remotion/player` | In-browser video preview |
| `@remotion/renderer` | Export to MP4 |
| `@remotion/media-utils` | Audio/video utilities |
| `@remotion/transitions` | Transition effects |

### Backend Integration
- **Hugging Face Space** - FFmpeg processing backend
- **Pexels API** - Stock photos/videos
- **PostgreSQL** - Project database (via `kysely`)

---

## Features Status

### ✅ Working Features

| Feature | Description |
|---------|-------------|
| **Timeline Editing** | Drag-and-drop visual timeline |
| **Multi-track Support** | Multiple video/audio tracks |
| **Real-time Preview** | Instant playback preview |
| **Video Upload** | Local file upload support |
| **Resize/Crop** | 16:9, 9:16, 1:1 aspect ratios |
| **Undo/Redo** | Full history support |
| **Pexels Integration** | Search & add stock media |
| **Video Trimming** | Cut videos on timeline |
| **Speed Control** | Playback rate adjustment |
| **Export** | MP4 download via FFmpeg |

---

## How It Works

### 1. Video Preview (Remotion Player)
```
User uploads video → @remotion/player renders frames in browser
```
- Uses `<Player>` component from Remotion
- Real-time CSS transformations for effects
- Canvas-based rendering for preview

### 2. Timeline Editing (DesignCombo)
```
User edits → @designcombo/state updates → trackItemsMap stores changes
```
- `trackItemsMap` contains all video/audio segments
- Each item has: `id`, `trim.from`, `duration`, `playbackRate`, `details.src`
- Events dispatched via `@designcombo/events`

### 3. Video Export (FFmpeg via HF Space)
```
User clicks Export → /api/render extracts segments → HF Space FFmpeg processes → MP4 returned
```

**Flow:**
1. Frontend sends `design` object to `/api/render`
2. `extractSegmentsFromDesign()` parses timeline items
3. Creates `editPayload` with segments and settings
4. (Future) Sends to HF Space: `https://karansinghrathore820-myvirtualmachine.hf.space`
5. FFmpeg renders MP4
6. User downloads result

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/render` | POST | Start video export |
| `/api/render/[id]` | GET | Check render progress |
| `/api/uploads/presign` | POST | Get upload URL |
| `/api/uploads/url` | POST | Upload from URL |
| `/api/pexels` | GET | Search Pexels photos |
| `/api/pexels-videos` | GET | Search Pexels videos |
| `/api/transcribe` | POST | 🚫 Disabled |
| `/api/voices` | POST | 🚫 Disabled |

---

## Resize Options

| Preset | Dimensions | Use Case |
|--------|------------|----------|
| 16:9 | 1920×1080 | YouTube, desktop |
| 9:16 | 1080×1920 | TikTok, Reels, Shorts |
| 1:1 | 1080×1080 | Instagram, Facebook |

---

## Project Structure

```
video-editor/
├── src/
│   ├── app/
│   │   ├── api/            # API routes
│   │   │   ├── render/     # Video export
│   │   │   ├── uploads/    # File uploads
│   │   │   ├── pexels/     # Stock media
│   │   │   └── transcribe/ # (Disabled)
│   │   └── page.tsx        # Main page
│   ├── features/
│   │   └── editor/
│   │       ├── editor.tsx      # Main editor component
│   │       ├── navbar.tsx      # Top bar (undo, export, resize)
│   │       ├── timeline/       # Timeline UI
│   │       ├── player/         # Video preview
│   │       └── store/          # Zustand state
│   └── components/             # UI components
├── public/                     # Static assets
└── package.json
```

---

## Deployment

- **Frontend**: Vercel (Next.js)
- **Backend**: Hugging Face Spaces (FFmpeg/Python)

### Environment Variables

```env
# Required
PEXELS_API_KEY=your_pexels_api_key

# Optional
HF_SPACE_URL=https://karansinghrathore820-myvirtualmachine.hf.space
```

---

## Known Limitations

1. **Transcription disabled** - Requires external STT API
2. **AI Voices disabled** - Requires TTS service
3. **Browser rendering** - Complex projects may be slow
4. **Export depends on HF Space** - If HF Space is down, export fails

---

## Credits

- **Original**: [DesignCombo React Video Editor](https://github.com/designcombo/react-video-editor)
- **Video Engine**: [Remotion](https://remotion.dev/)
- **Stock Media**: [Pexels](https://pexels.com/)
