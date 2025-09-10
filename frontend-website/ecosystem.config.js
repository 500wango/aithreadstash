module.exports = {
  apps: [
    {
      name: 'aithreadstash-web',
      cwd: __dirname,
      script: 'npm',
      args: 'start',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/var/log/pm2/aithreadstash-web-error.log',
      out_file: '/var/log/pm2/aithreadstash-web-out.log',
      log_file: '/var/log/pm2/aithreadstash-web-combined.log',
      time: true,
      max_memory_restart: '400M',
      restart_delay: 5000,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};