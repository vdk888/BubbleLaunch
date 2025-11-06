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
