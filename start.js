const { spawn, exec } = require('child_process');
const path = require('path');
const util = require('util');
const execAsync = util.promisify(exec);

async function killProcessOnPort(port) {
  try {
    if (process.platform === 'win32') {
      console.log('Checking for processes on port', port);
      
      // Находим все процессы, использующие порт
      const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
      console.log('Netstat output:', stdout);
      
      if (stdout) {
        // Разбиваем вывод на строки и обрабатываем каждую
        const lines = stdout.split('\n').filter(line => line.trim());
        for (const line of lines) {
          const parts = line.split(/\s+/);
          const pid = parts[4];
          if (pid) {
            console.log(`Found process ${pid} on port ${port}`);
            try {
              // Пробуем сначала нормальное завершение
              await execAsync(`taskkill /PID ${pid}`);
              console.log(`Gracefully killed process ${pid}`);
            } catch (error) {
              console.log(`Failed to gracefully kill process ${pid}, forcing...`);
              // Если не получилось, принудительно завершаем
              await execAsync(`taskkill /F /PID ${pid}`);
              console.log(`Force killed process ${pid}`);
            }
          }
        }
      }
      
      // Дополнительная проверка - убиваем все процессы node
      console.log('Killing all node processes...');
      try {
        await execAsync('taskkill /F /IM node.exe');
        console.log('Killed all node processes');
      } catch (error) {
        console.log('No node processes found or already killed');
      }
    } else {
      // Для Unix-подобных систем
      await execAsync(`lsof -i :${port} | grep LISTEN | awk '{print $2}' | xargs kill -9`);
    }
    
    // Проверяем, освободился ли порт
    await new Promise(resolve => setTimeout(resolve, 2000));
    try {
      await execAsync(`netstat -ano | findstr :${port}`);
      console.log('Port is still in use, waiting longer...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    } catch (error) {
      console.log('Port is now free');
    }
  } catch (error) {
    console.log(`No process found on port ${port}`);
  }
}

async function startNext() {
  try {
    console.log('Starting Next.js restart process...');
    
    // Убиваем процесс на порту 3000
    await killProcessOnPort(3000);
    
    // Ждем немного, чтобы порт освободился
    console.log('Waiting for port to be fully released...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Запускаем Next.js
    console.log('Starting Next.js...');
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