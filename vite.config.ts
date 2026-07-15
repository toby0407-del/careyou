import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const yatingKey = (env.YATING_TTS_KEY || env.VITE_YATING_TTS_KEY || '').trim()
  /** 雅婷 TTS 正式主機（可用 .env 覆寫；必須是 tts.api.yating.tw） */
  const yatingTarget = (env.YATING_TTS_BASE_URL || 'https://tts.api.yating.tw').replace(/\/$/, '')
  const proxyReady = Boolean(yatingKey)
  if (!proxyReady) {
    console.warn('[yating-tts] 未設定 YATING_TTS_KEY，小伴朗讀會改用瀏覽器語音（請建立 .env.local）')
  } else {
    console.info(`[yating-tts] proxy → ${yatingTarget} (key loaded, len=${yatingKey.length})`)
  }

  return {
    plugins: [
      figmaAssetResolver(),
      // The React and Tailwind plugins are both required for Make, even if
      // Tailwind is not being actively used – do not remove them
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        // Alias @ to the src directory
        '@': path.resolve(__dirname, './src'),
      },
    },

    // 只暴露「proxy 是否有 key」，不把真實 key 打進前端 bundle
    define: {
      'import.meta.env.VITE_YATING_PROXY_READY': JSON.stringify(proxyReady ? 'true' : 'false'),
    },

    // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
    assetsInclude: ['**/*.svg', '**/*.csv'],

    build: {
      target: 'es2020',
    },

    optimizeDeps: {
      exclude: ['@mlc-ai/web-llm'],
    },

    server: {
      host: '127.0.0.1',
      port: 9555,
      strictPort: true,
      proxy: {
        // 雅婷 TTS：密鑰只留在本機代理，不進瀏覽器（小伴聊天朗讀會走這裡）
        '/api/yating-tts': {
          target: yatingTarget,
          changeOrigin: true,
          secure: true,
          rewrite: (p) => p.replace(/^\/api\/yating-tts/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              if (yatingKey) proxyReq.setHeader('key', yatingKey)
              proxyReq.setHeader('Content-Type', 'application/json')
            })
          },
        },
      },
    },
  }
})
