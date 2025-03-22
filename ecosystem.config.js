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
    max_memory_restart: '1G'
  }]
};