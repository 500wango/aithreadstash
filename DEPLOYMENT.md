# AI ThreadStash - Production Deployment Guide

This guide covers deploying AI ThreadStash to production environments.

## Prerequisites

- Node.js 18+ 
- PostgreSQL 13+
- Domain name with SSL certificate
- Stripe account (for payments)
- Notion OAuth app (for integrations)

## Environment Setup

### 1. Database Setup

```bash
# Create production database
createdb aithreadstash_prod

# Create user (optional)
createuser aithreadstash_user --createdb --login
```

### 2. Environment Variables

Copy and configure environment files:

**Backend (.env.production):**
```bash
cp backend/.env.production backend/.env
# Edit with your production values
```

**Frontend (.env.production):**
```bash
cp frontend-website/.env.production frontend-website/.env
# Edit with your production values
```

## Backend Deployment

### Option 1: Direct Deployment

```bash
cd backend

# Install dependencies
npm ci --only=production

# Build application
npm run build

# Run migrations
npm run migration:run

# Start with PM2 (recommended)
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Option 2: Using Deployment Script

```bash
cd backend
chmod +x scripts/deploy-prod.sh
./scripts/deploy-prod.sh
```

### Option 3: Docker Deployment

```bash
cd backend

# Build image
docker build -t aithreadstash-api .

# Run container
docker run -d \
  --name aithreadstash-api \
  -p 3007:3007 \
  --env-file .env.production \
  aithreadstash-api
```

## Frontend Deployment

### Build and Deploy

```bash
cd frontend-website

# Install dependencies
npm ci --only=production

# Build for production
npm run build

# Serve with static hosting or Node.js
npm start
```

### Static Hosting

The app is configured for static export and can be deployed to:
- Netlify
- AWS S3 + CloudFront
- Azure Static Web Apps

## Browser Extension

### Production Build

```bash
cd browser-extension

# Update manifest.json with production URLs
# Update host_permissions with your production domains

# Create production build
zip -r aithreadstash-extension.zip . -x "*.git*" "node_modules/*"
```

### Chrome Web Store

1. Update `browser-extension/manifest.json` with production URLs
2. Create extension package
3. Submit to Chrome Web Store

## SSL/HTTPS Setup

### Using Let's Encrypt (Recommended)

```bash
# Install certbot
sudo apt-get install certbot

# Get certificate
sudo certbot certonly --standalone -d api.aithreadstash.com
sudo certbot certonly --standalone -d aithreadstash.com

# Set up auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Nginx Configuration

```nginx
# /etc/nginx/sites-available/aithreadstash
server {
    listen 80;
    server_name aithreadstash.com www.aithreadstash.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name aithreadstash.com www.aithreadstash.com;

    ssl_certificate /etc/letsencrypt/live/aithreadstash.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/aithreadstash.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# API Server
server {
    listen 443 ssl http2;
    server_name api.aithreadstash.com;

    ssl_certificate /etc/letsencrypt/live/api.aithreadstash.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.aithreadstash.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3007;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Monitoring and Logging

### PM2 Monitoring

```bash
# View logs
pm2 logs aithreadstash-api

# Monitor performance
pm2 monit

# Restart application
pm2 restart aithreadstash-api

# View status
pm2 status
```

### Health Checks

```bash
# Check API health
curl https://api.aithreadstash.com/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "uptime": 3600,
  "environment": "production",
  "database": "connected",
  "version": "1.0.0"
}
```

## Database Backup

### Automated Backups

```bash
#!/bin/bash
# backup-db.sh

BACKUP_DIR="/backup/aithreadstash"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="aithreadstash_prod"

mkdir -p $BACKUP_DIR

pg_dump $DB_NAME > $BACKUP_DIR/backup_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete

# Upload to cloud storage (optional)
# aws s3 cp $BACKUP_DIR/backup_$DATE.sql s3://your-backup-bucket/
```

### Cron Job

```bash
# Add to crontab
0 2 * * * /path/to/backup-db.sh
```

## Security Checklist

- [ ] SSL certificates installed and auto-renewal configured
- [ ] Environment variables secured (no secrets in code)
- [ ] Database connections encrypted
- [ ] CORS configured for production domains only
- [ ] Rate limiting enabled (if implemented)
- [ ] Security headers configured
- [ ] Regular security updates scheduled
- [ ] Backup system in place
- [ ] Monitoring and alerting configured

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check PostgreSQL status
   sudo systemctl status postgresql
   
   # Check database connectivity
   psql -h localhost -U username -d aithreadstash_prod
   ```

2. **Application Won't Start**
   ```bash
   # Check PM2 logs
   pm2 logs aithreadstash-api
   
   # Check disk space
   df -h
   
   # Check memory usage
   free -h
   ```

3. **SSL Certificate Issues**
   ```bash
   # Test certificate
   openssl s_client -connect aithreadstash.com:443
   
   # Renew certificate
   sudo certbot renew
   ```

### Performance Optimization

1. **Database Optimization**
   - Add database indexes for frequently queried fields
   - Configure PostgreSQL for production workload
   - Set up connection pooling

2. **Application Optimization**
   - Enable PM2 cluster mode
   - Configure caching headers
   - Optimize bundle sizes

3. **CDN Configuration**
   - Set up CloudFront or similar CDN
   - Cache static assets
   - Enable gzip compression

## Monitoring Recommendations

- Use application monitoring (DataDog, New Relic, etc.)
- Set up uptime monitoring (Pingdom, StatusCake, etc.)
- Configure log aggregation (ELK stack, Splunk, etc.)
- Set up error tracking (Sentry, Bugsnag, etc.)

## Scaling Considerations

- Load balancer configuration for multiple instances
- Database read replicas for scaling reads
- Redis for session storage and caching
- Queue system for background jobs (Bull, Agenda, etc.)

---

For additional support, refer to the main README.md or contact the development team.