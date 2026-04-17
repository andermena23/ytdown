# YTDOWN

A premium, cross-platform YouTube downloader toolkit built with a sleek Vue 3 frontend and an ExpressJS backend, utilizing the `ytdlp-nodejs` wrapper.

---

## ⚡ Features
- **"Velocity Protocol" Design**: A high-end dark mode aesthetic featuring glassmorphism, gradients, micro-animations, and a responsive mobile layout.
- **Dynamic Settings Hub**: Seamlessly configure backend/frontend network ports and destination directories dynamically through the `.env` via the intuitive UI.
- **Smart Queue Protocol**: Real-time server-sent events track precise download speeds, ETAs, and aggregate sizes of pending/failed/complete downloads.
- **Advanced Playlist Processing**: In-depth playlist parsing natively aggregates total running duration and carefully maps identical queue items to monitor overall checklist progress.
- **Cross-Platform System Controls**: Uses native Node functionality to gracefully and securely orchestrate or reboot port-allocated servers uniformly across Windows, macOS, and Linux without risking OS-level hangs.

---

## 🛠️ Installation

1. Clone this repository:
```sh
git clone https://github.com/andermena23/ytdown.git
cd ytdown
```

2. Install all core modules directly via the unified setup command:
```sh
npm run install-all
```

---

## 🚀 Usage

You can safely spawn the primary network loops entirely through universal PMs (Node.js required).

**Launch the toolkit:**
```sh
npm run start
```
*This boots the API and initiates Vite in concurrency.*

**Safely reboot the toolkit:**
```sh
npm run restart
```
*If you swap API ports in your settings or a process hangs, this meticulously seeks and destroys active listeners tied to the port specifications configured in your `.env`.*

**Default Addressing:**
By default, the UI initializes at `http://localhost:5173` while the Express logic binds natively to `http://localhost:3025`. Both variables can be mutated via the embedded configuration `.env` file or directly inside the `Settings` UI.

---

## 📂 Project Structure

```text
/ (root)
├── launch.js        # Universal concurrent instantiation
├── restart.js       # Target port killing & system reboot handler
├── .env             # Mappable deployment settings
├── server/          # ExpressJS core logic & FFmpeg registry
│   └── downloads/   # Localized destination default
├── vue-app/         # Vue 3 "Velocity Protocol" single-file interface
```

---

## License
MIT