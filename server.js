const { spawn } = require('child_process');
const path = require('path');

let serverProcess = null;
let restartAttempts = 0;
const MAX_RESTART_ATTEMPTS = 5;
const RESTART_DELAY = 5000; // 5 секунд

function startServer() {
  console.log(`[${new Date().toISOString()}] Starting server...`);
  
  serverProcess = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      NODE_OPTIONS: '--max-old-space-size=16384 --max-http-header-size=32768',
      NEXT_TELEMETRY_DISABLED: '1'
    }
  });

  serverProcess.on('close', (code) => {
    console.log(`[${new Date().toISOString()}] Server process exited with code ${code}`);
    
    if (restartAttempts < MAX_RESTART_ATTEMPTS) {
      restartAttempts++;
      console.log(`[${new Date().toISOString()}] Attempting restart ${restartAttempts}/${MAX_RESTART_ATTEMPTS}...`);
      
      setTimeout(() => {
        startServer();
      }, RESTART_DELAY);
    } else {
      console.log(`[${new Date().toISOString()}] Max restart attempts reached. Please check the server manually.`);
      process.exit(1);
    }
  });

  serverProcess.on('error', (err) => {
    console.error(`[${new Date().toISOString()}] Failed to start server:`, err);
  });
}

// Обработка сигналов завершения
process.on('SIGTERM', () => {
  console.log(`[${new Date().toISOString()}] Received SIGTERM. Shutting down...`);
  if (serverProcess) {
    serverProcess.kill();
  }
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log(`[${new Date().toISOString()}] Received SIGINT. Shutting down...`);
  if (serverProcess) {
    serverProcess.kill();
  }
  process.exit(0);
});

// Запускаем сервер
startServer(); 