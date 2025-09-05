module.exports = {
  apps: [
    {
      name: 'aithreadstash-api',
      script: 'dist/main.js',
      instances: process.env.PM2_INSTANCES || 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3007
      },
      error_file: '/var/log/pm2/aithreadstash-error.log',
      out_file: '/var/log/pm2/aithreadstash-out.log',
      log_file: '/var/log/pm2/aithreadstash-combined.log',
      time: true,
      max_memory_restart: '500M',
      restart_delay: 5000,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};