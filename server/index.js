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

app.post('/api/download', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'No URL provided' });
  await ensureDownloadsDir();
  try {
    const output = await ytdlp.downloadAsync(url, {
      output: path.join(DOWNLOADS_DIR, '%(title)s.%(ext)s'),
      format: {
        filter: 'audioandvideo',
        type: 'mp4',
        quality: 'highest',
      },
      onProgress: (progress) => {
        console.log(progress);
      },
    });
    // Check if file exists
    if (output && output.length > 0) {
      const filename = output[0] && output[0].filename ? output[0].filename : '';
      console.log('Sending download complete response to client:', output);
      res.json({ message: 'Download complete', output, filename });
    } else {
      console.log('Download failed: No output file.');
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
