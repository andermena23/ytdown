<template>
  <div id="app">
    <h1>Video Downloader</h1>
    <form @submit.prevent="handleDownload">
      <input v-model="videoUrl" type="text" placeholder="Enter video URL or ID" required />
      <button type="submit">Download</button>
    </form>
    <p v-if="message">{{ message }}</p>
    <div v-if="downloads.length" class="queue">
      <h2>Download Queue</h2>
      <ul>
        <li v-for="(item, idx) in downloads" :key="idx">
          <span v-if="item.status === 'pending'">⏳</span>
          <span v-else-if="item.status === 'done'">✅</span>
          <span v-else-if="item.status === 'failed'" style="color: #e74c3c">❌</span>
          <span class="url">{{ item.url }}</span>
          <span v-if="item.filename" class="filename"> — {{ item.filename }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      videoUrl: '',
      message: '',
      downloads: []
    };
  },
  methods: {
    async handleDownload() {
      this.message = '';
      const url = this.videoUrl.trim();
      if (!url) return;
      // Add to queue as pending
      const idx = this.downloads.length;
  this.downloads.push({ url, status: 'pending', filename: '' });
      try {
        const result = await this.downloadVideo(url);
        console.log('Frontend: Download complete response received', result);
        let filename = '';
        if (result && result.filename) {
          filename = result.filename;
        } else if (result && result.output && Array.isArray(result.output) && result.output[0]) {
          if (typeof result.output[0] === 'string') {
            // Sometimes output[0] is a string path
            filename = result.output[0];
          } else if (result.output[0].filename) {
            filename = result.output[0].filename;
          }
        }
        this.downloads[idx] = { url, status: 'done', filename };
        this.downloads = [...this.downloads]; // trigger reactivity
        this.message = result && result.message ? result.message : 'Download complete.';
      } catch (e) {
        this.downloads[idx] = { url, status: 'failed', filename: '' };
        this.downloads = [...this.downloads]; // trigger reactivity
        this.message = 'Failed to start download.';
      }
    },
    async downloadVideo(url) {
      // Call the backend API to start the download
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to start download');
      }
      return response.json();
    }
  }
};
</script>

<style>
body {
  background: linear-gradient(120deg, #181c24 0%, #232a36 100%);
  min-height: 100vh;
}

#app {
  max-width: 1400px;
  margin: 32px auto;
  padding: 32px 28px 28px 28px;
  border-radius: 18px;
  background: #232a36;
  box-shadow: 0 6px 32px 0 rgba(20,24,32,0.18), 0 1.5px 4px 0 rgba(20,24,32,0.10);
  font-family: 'Segoe UI', 'Roboto', Arial, sans-serif;
  border: none;
}

h1 {
  text-align: center;
  font-size: 2.1em;
  font-weight: 700;
  color: #e6eaf3;
  margin-bottom: 18px;
  letter-spacing: 0.5px;
}

form {
  display: flex;
  gap: 10px;
  margin-bottom: 18px;
}

input[type="text"] {
  flex: 1 1 0%;
  padding: 10px 14px;
  border: 1.5px solid #374151;
  border-radius: 6px;
  font-size: 1em;
  background: #232a36;
  color: #e6eaf3;
  transition: border 0.2s, background 0.2s;
}
input[type="text"]:focus {
  outline: none;
  border-color: #42b983;
  background: #181c24;
}

button {
  padding: 10px 22px;
  border: none;
  background: linear-gradient(90deg, #42b983 60%, #24604a 100%);
  color: #fff;
  border-radius: 6px;
  font-size: 1em;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(66,185,131,0.10);
  transition: background 0.2s, transform 0.1s;
}
button:hover {
  background: linear-gradient(90deg, #24604a 60%, #42b983 100%);
  transform: translateY(-2px) scale(1.03);
}

p {
  text-align: center;
  color: #b6c2d1;
  margin: 10px 0 0 0;
  font-size: 1.08em;
}

.queue {
  margin-top: 32px;
  background: #1a202b;
  border-radius: 10px;
  padding: 18px 20px 12px 20px;
  box-shadow: 0 2px 12px rgba(20,24,32,0.10);
}
.queue h2 {
  margin: 0 0 12px 0;
  font-size: 1.15em;
  color: #e6eaf3;
  font-weight: 600;
}
.queue ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
.queue li {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  padding: 7px 0;
  border-bottom: 1px solid #232a36;
  font-size: 1em;
}
.queue li:last-child {
  border-bottom: none;
}
.queue .url {
  margin-left: 10px;
  font-size: 0.99em;
  word-break: break-all;
  color: #b6c2d1;
}
.queue .filename {
  margin-left: 6px;
  color: #7a869a;
  font-size: 0.97em;
  font-style: italic;
  max-width: 60vw;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.queue .title {
  margin-left: 6px;
  color: #7a869a;
  font-size: 0.97em;
  font-style: italic;
  max-width: 60vw;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.queue span {
  font-size: 1.15em;
}
.queue .url {
  font-weight: 500;
}
.queue .failed {
  color: #e74c3c;
}
</style>
