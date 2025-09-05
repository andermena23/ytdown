import express from 'express';
import { YtDlp } from 'ytdlp-nodejs';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const ytdlp = new YtDlp();

app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fs = await import('fs/promises');
const DOWNLOADS_DIR = path.resolve(process.cwd(), 'downloads');
console.log('Resolved DOWNLOADS_DIR:', DOWNLOADS_DIR);

// Ensure downloads directory exists
async function ensureDownloadsDir() {
  try {
    await fs.mkdir(DOWNLOADS_DIR, { recursive: true });
  } catch (err) {
    console.error('Failed to create downloads directory:', err);
  }
}

// Helper: get available formats for a video
app.post('/api/formats', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'No URL provided' });
  try {
    const info = await ytdlp.getInfo(url);
    const formats = info.formats
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
    res.json({ formats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Download endpoint with format selection
app.post('/api/download', async (req, res) => {
  const { url, format_id } = req.body;
  if (!url) return res.status(400).json({ error: 'No URL provided' });
  await ensureDownloadsDir();
  try {
    const downloadOptions = {
      output: path.join(DOWNLOADS_DIR, '%(title)s.%(ext)s'),
      onProgress: (progress) => {
        console.log(progress);
      },
    };

    // If format_id is provided, use it
    if (format_id) {
      downloadOptions.format = format_id;
    } else {
      // fallback to best available
      downloadOptions.format = 'bestvideo+bestaudio/best';
    }

    const output = await ytdlp.downloadAsync(url, downloadOptions);

    if (output && output.length > 0) {
      const filename = output[0]?.filename || '';
      res.json({ message: 'Download complete', output, filename });
    } else {
      res.status(500).json({ error: 'Download failed: No output file.' });
    }
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(3001, async () => {
  console.log('Server running on http://localhost:3001');
  console.log(`Downloads will be saved to: ${DOWNLOADS_DIR}`);
  await ensureDownloadsDir();
  await ytdlp.downloadFFmpeg();
});
