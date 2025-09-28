/// <reference types="vitest" />
import legacy from '@vitejs/plugin-legacy'
import vue from '@vitejs/plugin-vue'
import { IonicResolver } from 'unplugin-vue-components/resolvers'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'
import { fileURLToPath } from 'url'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        vue(),
        legacy(),
        AutoImport({
            imports: ['vue', 'vue-router'],
            eslintrc: {
                enabled: true
            },
            vueTemplate: true
        }),
        Components({
            dirs: ['src/components', 'src/layouts'],
            resolvers: [IonicResolver()]
        })
    ],

    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        },
        extensions: ['.js', '.json', '.jsx', '.mjs', '.ts', '.tsx', '.vue']
    },
    test: {
        globals: true,
        environment: 'jsdom'
    }
})
