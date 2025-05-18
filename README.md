# Shot Me Down Tracker

This project implements a small proof of concept for the **Shot Me Down** retro shot tracking website. It is a Node.js/Express application with a SQLite database. Users can register, log in, and mark which of the 450 placeholder shots they've tried.

The server renders simple EJS templates and stores user progress. It also exposes a basic leaderboard and stats page. The styling is minimal, focusing on functionality rather than the full retro look described in [`docs/shot_me_down_prompt.md`](docs/shot_me_down_prompt.md).

## Usage

Install dependencies and start the server:

```bash
npm install
npm start
```

The app will run on `http://localhost:3000`.

This is an early prototype and omits many features from the original design (badges, avatars, QR codes, etc.). Pull requests are welcome!
