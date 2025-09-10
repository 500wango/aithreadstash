#!/bin/bash

# AI ThreadStash Server Setup Script
echo "🚀 Setting up AI ThreadStash production server..."

# Update system
echo "🔄 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install required packages
echo "📦 Installing required packages..."
sudo apt install -y nodejs npm postgresql nginx certbot python3-certbot-nginx

# Install PM2 globally
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Create application directory
echo "📁 Creating application directory..."
sudo mkdir -p /opt/aithreadstash
sudo chown $USER:$USER /opt/aithreadstash

# Create database
echo "🗄️ Setting up PostgreSQL database..."
sudo -u postgres psql -c "CREATE DATABASE aithreadstash_prod;"
sudo -u postgres psql -c "CREATE USER aithreadstash_user WITH PASSWORD 'your_secure_password_here';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE aithreadstash_prod TO aithreadstash_user;"

# Configure firewall
echo "🔒 Configuring firewall..."
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw --force enable

echo "✅ Server setup completed!"
echo "📋 Next steps:"
echo "1. Configure Nginx: sudo nano /etc/nginx/sites-available/aithreadstash"
echo "2. Set up SSL certificates: sudo certbot --nginx"
echo "3. Deploy application using GitHub Actions"