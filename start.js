const { spawn, exec } = require('child_process');
const path = require('path');
const util = require('util');
const execAsync = util.promisify(exec);

async function killProcessOnPort(port) {
  try {
    if (process.platform === 'win32') {
      // Находим процесс, использующий порт
      const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
      if (stdout) {
        const pid = stdout.split(/\s+/)[4];
        if (pid) {
          // Убиваем процесс
          await execAsync(`taskkill /F /PID ${pid}`);
          console.log(`Killed process ${pid} on port ${port}`);
        }
      }
    } else {
      // Для Unix-подобных систем
      await execAsync(`lsof -i :${port} | grep LISTEN | awk '{print $2}' | xargs kill -9`);
    }
  } catch (error) {
    console.log(`No process found on port ${port}`);
  }
}

async function startNext() {
  try {
    // Убиваем процесс на порту 3000
    await killProcessOnPort(3000);
    
    // Ждем немного, чтобы порт освободился
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Запускаем Next.js
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
  } catch (error) {
    console.error('Error starting Next.js:', error);
    process.exit(1);
  }
}

startNext(); 