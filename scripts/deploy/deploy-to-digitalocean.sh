#!/bin/bash

# DigitalOcean Deployment Script for Bubble
echo "🚀 Deploying Bubble to DigitalOcean..."

# TODO: Replace these with your actual values
SERVER_IP="YOUR_DROPLET_IP"           # e.g., 123.45.67.89
SSH_USER="root"                        # or your custom username
APP_PATH="/root/BubbleLaunch"         # path where your app is on the server

echo "📡 Connecting to server: $SSH_USER@$SERVER_IP"
echo "📁 App path: $APP_PATH"
echo ""

# SSH into the server and pull latest changes
ssh $SSH_USER@$SERVER_IP << 'ENDSSH'
cd $APP_PATH

echo "📥 Pulling latest changes from GitHub..."
git pull origin main

echo "📦 Installing dependencies (if needed)..."
npm install --production

echo "🔄 Restarting application..."
# If using PM2:
pm2 restart all

# If using systemd:
# sudo systemctl restart bubble

# If using just node:
# pkill -f "node src/backend/server.js"
# nohup npm start > /dev/null 2>&1 &

echo "✅ Deployment complete!"
ENDSSH

echo ""
echo "🎉 Deployment finished! Check your website."
