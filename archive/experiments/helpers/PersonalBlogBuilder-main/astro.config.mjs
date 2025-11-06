import { defineConfig } from 'astro/config';
import tailwind from "@astrojs/tailwind";
import node from "@astrojs/node";
import path from 'path';
import os from 'os';

// Create a cache directory path outside of OneDrive
const cacheDir = path.join(os.tmpdir(), 'astro-cache');

// https://astro.build/config
export default defineConfig({
  site: 'https://bubbleblog.replit.app',
  integrations: [tailwind()],
  output: "server",
  adapter: node({
    mode: "standalone"
  }),
  server: {
    host: '0.0.0.0',
    port: 5000  // Use port 5000 for Astro (Replit expecting this port)
  },
  // Override all VITE config for Replit environment
  vite: {
    // Custom cache location outside of OneDrive
    cacheDir: cacheDir,
    server: {
      host: '0.0.0.0',
      port: 5000,
      hmr: false, // Disable HMR to avoid connection issues
      cors: true,
      strictPort: true,
      watch: {
        usePolling: true,
      },
      fs: {
        allow: ['.'], // Allow all files in project
      },
      // Explicitly allow specific Replit domain
      allowedHosts: [
        'localhost',
        '127.0.0.1',
        'b0ebfe59-84bf-4b2d-a4c6-d0add528c31f-00-g4zpl4mie59w.worf.replit.dev',
        '.replit.dev',
        '.repl.co'
      ],
      proxy: {
        '/api': {
          target: process.env.REPLIT_ENVIRONMENT ? 'http://0.0.0.0:4000' : 'http://localhost:4000',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path,
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('proxy error', err);
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log('Sending Request to the Target:', req.method, req.url);
            });
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
            });
          }
        }
      }
    }
  }
});
