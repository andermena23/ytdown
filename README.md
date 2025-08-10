# YTDOWN

A YouTube downloader web application built with Vue 3 (frontend) and ExpressJS (backend), using the ytdlp-nodejs wrapper for video downloads.

---

## Features
- Download YouTube videos via a simple web interface
- Modern Vue 3 frontend (Vite)
- ExpressJS backend API
- Uses [yt-dlp](https://github.com/yt-dlp/yt-dlp) via ytdlp-nodejs
- Concurrently runs both frontend and backend for easy development

---

## Installation

1. Clone this repository:
	```sh
	git clone https://github.com/andermena23/ytdown.git
	cd ytdown
	```
2. Install all dependencies (root, server, and vue-app):
	```sh
	npm run install-all
	```

---

## Usage

To start the application in development mode (runs both server and frontend):
```sh
npm run dev
```

- The Vue app will be available at `http://localhost:5173` (default Vite port)
- The Express server will run at `http://localhost:3000` (default)

---

## Project Structure

```
/ (root)
├── server/      # ExpressJS backend
│   └── downloads/  # Downloaded files
├── vue-app/     # Vue 3 frontend (Vite)
```

---

## License
MIT