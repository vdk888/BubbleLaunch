import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5000,
    strictPort: true,
    cors: true,
    // Explicitly allow specific Replit domain
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'b0ebfe59-84bf-4b2d-a4c6-d0add528c31f-00-g4zpl4mie59w.worf.replit.dev',
      '.replit.dev', // Allow all replit.dev subdomains
      '.repl.co' // Allow all repl.co subdomains
    ],
    fs: {
      // Allow serving files from the entire project root
      allow: ['.']
    },
    hmr: {
      // HMR configuration for Replit
      clientPort: 443,
      port: 5000
    }
  }
});