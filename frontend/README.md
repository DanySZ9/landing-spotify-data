# Your Spotify, in numbers

Upload your Spotify **Extended Streaming History** and explore how you really
listen to music: your top artists, albums and songs, when you listen, on which
devices, and how often you skip.

Everything is processed on the fly: your files are analyzed and discarded, with
no accounts, passwords or database.

> Independent project, not affiliated with Spotify.

## What you can discover

**Charts**
- Hours listened per month
- What time of day you listen most
- Heatmap of days and hours
- Devices you listen on
- How you play: shuffle, skipped, offline, private session
- How long each play lasts
- How your plays start and end

**Rankings and tables**
- Top artists, songs, albums and podcasts
- Songs you skip the most
- Your biggest listening days
- Your latest plays

**Filters**
Date range, artist, content type (music or podcasts), device, minimum play
duration, and skipped / shuffle / offline / incognito.

**Planned:** shareable cards of your tops and stats, ready to post on social media.

## How it works

1. Request your data at spotify.com/account/privacy (Extended streaming history).
2. Upload the `Streaming_History_Audio_*.json` files.
3. Explore your charts and rankings, and refine them with filters.

## Tech stack

- **Frontend:** React, Vite, plain CSS, Plotly (react-plotly.js)
- **Backend:** FastAPI, pandas, Plotly