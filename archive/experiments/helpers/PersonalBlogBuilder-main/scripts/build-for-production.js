import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🔨 Building project for production...');

// Step 1: Make sure the dist directory exists and is empty
const distDir = path.join(rootDir, 'dist');
if (fs.existsSync(distDir)) {
  console.log('🧹 Cleaning existing dist directory...');
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

// Step 2: Build Astro site with SSR
try {
  console.log('🚀 Building Astro site...');
  execSync('npm run build', { 
    stdio: 'inherit',
    cwd: rootDir
  });
  console.log('✅ Astro build completed successfully');
} catch (error) {
  console.error('❌ Astro build failed:', error);
  process.exit(1);
}

// Step 3: Copy the unified deploy-server.js to dist for easier access
try {
  console.log('📋 Copying deployment server...');
  fs.copyFileSync(
    path.join(rootDir, 'server/deploy-server.js'), 
    path.join(distDir, 'production-server.js')
  );
  console.log('✅ Server file copied successfully');
} catch (error) {
  console.error('❌ Failed to copy server file:', error);
  process.exit(1);
}

// Step 4: Create a start script in the dist folder
const startScript = `
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Start the production server
console.log('🚀 Starting production server...');
const server = spawn('node', ['production-server.js'], {
  stdio: 'inherit',
  cwd: __dirname
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
`;

try {
  fs.writeFileSync(path.join(distDir, 'start.js'), startScript);
  console.log('✅ Start script created successfully');
} catch (error) {
  console.error('❌ Failed to create start script:', error);
  process.exit(1);
}

console.log('🎉 Production build completed!');
console.log('🚀 To start the production server, run: node dist/start.js');