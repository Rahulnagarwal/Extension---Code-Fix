import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        rollupOptions: {
            input: {
                popup: 'src/popup/popup.html',
                background: 'src/background/index.ts',
                content: 'src/content/index.ts'
            },
            output: {
                entryFileNames: (chunk) => {
                    if (chunk.name === 'background') return 'background.js';
                    if (chunk.name === 'content') return 'content.js';
                    return 'assets/[name].js';
                },
                chunkFileNames: 'assets/[name]-[hash].js',
                assetFileNames: 'assets/[name]-[hash][extname]'
            }
        }
    }
    ,
    resolve: {
        alias: {
            '@common': path.resolve(__dirname, 'src/common'),
            '@lib': path.resolve(__dirname, 'src/lib'),
            '@popup': path.resolve(__dirname, 'src/popup')
        }
    }
});


