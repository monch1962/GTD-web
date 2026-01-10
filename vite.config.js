import { defineConfig } from 'vite'
import { resolve } from 'path'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
    // Entry point - Vite will process index.html
    root: '.',

    plugins: [
        // Inline all CSS and JS into a single HTML file
        viteSingleFile()
    ],

    build: {
        outDir: 'dist',
        emptyOutDir: true,

        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html')
            },
            output: {
                entryFileNames: 'assets/[name].[hash].js',
                chunkFileNames: 'assets/[name].[hash].js',
                assetFileNames: 'assets/[name].[hash].[ext]'
            }
        },

        // Minification
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: true, // Remove console.logs in production
                drop_debugger: true
            },
            format: {
                comments: false // Remove comments
            }
        },

        // No source maps for production (smaller bundles)
        sourcemap: false,

        // Target modern browsers
        target: 'es2015'
    },

    // Development server
    server: {
        port: 8080,
        open: true,
        strictPort: false
    },

    // Module resolution
    resolve: {
        alias: {
            '@': resolve(__dirname, 'js'),
            '@modules': resolve(__dirname, 'js/modules')
        }
    },

    // Optimize dependencies
    optimizeDeps: {
        include: ['remote-storage']
    }
})
