module.exports = {
  apps: [
    {
      name: 'ytpanel-dev',
      script: 'npm',
      args: 'run dev',
      instances: 16, // Используем количество физических ядер i7-13700KF
      exec_mode: 'cluster', // Режим кластера для балансировки нагрузки
      autorestart: true,
      watch: true, // Включаем watch mode для dev режима
      ignore_watch: ['node_modules', 'logs', '.next', '*.log'], // Игнорируем ненужные директории
      max_memory_restart: '8G', // Увеличиваем лимит памяти на инстанс (64GB / 8 = 8GB на процесс)
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
        NEXT_TELEMETRY_DISABLED: 1,
      },
      // Настройки для логов
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      merge_logs: true,
      // Настройки производительности для dev режима
      node_args: [
        '--max-old-space-size=8192', // 8GB heap size на процесс
        '--max-http-header-size=32768', // Увеличенный размер заголовков
        '--gc-interval=100000', // Увеличиваем интервал сборки мусора
        '--max-semi-space-size=256', // Увеличиваем размер semi-space для оптимизации GC
        '--inspect', // Включаем инспектор Node.js для отладки
      ],
      // Настройки кластера
      increment_var: 'PORT',
      instance_var: 'INSTANCE_ID',
      // Мониторинг здоровья приложения
      exp_backoff_restart_delay: 100,
      max_restarts: 10,
      min_uptime: '1000',
      // Настройки для быстрой перезагрузки в dev режиме
      kill_timeout: 3000,
      wait_ready: true,
      listen_timeout: 10000,
    },
  ],
} 