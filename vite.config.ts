import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Custom plugin to handle SPA routing
const spaFallbackPlugin = () => {
  return {
    name: 'spa-fallback',
    configureServer(server: any) {
      // Handle SPA routing - serve index.html for all routes except assets
      server.middlewares.use((req: any, res: any, next: any) => {
        const url = req.url || ''
        
        // Skip for asset requests
        if (url.startsWith('/assets/') || 
            url.startsWith('/@') || 
            url.includes('.') || 
            url.startsWith('/api/')) {
          return next()
        }
        
        // For all other routes, serve index.html
        req.url = '/'
        next()
      })
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  
  return {
    plugins: [
      react(),
      spaFallbackPlugin()
    ],
    resolve: {
      alias: {
        '@': path.resolve('.'),
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        input: {
          main: './index.html'
        }
      }
    },
    css: {
      devSourcemap: true, // Enable CSS source maps in development
    },
    publicDir: 'public',
    // Optimize development server
    server: {
      host: true, // Allow external connections (0.0.0.0)
      port: 3000,
      hmr: {
        overlay: false,
        // Prevent excessive hot reloads
        timeout: 5000,
        // Only reload on actual file changes
        reloadOnFailure: false
      }
    },
    // Optimize dependencies
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-markdown', 'remark-gfm'],
      force: true // Force re-optimization
    },
    // Environment variables and global definitions
    define: {
      'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
      'process.env.SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'process.env.SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY),
      'process.env.API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL),
      'global': 'globalThis'
    }
  }
})