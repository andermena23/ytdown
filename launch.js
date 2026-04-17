const { spawn } = require('child_process');
console.log('==============================================');
console.log('             STARTING YTDOWN                  ');
console.log('==============================================\n');
console.log('Launching Backend API and Frontend Interface...');
spawn('npm', ['run', 'dev'], { stdio: 'inherit', shell: true });
