import express from 'express';
import { YtDlp } from 'ytdlp-nodejs';
import cors from 'cors';
import path from 'path';
import { exec } from 'child_process';
import dotenv from 'dotenv';
import fs from 'fs/promises';

// try root .env first, fallback to package level .env
try { dotenv.config({ path: '../.env' }); } catch(e) {}
dotenv.config();

const app = express();
const ytdlp = new YtDlp();

app.use(cors());
app.use(express.json());

// Parse CLI args
const args = process.argv.slice(2);
let portArg = null;
let dirArg = null;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--port' && args[i+1]) portArg = args[++i];
  else if (args[i] === '--dir' && args[i+1]) dirArg = args[++i];
}

const PORT = portArg || process.env.PORT || 3025;
const rawDir = dirArg || process.env.DOWNLOAD_DIR || 'downloads';

let DOWNLOADS_DIR = path.isAbsolute(rawDir) ? rawDir : path.resolve(process.cwd(), rawDir);
console.log('Resolved DOWNLOADS_DIR:', DOWNLOADS_DIR);

// Ensure downloads directory exists
async function ensureDownloadsDir() {
  try {
    await fs.mkdir(DOWNLOADS_DIR, { recursive: true });
  } catch (err) {
    console.error('Failed to create downloads directory:', err);
  }
}

app.get('/api/settings', async (req, res) => {
  try {
    let envContent = '';
    const envPath = path.resolve(process.cwd(), '../.env');
    try { envContent = await fs.readFile(envPath, 'utf8'); } catch(e) {}
    
    const settings = {
      PORT: process.env.PORT || 3025,
      VITE_PORT: process.env.VITE_PORT || 5173,
      DOWNLOAD_DIR: process.env.DOWNLOAD_DIR || 'downloads'
    };
    
    if (envContent) {
      const lines = envContent.split('\n');
      for (const line of lines) {
        if (line.trim().startsWith('PORT=')) settings.PORT = line.split('=')[1].trim();
        if (line.trim().startsWith('VITE_PORT=')) settings.VITE_PORT = line.split('=')[1].trim();
        if (line.trim().startsWith('DOWNLOAD_DIR=')) settings.DOWNLOAD_DIR = line.split('=')[1].trim();
      }
    }
    
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/settings', async (req, res) => {
  const { PORT, VITE_PORT, DOWNLOAD_DIR } = req.body;
  try {
    const envPath = path.resolve(process.cwd(), '../.env');
    const newContent = `PORT=${PORT || 3025}\nDOWNLOAD_DIR=${DOWNLOAD_DIR || 'downloads'}\nVITE_PORT=${VITE_PORT || 5173}\n`;
    await fs.writeFile(envPath, newContent, 'utf8');
    
    const rawDir = String(DOWNLOAD_DIR || 'downloads');
    DOWNLOADS_DIR = path.isAbsolute(rawDir) ? rawDir : path.resolve(process.cwd(), rawDir);
    await ensureDownloadsDir();
    
    res.json({ success: true, message: 'Settings saved. Restart command required to change ports.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// In-memory downloads registry: id -> { clients: Set<res>, progress, status, filename }
const downloads = new Map();

function generateId() {
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
}

function sendSSE(id, event, data) {
  const info = downloads.get(id);
  if (!info) return;
  for (const res of info.clients) {
    try {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (err) {
      // ignore individual client failures
      console.error('SSE send error', err?.message || err);
    }
  }
}

// Helper: get available formats for a video
app.post('/api/formats', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'No URL provided' });
  try {
    const info = await ytdlp.getInfoAsync(url);
    // If this is a playlist, info.entries will be an array of items
    if (Array.isArray(info?.entries) && info.entries.length > 0) {
      // provide a normalized list of items and some metadata about the playlist
      const items = info.entries.map(e => ({
        id: e.id || e.video_id || '',
        title: e.title || '',
        duration: e.duration || 0,
        thumbnail: (e.thumbnails && e.thumbnails.length && (e.thumbnails[e.thumbnails.length - 1].url || e.thumbnails[e.thumbnails.length - 1].url)) || (e.thumbnails && e.thumbnails[0] && (e.thumbnails[0].url || e.thumbnails[0]?.url)) || '',
        url: e.webpage_url || e.url || (e.id ? `https://www.youtube.com/watch?v=${e.id}` : '')
      }));

      // pick the first entry to surface available formats (so users can choose a format)
      const sample = info.entries[0];
      const formats = (sample?.formats || [])
        .filter(f => f.ext && f.format_id)
        .map(f => ({
          format_id: f.format_id,
          ext: f.ext,
          resolution: f.resolution || f.height || '',
          note: f.format_note || '',
          filesize: f.filesize || '',
          acodec: f.acodec,
          vcodec: f.vcodec,
          format: f.format,
        }));

      const metadata = {
        isPlaylist: true,
        playlistTitle: info.title || info.playlist_title || '',
        itemCount: items.length,
        items,
      };

      return res.json({ formats, metadata });
    }

    // single-video response
    const videoInfo = info;
    const formats = (videoInfo?.formats || [])
      .filter(f => f.ext && f.format_id)
      .map(f => ({
        format_id: f.format_id,
        ext: f.ext,
        resolution: f.resolution || f.height || '',
        note: f.format_note || '',
        filesize: f.filesize || '',
        acodec: f.acodec,
        vcodec: f.vcodec,
        format: f.format,
      }));

    // include some basic metadata for frontend preview
    const metadata = {
      isPlaylist: false,
      title: videoInfo?.title || '',
      duration: videoInfo?.duration || 0,
      thumbnails: videoInfo?.thumbnails || [],
      uploader: videoInfo?.uploader || ''
    };

    res.json({ formats, metadata });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a single download job and start the worker. Returns the job id.
function createDownloadJob(url, chosenFormat) {
  const id = generateId();
  downloads.set(id, { clients: new Set(), progress: {}, status: 'pending', filename: '', url, format: chosenFormat });

  (async () => {
    const info = downloads.get(id);
    try {
      info.status = 'downloading';
      sendSSE(id, 'started', { status: 'downloading' });

      function normalizeProgress(progress) {
        let p = progress;
        if (typeof p === 'string') {
          try {
            p = JSON.parse(p);
          } catch (e) {
            const idx = p.indexOf('{');
            if (idx !== -1) {
              try { p = JSON.parse(p.slice(idx)); } catch (e2) { p = { raw: progress }; }
            } else {
              p = { raw: progress };
            }
          }
        }
        const downloaded = (typeof p?.downloaded !== 'undefined') ? Number(p.downloaded) : ((typeof p?.downloaded_bytes !== 'undefined') ? Number(p.downloaded_bytes) : NaN);
        const total = (typeof p?.total !== 'undefined') ? Number(p.total) : ((typeof p?.total_bytes !== 'undefined') ? Number(p.total_bytes) : NaN);
        const percent = (!Number.isNaN(downloaded) && !Number.isNaN(total) && total > 0)
          ? Math.floor((downloaded / total) * 100)
          : (typeof p?.percentage !== 'undefined' ? Math.floor(Number(p.percentage)) : (p?.percent ?? 0));
        return { ...p, percent, downloaded, total };
      }

      const downloadOptions = {
        output: path.join(DOWNLOADS_DIR, '%(title)s.%(ext)s'),
        onProgress: (progress) => {
          const p = normalizeProgress(progress);
          info.progress = p;
          sendSSE(id, 'progress', p);
        },
        format: chosenFormat
      };

      if (typeof chosenFormat === 'object' && chosenFormat.filter === 'audioonly') {
        if (chosenFormat.type) downloadOptions.audioFormat = chosenFormat.type;
        if (typeof chosenFormat.quality !== 'undefined') downloadOptions.audioQuality = String(chosenFormat.quality);
        downloadOptions.extractAudio = true;
      }

      const output = await ytdlp.downloadAsync(url, downloadOptions);

      if (output && typeof output === 'string') {
        const mergeMatch = output.match(/\[Merger\] Merging formats into "([^"]+)"/);
        const destinationMatches = [...output.matchAll(/\[download\] Destination: (.+)/g)];
        const lastDestination = destinationMatches.at(-1)?.[1]?.trim();
        const extractMatch = output.match(/\[(?:ExtractAudio|ffmpeg|Postprocessor)\] Destination: ?"?(.+?)"?/i);
        let finalPath = mergeMatch?.[1]?.trim() || extractMatch?.[1]?.trim() || lastDestination || '';
        let filename = finalPath ? path.basename(finalPath) : '';

        if (!filename) {
          try {
            const title = await ytdlp.getTitleAsync(url);
            const allFiles = await fs.readdir(DOWNLOADS_DIR);
            const lowered = title.toLowerCase();
            const candidates = allFiles.filter(f => f.toLowerCase().includes(lowered.slice(0, Math.max(6, Math.min(lowered.length, 30)))));
            let best = '';
            let bestMtime = 0;
            for (const f of candidates) {
              try {
                const st = await fs.stat(path.join(DOWNLOADS_DIR, f));
                if (st.mtimeMs > bestMtime) {
                  bestMtime = st.mtimeMs;
                  best = f;
                }
              } catch (e) { }
            }
            if (best) filename = best;
          } catch (e) {}
        }

        info.status = 'done';
        info.filename = filename;
        sendSSE(id, 'done', { filename });

        for (const r of info.clients) { try { r.end(); } catch (e) {} }
        info.clients.clear();
      } else {
        info.status = 'failed';
        sendSSE(id, 'error', { error: 'Download failed: No output file.' });
      }
    } catch (error) {
      info.status = 'failed';
      sendSSE(id, 'error', { error: error?.message || String(error) });
      for (const r of info.clients) { try { r.end(); } catch (e) {} }
      info.clients.clear();
    }
  })();

  return id;
}

// Download endpoint with format selection (starts background job and returns id)
app.post('/api/download', async (req, res) => {
  const { url, format, format_id, force } = req.body;
  if (!url) return res.status(400).json({ error: 'No URL provided' });
  await ensureDownloadsDir();

  // normalize chosen format early so we can dedupe by (url + format)
  const chosenFormat = format || format_id || 'bestvideo+bestaudio/best';

  // dedupe: if a job with same url+format exists, return existing id
  for (const [existingId, entry] of downloads) {
    try {
      if (entry?.url === url) {
        const existingFmt = entry.format;
        if (JSON.stringify(existingFmt) === JSON.stringify(chosenFormat)) {
          if (entry.status === 'downloading' || entry.status === 'pending') {
            return res.json({ message: 'Download already in progress', id: existingId });
          }
          if (entry.status === 'done' && !force) {
            return res.json({ message: 'Already downloaded', id: existingId, filename: entry.filename, status: entry.status });
          }
        }
      }
    } catch (e) {}
  }

  const id = createDownloadJob(url, chosenFormat);
  return res.json({ message: 'Download started', id });
});

// SSE endpoint for download progress events
app.get('/api/download/events/:id', (req, res) => {
  const { id } = req.params;
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  if (!downloads.has(id)) {
    downloads.set(id, { clients: new Set(), progress: {}, status: 'pending', filename: '' });
  }

  const info = downloads.get(id);
  info.clients.add(res);

  // send initial state
  res.write(`event: init\n`);
  res.write(`data: ${JSON.stringify({ status: info.status, progress: info.progress, filename: info.filename })}\n\n`);

  req.on('close', () => {
    info.clients.delete(res);
  });
});

// Bulk download endpoint - accepts a playlist URL and starts jobs for each item
app.post('/api/download/bulk', async (req, res) => {
  const { url, format, format_id, items: requestedItems, force } = req.body;
  if (!url) return res.status(400).json({ error: 'No URL provided' });
  await ensureDownloadsDir();

  try {
    const info = await ytdlp.getInfoAsync(url);
    if (!Array.isArray(info?.entries) || info.entries.length === 0) {
      // Not a playlist -> fallback to single download
      const chosenFormat = format || format_id || 'bestvideo+bestaudio/best';
      const id = createDownloadJob(url, chosenFormat);
      return res.json({ message: 'Single download started', items: [{ id, url }] });
    }

    const entries = info.entries;
    // determine which entries to download. If `requestedItems` is provided and is an array
    // assume it contains 1-based indices (or ids) — support numeric indices for convenience.
    let selection = [];
    if (Array.isArray(requestedItems) && requestedItems.length > 0) {
      // if entries of numbers, treat as indices
      const nums = requestedItems.map(x => Number(x)).filter(n => !Number.isNaN(n));
      if (nums.length === requestedItems.length) {
        // convert 1-based indices to 0-based
        selection = nums.map(n => entries[n - 1]).filter(Boolean);
      } else {
        // otherwise try to match by id or url
        const set = new Set(requestedItems.map(String));
        selection = entries.filter(e => set.has(String(e.id)) || set.has(String(e.webpage_url)) || set.has(String(e.url)));
      }
    } else {
      selection = entries;
    }

    const chosenFormat = format || format_id || 'bestvideo+bestaudio/best';
    const results = [];

    for (const e of selection) {
      const itemUrl = e.webpage_url || e.url || (e.id ? `https://www.youtube.com/watch?v=${e.id}` : null);
      if (!itemUrl) continue;

      // dedupe check similar to single download
      let existingId = null;
      for (const [existingKey, entry] of downloads) {
        try {
          if (entry?.url === itemUrl) {
            const existingFmt = entry.format;
            if (JSON.stringify(existingFmt) === JSON.stringify(chosenFormat)) {
              if (entry.status === 'downloading' || entry.status === 'pending') {
                existingId = existingKey;
                break;
              }
              if (entry.status === 'done' && !force) {
                existingId = existingKey;
                break;
              }
            }
          }
        } catch (err) {}
      }

      if (existingId) {
        results.push({ id: existingId, url: itemUrl });
        continue;
      }

      const id = createDownloadJob(itemUrl, chosenFormat);
      results.push({ id, url: itemUrl, title: e.title || '' });
    }

    return res.json({ message: 'Bulk downloads started', items: results, total: results.length });
  } catch (err) {
    return res.status(500).json({ error: err?.message || String(err) });
  }
});

app.post('/api/open-downloads', (req, res) => {
  exec(`start "" "${DOWNLOADS_DIR}"`, (error) => {
    if (error) {
      console.error('Error opening downloads folder:', error);
      return res.status(500).json({ error: 'Failed to open folder' });
    }
    res.json({ success: true });
  });
});

app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Downloads will be saved to: ${DOWNLOADS_DIR}`);
  await ensureDownloadsDir();
  await ytdlp.downloadFFmpeg();
});
