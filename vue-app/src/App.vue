<template>
  <div id="app" class="font-body text-on-surface antialiased min-h-screen pb-20">
    <!-- TopAppBar -->
    <header class="fixed top-0 w-full z-50 bg-[#0e0e0e]/80 backdrop-blur-xl shadow-[0_20px_40px_rgba(139,255,195,0.06)] flex justify-between items-center px-6 h-16">
      <div class="flex items-center gap-3">
        <span class="material-symbols-outlined text-[#8bffc3]">cloud_download</span>
        <h1 class="text-2xl font-black tracking-tighter text-[#8bffc3] font-headline">YTDOWN</h1>
      </div>
      <div class="flex items-center gap-6">
        <nav class="hidden md:flex gap-8">
          <a @click.prevent="currentTab = 'Library'" :class="['font-manrope text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer hover:brightness-110', currentTab === 'Library' ? 'text-[#8bffc3]' : 'text-[#adaaaa]']">Library</a>
          <a @click.prevent="currentTab = 'Downloads'" :class="['font-manrope text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer hover:brightness-110', currentTab === 'Downloads' ? 'text-[#8bffc3]' : 'text-[#adaaaa]']">Downloads</a>
          <a @click.prevent="currentTab = 'History'" :class="['font-manrope text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer hover:brightness-110', currentTab === 'History' ? 'text-[#8bffc3]' : 'text-[#adaaaa]']">History</a>
        </nav>
        <button @click="openDownloadsFolder" class="text-[#adaaaa] hover:text-[#8bffc3] active:scale-95 transition-all duration-200" title="Open Downloads Folder">
          <span class="material-symbols-outlined">folder_open</span>
        </button>
        <button @click.prevent="currentTab = 'Settings'" :class="['transition-all active:scale-95 duration-200', currentTab === 'Settings' ? 'text-[#8bffc3]' : 'text-[#adaaaa] hover:brightness-110']" title="Configuration">
          <span class="material-symbols-outlined">settings</span>
        </button>
      </div>
    </header>

    <!-- Main Content Layout -->
    <main v-show="currentTab === 'Library'" class="pt-24 px-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
      <!-- Left Column: URL Input & Preview -->
      <div class="lg:col-span-7 space-y-8">
        <!-- URL Input Section -->
        <section class="space-y-4">
          <div class="flex flex-col space-y-2">
            <label class="font-headline text-[10px] font-bold uppercase tracking-[0.1em] text-on-surface-variant">Stream Source</label>
            <div class="relative group">
              <input 
                v-model="videoUrl"
                class="w-full h-14 bg-surface-container-lowest border border-outline/10 rounded-xl px-6 focus:outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/5 transition-all font-body text-on-surface placeholder:text-outline" 
                placeholder="Paste media URL here..." 
                type="text"
                @keyup.enter="fetchPreview"
              />
              <button 
                @click="fetchPreview"
                :disabled="loadingPreview"
                class="absolute right-2 top-2 h-10 px-6 rounded-lg bg-gradient-to-br from-primary to-primary-container text-on-primary-container font-headline font-bold text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
              >
                <span v-if="loadingPreview" class="spinner-small" aria-hidden="true"></span>
                <span v-else>Preview</span>
              </button>
            </div>
          </div>
        </section>

        <!-- Preview Section -->
        <section v-if="preview" class="glass-panel rounded-xl p-8 space-y-6">
          <div class="flex items-center justify-between">
            <h2 class="font-headline text-xl text-on-surface">{{ preview.isPlaylist ? 'Playlist Detected' : 'Active Selection' }}</h2>
            <div class="flex bg-surface-container-highest p-1 rounded-lg">
              <button 
                @click="selectedFormat = 'mp4'"
                :class="['px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-tighter transition-all', selectedFormat === 'mp4' ? 'bg-primary text-on-primary-container' : 'text-on-surface-variant hover:text-on-surface']"
              >
                MP4 Video
              </button>
              <button 
                @click="selectedFormat = 'mp3'"
                :class="['px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-tighter transition-all', selectedFormat === 'mp3' ? 'bg-primary text-on-primary-container' : 'text-on-surface-variant hover:text-on-surface']"
              >
                MP3 Audio
              </button>
            </div>
          </div>

          <!-- Video Preview -->
          <div v-if="!preview.isPlaylist" class="flex flex-col md:flex-row gap-8">
            <div class="relative w-full md:w-1/2 aspect-video rounded-xl overflow-hidden group">
              <img :src="preview.thumbnail" class="w-full h-full object-cover" />
              <div class="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors"></div>
            </div>
            <div class="w-full md:w-1/2 flex flex-col justify-center space-y-4">
              <div>
                <span class="font-label text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Ready to Process</span>
                <h3 class="font-headline text-2xl font-bold text-on-surface leading-tight mt-1">{{ preview.title }}</h3>
              </div>
              <div class="flex items-center gap-4 text-on-surface-variant">
                <div class="flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-[18px]">schedule</span>
                  <span class="font-label text-xs">{{ formatDuration(preview.duration) }}</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-[18px]">person</span>
                  <span class="font-label text-xs uppercase">{{ preview.uploader }}</span>
                </div>
              </div>
              <div class="flex gap-4">
                <button 
                  @click="startDownloadFromPreview"
                  class="flex-1 h-12 bg-surface-container-highest border border-primary/20 text-primary font-headline font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-primary/10 transition-all flex items-center justify-center gap-2"
                >
                  <span class="material-symbols-outlined">download</span>
                  Initialize
                </button>
                <button 
                  @click="preview = null"
                  class="h-12 px-6 bg-surface-container-highest border border-outline/10 text-on-surface-variant font-headline font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>

          <!-- Playlist Preview -->
          <div v-else class="space-y-6">
            <div class="flex items-center gap-6">
              <div class="w-32 aspect-video bg-surface-container-highest rounded-lg overflow-hidden flex items-center justify-center">
                <img v-if="preview.items[0]" :src="preview.items[0].thumbnail" class="w-full h-full object-cover opacity-50" />
                <span v-else class="material-symbols-outlined text-outline">playlist_play</span>
              </div>
              <div>
                <h3 class="font-headline text-xl font-bold text-on-surface">{{ preview.playlistTitle || 'Untitled Playlist' }}</h3>
                <p class="font-label text-xs text-on-surface-variant uppercase mt-1">{{ preview.itemCount }} Items Protocol</p>
              </div>
            </div>
            <ul class="space-y-2 max-h-48 overflow-y-auto pr-4 custom-scrollbar">
              <li v-for="(it, i) in preview.items" :key="i" class="flex justify-between items-center p-3 bg-surface-container-low rounded-lg border border-outline/5">
                <div class="flex items-center gap-3 min-width-0">
                  <span class="font-label text-[10px] text-outline w-4">{{ i + 1 }}</span>
                  <span class="font-body text-sm text-on-surface truncate" :title="it.title">{{ it.title }}</span>
                </div>
                <span class="font-label text-[10px] text-outline">{{ formatDuration(it.duration) }}</span>
              </li>
            </ul>
            <div class="flex gap-4">
              <button 
                @click="startBulkDownload(videoUrl, selectedFormat)"
                class="flex-1 h-12 bg-gradient-to-br from-primary to-primary-container text-on-primary-container font-headline font-bold text-xs uppercase tracking-widest rounded-xl hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span class="material-symbols-outlined">download_for_offline</span>
                Initialize Bulk Protocol
              </button>
              <button 
                @click="preview = null"
                class="h-12 px-6 bg-surface-container-highest border border-outline/10 text-on-surface-variant font-headline font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </section>

        <div v-if="message" class="p-4 rounded-xl bg-surface-container-highest border border-outline/10 text-center">
          <p class="text-sm font-label text-on-surface-variant uppercase tracking-wider">{{ message }}</p>
        </div>
      </div>

      <!-- Right Column: Queue -->
      <div class="lg:col-span-12 xl:col-span-5">
        <section class="bg-surface-container-low rounded-xl p-6 h-full flex flex-col min-h-[400px]">
          <div class="flex items-center justify-between mb-8">
            <h2 class="font-headline text-lg font-bold text-on-surface">Queue Protocol</h2>
            <span class="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-3 py-1 bg-surface-container-highest rounded-full">
              {{ downloads.length }} Items
            </span>
          </div>

          <div class="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <div v-if="!downloads.length" class="flex flex-col items-center justify-center h-full text-center opacity-30 py-20">
              <span class="material-symbols-outlined text-6xl mb-4">inventory_2</span>
              <p class="font-label text-xs uppercase tracking-widest">Queue Empty</p>
            </div>

            <div 
              v-for="(item, idx) in downloads" 
              :key="idx"
              :class="['space-y-3 p-4 rounded-xl border-l-2 transition-all', 
                item.status === 'downloading' ? 'bg-surface-container-highest/40 border-primary' : 
                item.status === 'done' ? 'bg-surface-container-low border-secondary opacity-70' :
                item.status === 'failed' ? 'bg-error/5 border-error' : 'bg-surface-container-low border-outline/20']"
            >
              <div class="flex justify-between items-start gap-4">
                <div class="flex-1 min-w-0">
                  <h4 class="font-body text-sm font-semibold text-on-surface truncate" :title="item.title || item.filename || item.url">
                    {{ item.title || item.filename || item.url }}
                  </h4>
                  <p class="font-label text-[10px] text-on-surface-variant uppercase mt-1">
                    <span v-if="item.format" class="font-bold text-on-surface mr-2">{{ item.format }}</span>
                    <span v-if="item.status === 'downloading'" class="text-primary">
                      {{ item.progress?.percent || 0 }}% • {{ item.progress?.eta || '?' }}s ETA
                    </span>
                    <span v-else-if="item.status === 'done'" class="text-secondary">Completed</span>
                    <span v-else-if="item.status === 'failed'" class="text-error">Failed • Server Error</span>
                    <span v-else>Pending Protocol</span>
                  </p>
                </div>
                <span class="material-symbols-outlined" 
                  :class="item.status === 'downloading' ? 'text-primary animate-spin-slow' : 
                          item.status === 'done' ? 'text-secondary' : 
                          item.status === 'failed' ? 'text-error' : 'text-outline'">
                  {{ item.status === 'downloading' ? 'sync' : 
                     item.status === 'done' ? 'check_circle' : 
                     item.status === 'failed' ? 'error' : 'hourglass_empty' }}
                </span>
              </div>
              <div v-if="item.status === 'downloading'" class="w-full h-1.5 bg-surface-container-lowest rounded-full overflow-hidden">
                <div 
                  class="h-full bg-gradient-to-r from-primary to-secondary shimmer-progress transition-all duration-300"
                  :style="{ width: (item.progress?.percent || 0) + '%' }"
                ></div>
              </div>
            </div>
          </div>

          <!-- Storage Meter -->
          <div class="mt-8 pt-6 border-t border-outline/10">
            <div class="flex justify-between text-[10px] font-bold uppercase tracking-widest text-outline">
              <span>System Capacity</span>
              <span class="text-on-surface">Active Downloads: {{ downloads.filter(d => d.status === 'downloading').length }}</span>
            </div>
            <div class="w-full h-1 bg-surface-container-highest rounded-full mt-2 overflow-hidden">
              <div 
                class="h-full bg-primary transition-all duration-500"
                :style="{ width: (downloads.filter(d => d.status === 'done').length / (downloads.length || 1) * 100) + '%' }"
              ></div>
            </div>
          </div>
        </section>
      </div>
    </main>

    <!-- Downloads Tab -->
    <main v-show="currentTab === 'Downloads'" class="pt-24 px-6 max-w-7xl mx-auto space-y-8">
      <section class="bg-surface-container-low rounded-xl p-6 flex flex-col">
        <h2 class="font-headline text-2xl font-bold text-on-surface mb-6">Active Protocol</h2>
        <div class="space-y-4">
          <div v-if="!activeDownloads.length" class="text-center opacity-30 py-20">
            <span class="material-symbols-outlined text-6xl mb-4">hourglass_empty</span>
            <p class="font-label text-xs uppercase tracking-widest">No Active Tasks</p>
          </div>
          <div 
            v-for="(item, idx) in activeDownloads" 
            :key="idx"
            :class="['space-y-3 p-4 rounded-xl border-l-2 transition-all', 
              item.status === 'downloading' ? 'bg-surface-container-highest/40 border-primary' : 
              item.status === 'done' ? 'bg-surface-container-low border-secondary opacity-70' :
              item.status === 'failed' ? 'bg-error/5 border-error' : 'bg-surface-container-low border-outline/20']"
          >
            <div class="flex justify-between items-start gap-4">
              <div class="flex-1 min-w-0">
                <h4 class="font-body text-sm font-semibold text-on-surface truncate" :title="item.title || item.filename || item.url">
                  {{ item.title || item.filename || item.url }}
                </h4>
                <p class="font-label text-[10px] text-on-surface-variant uppercase mt-1">
                  <span v-if="item.format" class="font-bold text-on-surface mr-2">{{ item.format }}</span>
                  <span v-if="item.status === 'downloading'" class="text-primary">
                    {{ item.progress?.percent || 0 }}% • {{ item.progress?.eta || '?' }}s ETA
                  </span>
                  <span v-else-if="item.status === 'done'" class="text-secondary">Completed</span>
                  <span v-else-if="item.status === 'failed'" class="text-error">Failed • Server Error</span>
                  <span v-else>Pending Protocol</span>
                </p>
              </div>
              <span class="material-symbols-outlined" 
                :class="item.status === 'downloading' ? 'text-primary animate-spin-slow' : 
                        item.status === 'done' ? 'text-secondary' : 
                        item.status === 'failed' ? 'text-error' : 'text-outline'">
                {{ item.status === 'downloading' ? 'sync' : 
                   item.status === 'done' ? 'check_circle' : 
                   item.status === 'failed' ? 'error' : 'hourglass_empty' }}
              </span>
            </div>
            <div v-if="item.status === 'downloading'" class="w-full h-1.5 bg-surface-container-lowest rounded-full overflow-hidden">
              <div class="h-full bg-gradient-to-r from-primary to-secondary shimmer-progress transition-all duration-300" :style="{ width: (item.progress?.percent || 0) + '%' }"></div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- History Tab -->
    <main v-show="currentTab === 'History'" class="pt-24 px-6 max-w-7xl mx-auto space-y-8">
      <section class="glass-panel rounded-xl p-6 flex flex-col">
        <h2 class="font-headline text-2xl font-bold text-on-surface mb-6">System Archive</h2>
        <div class="space-y-4">
          <div v-if="!fetchedHistory.length" class="text-center opacity-30 py-20">
            <span class="material-symbols-outlined text-6xl mb-4">history</span>
            <p class="font-label text-xs uppercase tracking-widest">Archive Empty</p>
          </div>
          <div v-for="(item, idx) in fetchedHistory" :key="idx" class="space-y-3 p-4 bg-surface-container-low rounded-xl border border-outline/10 flex flex-col md:flex-row gap-6 items-center hover:bg-surface-container-highest transition-all cursor-pointer" @click="videoUrl = item.url; currentTab = 'Library'; fetchPreview()">
              <div class="w-full md:w-32 aspect-video rounded-lg overflow-hidden shrink-0 bg-surface-container-highest">
                <img v-if="item.thumbnail" :src="item.thumbnail" class="w-full h-full object-cover">
                <div v-else class="w-full h-full flex items-center justify-center text-outline">
                  <span class="material-symbols-outlined text-2xl">movie</span>
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <h4 class="font-body text-sm font-semibold text-on-surface truncate" :title="item.title || item.url">{{ item.title || item.url }}</h4>
                <div class="flex items-center gap-4 text-on-surface-variant mt-2">
                  <div class="flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-[14px]">person</span>
                    <span class="font-label text-[10px] uppercase">{{ item.uploader }}</span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-[14px]">schedule</span>
                    <span class="font-label text-[10px]">{{ item.isPlaylist && item.duration ? 'Playlist • ' + formatDuration(item.duration) : (item.isPlaylist ? 'Playlist' : formatDuration(item.duration)) }}</span>
                  </div>
                </div>
              </div>
              <div class="shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full border border-outline/10 bg-black/40" :class="getHistoricalDownloadStatus(item).color">
                <span class="material-symbols-outlined text-[14px]">{{ getHistoricalDownloadStatus(item).icon }}</span>
                <span class="font-label text-[10px] uppercase font-bold tracking-widest">{{ getHistoricalDownloadStatus(item).text }}</span>
              </div>
          </div>
        </div>
      </section>
    </main>

    <!-- Settings Tab -->
    <main v-show="currentTab === 'Settings'" class="pt-24 px-6 max-w-7xl mx-auto space-y-8">
      <section class="glass-panel rounded-xl p-6 flex flex-col max-w-2xl mx-auto">
        <h2 class="font-headline text-2xl font-bold text-on-surface mb-6">System Configuration</h2>
        
        <div class="space-y-6">
          <div>
            <label class="block font-label text-xs uppercase tracking-widest text-on-surface-variant mb-2">Downloads Directory Path</label>
            <input type="text" v-model="settings.DOWNLOAD_DIR" class="w-full bg-surface-container-highest/50 border border-outline/20 rounded-lg px-4 py-3 text-on-surface focus:border-primary focus:outline-none transition-all placeholder:text-outline/40" placeholder="e.g. downloads (relative) or D:\Video (absolute)">
            <p class="font-label text-[10px] text-on-surface-variant mt-2">Applies immediately without restart.</p>
          </div>
          <div>
            <label class="block font-label text-xs uppercase tracking-widest text-on-surface-variant mb-2">API Server Port</label>
            <input type="text" v-model="settings.PORT" class="w-full bg-surface-container-highest/50 border border-outline/20 rounded-lg px-4 py-3 text-on-surface focus:border-primary focus:outline-none transition-all placeholder:text-outline/40" placeholder="e.g. 3025">
          </div>
          <div>
            <label class="block font-label text-xs uppercase tracking-widest text-on-surface-variant mb-2">Web Interface Port</label>
            <input type="text" v-model="settings.VITE_PORT" class="w-full bg-surface-container-highest/50 border border-outline/20 rounded-lg px-4 py-3 text-on-surface focus:border-primary focus:outline-none transition-all placeholder:text-outline/40" placeholder="e.g. 5173">
          </div>
          
          <button @click="saveSettings" class="w-full px-6 py-4 bg-primary text-[#00391f] font-label font-bold text-sm uppercase tracking-widest rounded-xl hover:brightness-110 transition-all duration-300 mt-4 active:scale-[0.98]">
            Save Configuration
          </button>
        </div>
      </section>
    </main>

    <!-- Navigation Shell (Bottom Bar for Mobile) -->
    <nav class="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center h-16 pb-safe px-4 bg-[#0e0e0e]/90 backdrop-blur-2xl z-50 border-t border-[#262626]/20">
      <a @click.prevent="currentTab = 'Library'" :class="['flex flex-col items-center justify-center transition-all cursor-pointer', currentTab === 'Library' ? 'text-[#8bffc3] scale-110' : 'text-[#adaaaa] opacity-60 hover:opacity-100']">
        <span class="material-symbols-outlined" :style="currentTab === 'Library' ? 'font-variation-settings: \'FILL\' 1;' : ''">video_library</span>
        <span class="font-manrope text-[10px] font-bold uppercase tracking-tighter">Library</span>
      </a>
      <a @click.prevent="currentTab = 'Downloads'" :class="['flex flex-col items-center justify-center transition-all cursor-pointer', currentTab === 'Downloads' ? 'text-[#8bffc3] scale-110' : 'text-[#adaaaa] opacity-60 hover:opacity-100']">
        <span class="material-symbols-outlined" :style="currentTab === 'Downloads' ? 'font-variation-settings: \'FILL\' 1;' : ''">download</span>
        <span class="font-manrope text-[10px] font-bold uppercase tracking-tighter">Active</span>
      </a>
      <a @click.prevent="currentTab = 'History'" :class="['flex flex-col items-center justify-center transition-all cursor-pointer', currentTab === 'History' ? 'text-[#8bffc3] scale-110' : 'text-[#adaaaa] opacity-60 hover:opacity-100']">
        <span class="material-symbols-outlined" :style="currentTab === 'History' ? 'font-variation-settings: \'FILL\' 1;' : ''">history</span>
        <span class="font-manrope text-[10px] font-bold uppercase tracking-tighter">Archive</span>
      </a>
    </nav>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      currentTab: 'Library',
      videoUrl: '',
      message: '',
      preview: null,
      selectedFormat: 'mp4',
      loadingPreview: false,
      downloads: [],
      fetchedHistory: [],
      settings: { PORT: '', VITE_PORT: '', DOWNLOAD_DIR: '' }
    };
  },
  computed: {
    activeDownloads() {
      return this.downloads.slice().reverse();
    }
  },
  mounted() {
    this.fetchSettings();
    const savedDownloads = localStorage.getItem('ytdown_history');
    if (savedDownloads) {
      try {
        this.downloads = JSON.parse(savedDownloads);
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }
    const savedFetches = localStorage.getItem('ytdown_fetched_history');
    if (savedFetches) {
      try {
        this.fetchedHistory = JSON.parse(savedFetches);
      } catch (e) {
        console.error('Failed to parse fetched history', e);
      }
    }
  },
  watch: {
    downloads: {
      deep: true,
      handler(newVal) {
        localStorage.setItem('ytdown_history', JSON.stringify(newVal));
      }
    },
    fetchedHistory: {
      deep: true,
      handler(newVal) {
        localStorage.setItem('ytdown_fetched_history', JSON.stringify(newVal));
      }
    }
  },
  methods: {
    async fetchSettings() {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          this.settings = { ...this.settings, ...data };
        }
      } catch (err) {
        console.error('Failed to parse settings', err);
      }
    },
    async saveSettings() {
      try {
        const res = await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.settings)
        });
        const data = await res.json();
        this.message = data.message || 'Settings saved successfully';
        if (data.success) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } catch (err) {
        this.message = 'Failed to save settings: ' + err.message;
      }
    },
    async openDownloadsFolder() {
      try {
        await fetch('/api/open-downloads', { method: 'POST' });
      } catch (err) {
        console.error('Failed to open downloads folder', err);
      }
    },
    getHistoricalDownloadStatus(item) {
      if (!item) return { text: 'Not Downloaded', color: 'text-outline', icon: 'cloud_off' };
      
      if (item.isPlaylist && item.playlistUrls && item.playlistUrls.length > 0) {
        let downloadedCount = 0;
        let downloadingCount = 0;
        let failedCount = 0;
        
        for (const u of item.playlistUrls) {
          const match = this.downloads.slice().reverse().find(d => d.url === u);
          if (match) {
            if (match.status === 'done') downloadedCount++;
            else if (match.status === 'failed') failedCount++;
            else downloadingCount++;
          }
        }
        
        if (downloadedCount === item.playlistUrls.length) return { text: 'Downloaded', color: 'text-secondary', icon: 'check_circle' };
        if (downloadingCount > 0 || (downloadedCount > 0 && downloadedCount < item.playlistUrls.length && failedCount === 0)) {
          return { text: `Downloading... (${downloadedCount}/${item.playlistUrls.length})`, color: 'text-primary animate-pulse', icon: 'sync' };
        }
        if (failedCount > 0) return { text: 'Partial / Failed', color: 'text-error', icon: 'error' };
        
        return { text: 'Not Downloaded', color: 'text-outline', icon: 'cloud_off' };
      }

      const match = this.downloads.slice().reverse().find(d => d.url === (item.url || item));
      if (!match) return { text: 'Not Downloaded', color: 'text-outline', icon: 'cloud_off' };
      if (match.status === 'done') return { text: 'Downloaded', color: 'text-secondary', icon: 'check_circle' };
      if (match.status === 'failed') return { text: 'Failed', color: 'text-error', icon: 'error' };
      return { text: 'Downloading...', color: 'text-primary animate-pulse', icon: 'sync' };
    },
    async fetchPreview() {
      this.message = '';
      const url = this.videoUrl.trim();
      if (!url) return;
      this.loadingPreview = true;
      try {
        const response = await fetch('/api/formats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url })
        });
        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || 'Failed to fetch info');
        }
        const data = await response.json();
        const md = data.metadata || {};
        let playlistDuration = 0;
        let playlistItemsUrls = [];

        if (md.isPlaylist) {
          playlistDuration = (md.items || []).reduce((acc, curr) => acc + (Number(curr.duration) || 0), 0);
          playlistItemsUrls = (md.items || []).map(it => it.url).filter(Boolean);

          this.preview = {
            isPlaylist: true,
            playlistTitle: md.playlistTitle || '',
            itemCount: md.itemCount || (md.items && md.items.length) || 0,
            items: md.items || [],
            duration: playlistDuration
          };
        } else {
          const thumbs = md.thumbnails || [];
          const chosen = (thumbs.length && (thumbs[thumbs.length - 1].url || thumbs[thumbs.length - 1].url)) || (thumbs[0] && (thumbs[0].url || thumbs[0]?.url)) || '';
          this.preview = {
            isPlaylist: false,
            title: md.title || '',
            duration: md.duration || 0,
            thumbnail: chosen,
            uploader: md.uploader || md.uploader_name || ''
          };
        }
        
        const historyItem = {
          url: url,
          title: md.isPlaylist ? (md.playlistTitle || 'Playlist') : (md.title || ''),
          thumbnail: md.isPlaylist ? (md.items && md.items[0] && md.items[0].thumbnail) : this.preview.thumbnail,
          uploader: md.isPlaylist ? 'Playlist' : (md.uploader || md.uploader_name || ''),
          isPlaylist: !!md.isPlaylist,
          duration: md.isPlaylist ? playlistDuration : (md.duration || 0),
          playlistUrls: playlistItemsUrls,
          timestamp: Date.now()
        };
        this.fetchedHistory = this.fetchedHistory.filter(item => item.url !== url);
        this.fetchedHistory.unshift(historyItem);
        
        this.selectedFormat = 'mp4';
      } catch (e) {
        this.message = e.message || 'Failed to fetch preview';
      } finally {
        this.loadingPreview = false;
      }
    },

    async startBulkDownload(url, formatType) {
      if (!url) return;
      try {
        const body = { url };
        if (formatType === 'mp3') body.format = { filter: 'audioonly', type: 'mp3', quality: 0 };
        else if (formatType === 'mp4') body.format = { filter: 'mergevideo', type: 'mp4', quality: 'highest' };

        const response = await fetch('/api/download/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || 'Failed to start bulk download');
        }
        const data = await response.json();
        const items = data.items || [];
        for (const it of items) {
          const idx = this.downloads.length;
          this.downloads.push({ id: it.id || null, url: it.url || '', title: it.title || '', format: formatType, status: 'pending', filename: '', progress: {} });

          const downloadId = it.id;
          this.downloads[idx].id = downloadId;
          this.downloads[idx].status = 'downloading';
          this.downloads = [...this.downloads];

          const es = new EventSource(`/api/download/events/${downloadId}`);
          es.addEventListener('init', (e) => {
            try {
              const d = JSON.parse(e.data);
              this.downloads[idx].status = d.status || this.downloads[idx].status;
              this.downloads[idx].progress = d.progress || {};
              this.downloads[idx].filename = d.filename || this.downloads[idx].filename;
              this.downloads = [...this.downloads];
            } catch (err) {}
          });
          es.addEventListener('started', () => {
            this.downloads[idx].status = 'downloading';
            this.downloads = [...this.downloads];
          });
          es.addEventListener('progress', (e) => {
            try {
              const p = JSON.parse(e.data);
              this.downloads[idx].progress = p;
              this.downloads[idx].status = 'downloading';
              this.downloads = [...this.downloads];
            } catch (err) {}
          });
          es.addEventListener('done', (e) => {
            try {
              const d = JSON.parse(e.data);
              this.downloads[idx].status = 'done';
              this.downloads[idx].filename = d.filename || this.downloads[idx].filename;
              this.downloads = [...this.downloads];
            } catch (err) {}
            es.close();
          });
          es.addEventListener('error', (e) => {
            try {
              const d = e.data ? JSON.parse(e.data) : {};
              this.downloads[idx].status = 'failed';
              if (d && d.error) this.message = d.error;
            } catch (err) { this.downloads[idx].status = 'failed'; }
            this.downloads = [...this.downloads];
            es.close();
          });
        }
        this.message = `Started ${items.length} downloads`;
        this.preview = null;
      } catch (err) {
        this.message = err.message || 'Failed to start bulk download';
      }
    },

    startDownloadFromPreview() {
      if (!this.preview) return;
      this.startDownload(this.videoUrl, this.selectedFormat, this.preview.title);
      this.preview = null;
    },

    async startDownload(url, formatType, title = '') {
      const idx = this.downloads.length;
      this.downloads.push({ id: null, url, title, format: formatType, status: 'pending', filename: '', progress: {} });

      try {
        const body = { url };
        if (formatType === 'mp3') body.format = { filter: 'audioonly', type: 'mp3', quality: 0 };
        else if (formatType === 'mp4') body.format = { filter: 'mergevideo', type: 'mp4', quality: 'highest' };

        const response = await fetch('/api/download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || 'Failed to start download');
        }
        const data = await response.json();
        const downloadId = data.id;

        this.downloads[idx].id = downloadId;
        this.downloads[idx].status = 'downloading';
        this.downloads = [...this.downloads];

        const es = new EventSource(`/api/download/events/${downloadId}`);
        es.addEventListener('init', (e) => {
          try {
            const d = JSON.parse(e.data);
            this.downloads[idx].status = d.status || this.downloads[idx].status;
            this.downloads[idx].progress = d.progress || {};
            this.downloads[idx].filename = d.filename || this.downloads[idx].filename;
            this.downloads = [...this.downloads];
          } catch (err) {}
        });
        es.addEventListener('started', () => {
          this.downloads[idx].status = 'downloading';
          this.downloads = [...this.downloads];
        });
        es.addEventListener('progress', (e) => {
          try {
            const p = JSON.parse(e.data);
            this.downloads[idx].progress = p;
            this.downloads[idx].status = 'downloading';
            this.downloads = [...this.downloads];
          } catch (err) {}
        });
        es.addEventListener('done', (e) => {
          try {
            const d = JSON.parse(e.data);
            this.downloads[idx].status = 'done';
            this.downloads[idx].filename = d.filename || this.downloads[idx].filename;
            this.downloads = [...this.downloads];
          } catch (err) {}
          es.close();
        });
        es.addEventListener('error', (e) => {
          try {
            const d = e.data ? JSON.parse(e.data) : {};
            this.downloads[idx].status = 'failed';
            if (d && d.error) this.message = d.error;
          } catch (err) { this.downloads[idx].status = 'failed'; }
          this.downloads = [...this.downloads];
          es.close();
        });
        this.message = 'Download started.';
      } catch (e) {
        this.downloads[idx] = { url, status: 'failed', filename: '' };
        this.downloads = [...this.downloads];
        this.message = e.message || 'Failed to start download.';
      }
    },

    formatDuration(s) {
      s = Number(s) || 0;
      const h = Math.floor(s / 3600);
      const m = Math.floor((s % 3600) / 60);
      const sec = Math.floor(s % 60);
      return h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}` : `${m}:${String(sec).padStart(2,'0')}`;
    }
  }
};
</script>

<style>
  .material-symbols-outlined {
    font-variation-settings: 'FILL' 0, 'wght' 200, 'GRAD' 0, 'opsz' 24;
    font-size: 20px;
  }
  .glass-panel {
    background: rgba(38, 38, 38, 0.6);
    backdrop-filter: blur(24px);
    border: 1px solid rgba(118, 117, 117, 0.1);
  }
  .shimmer-progress {
    position: relative;
    overflow: hidden;
  }
  .shimmer-progress::after {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    animation: shimmer 2s infinite;
  }
  @keyframes shimmer {
    100% { left: 100%; }
  }
  body {
    background-color: #0e0e0e;
    background-image: radial-gradient(circle at top right, rgba(139, 255, 195, 0.05) 0%, transparent 40%);
    min-height: 100vh;
    margin: 0;
  }
  
  .spinner-small {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255,255,255,0.2);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  
  @keyframes spin { to { transform: rotate(360deg); } }
  .animate-spin-slow {
    animation: spin 3s linear infinite;
  }

  .custom-scrollbar::-webkit-scrollbar {
    width: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(139, 255, 195, 0.2);
  }
</style>
