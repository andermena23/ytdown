import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '../', '');
  const port = parseInt(process.env.npm_config_port || env.VITE_PORT || 5173);
  const serverPort = env.PORT || 3025;

  return {
    plugins: [vue()],
    server: {
      port: port,
      proxy: {
        '/api': `http://localhost:${serverPort}`
      }
    }
  };
});
