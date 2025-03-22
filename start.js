const { spawn } = require('child_process');
const path = require('path');

const npm = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true,
  cwd: process.cwd()
});

npm.on('error', (err) => {
  console.error('Failed to start npm:', err);
  process.exit(1);
});

npm.on('close', (code) => {
  console.log(`npm process exited with code ${code}`);
  process.exit(code);
}); 