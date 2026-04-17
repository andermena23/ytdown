const killPort = require('kill-port');
const { spawn } = require('child_process');
const dotenv = require('dotenv');

dotenv.config();

const PORT = parseInt(process.env.PORT || 3025);
const VITE_PORT = parseInt(process.env.VITE_PORT || 5173);

async function restart() {
  console.log('==============================================');
  console.log('             RESTARTING YTDOWN                ');
  console.log('==============================================\n');
  console.log(`Sending termination signals to allocated ports: ${PORT} (API), ${VITE_PORT} (Web)...`);
  
  try { await killPort(PORT); } catch(e) {}
  try { await killPort(VITE_PORT); } catch(e) {}
  
  console.log('\nSystems terminated. Rebooting...');
  spawn('node', ['launch.js'], { stdio: 'inherit', shell: true });
}

restart();
