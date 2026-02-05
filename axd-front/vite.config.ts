import react from '@vitejs/plugin-react-swc';
import dotenv from 'dotenv';
import { resolve } from 'path';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

const profile = process.env.PROFILE ?? 'dev-local';
const envFilePath = `./env/.env.${profile}`;
dotenv.config({ path: envFilePath });

export default defineConfig(async () => {
    return {
        root: './src',
        publicDir: '../public',
        base: '/',
        define: {
            'process.env': process.env,
            'global': 'window',
        },
        plugins: [
            react(),
            tsconfigPaths(),
        ],
        build: {
            outDir: '../dist',
            emptyOutDir: true,
        },
        resolve: {
            alias: {
                '@src': resolve(__dirname, './src'),
                '@components': resolve(__dirname, './src/components'),
                '@lib': resolve(__dirname, './src/lib'),
                '@hooks': resolve(__dirname, './src/hooks'),
                '@contexts': resolve(__dirname, './src/contexts'),
            },
        },
        server: {
            host: '0.0.0.0',
            port: 12083,
            strictPort: true,
            proxy: {
                '/api': {
                    target: 'http://localhost:8000',
                    changeOrigin: true,
                    secure: false,
                },
            },
        },
    };
});