module.exports = {
  apps: [{
    name: 'ytpanel',
    script: 'npm',
    args: 'run dev',
    cwd: process.cwd(),
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    watch: false,
    autorestart: true,
    max_memory_restart: '1G',
    error_file: 'logs/err.log',
    out_file: 'logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,
    max_restarts: 5,
    min_uptime: '5s',
    kill_timeout: 3000,
    wait_ready: true,
    listen_timeout: 10000,
    exp_backoff_restart_delay: 100
  }]
};