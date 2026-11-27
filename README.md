# Spotlytics

**Your Spotify, in numbers.** Upload your Spotify Extended Streaming History and
see how you really listen: your top artists and songs, when you listen, on which
devices, and how often you skip.

🔗 **[spotlytics-five.vercel.app](https://spotlytics-five.vercel.app)**

No accounts and no database: your files are analyzed and then discarded.

> Independent project, not affiliated with Spotify.

## Features

- **Charts:** listening over time, by hour and by day, devices, play length, and how plays start and end.
- **Rankings:** top artists, songs, albums and podcasts, your most skipped tracks and your biggest days.
- **History:** a searchable list of your latest plays.
- **Filters:** narrow everything down by date, artist, device, content type and more.
- **Share cards:** turn your stats into images for Instagram or TikTok stories, or square posts.

## How to use it

1. Request your **Extended streaming history** at [spotify.com/account/privacy](https://www.spotify.com/account/privacy/).
2. When Spotify emails you the ZIP, unzip it.
3. Upload the `Streaming_History_Audio_*.json` files on the site.

## Project structure

| Folder | What it is |
|---|---|
| [`frontend/`](frontend) | Web app: React + Vite |
| [`backend/`](backend) | API that processes the history: FastAPI + pandas |

Each folder has its own README with setup steps.

## Running locally

```bash
# Backend
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Frontend (in another terminal)
cd frontend
npm install
npm run dev
```

Then open http://localhost:5173.

## Tech stack

React · Vite · Plotly · FastAPI · pandas

---

Designed and developed by [DaNYsZ99](https://github.com/DanySZ9).
