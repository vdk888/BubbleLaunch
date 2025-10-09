// This is a launcher script for local development
import { spawn } from 'child_process';

// Use concurrently to run both the API server and Astro dev server
console.log('🚀 Starting development servers...');

const concurrentlyArgs = [
  'npm:dev',    // Runs Astro dev server
  'npm:server:dev'  // Runs Express API server with hot reload
];

const server = spawn('npx', ['concurrently', ...concurrentlyArgs], {
  stdio: 'inherit',
  shell: true
});

server.on('error', (err) => {
  console.error('❌ Failed to start servers:', err);
  process.exit(1);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('👋 Shutting down servers...');
  server.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('👋 Shutting down servers...');
  server.kill('SIGTERM');
  process.exit(0);
});