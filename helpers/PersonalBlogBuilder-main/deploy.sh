#!/bin/bash

# Display colored text
green() {
    echo -e "\033[0;32m$1\033[0m"
}

yellow() {
    echo -e "\033[0;33m$1\033[0m"
}

red() {
    echo -e "\033[0;31m$1\033[0m"
}

# Make script exit on first error
set -e

# Step 1: Build the Astro site
green "🔨 Building Astro site..."
npm run build

# Step 2: Create production server files
green "📋 Setting up production server..."

# Check if production server exists
if [ ! -f "production-server.js" ]; then
  red "❌ Production server file not found at: production-server.js"
  exit 1
fi

# Step 3: Create a production startup script
yellow "📝 Creating production startup script..."

cat > start-production.js << 'EOL'
import { spawn } from 'child_process';

// Start the production server
console.log('🚀 Starting production server...');
const server = spawn('node', ['production-server.js'], {
  stdio: 'inherit'
});

server.on('error', (err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('👋 Shutting down server...');
  server.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('👋 Shutting down server...');
  server.kill('SIGTERM');
});
EOL

green "✅ Deployment build complete!"
yellow "To start the production server, run: node start-production.js"