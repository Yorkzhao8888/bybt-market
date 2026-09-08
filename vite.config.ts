import { defineConfig } from 'vite';

// 说明：本项目使用 Vite 默认的 esbuild 转译 TSX/JSX，无需额外 React 插件，
// 避免 @vitejs/plugin-react 在 Express+tsx 中加载 `vite/internal` 导致的启动失败。
export default defineConfig({
  server: {
    port: 5000,
    host: '0.0.0.0',
    allowedHosts: true,
    hmr: {
      overlay: true,
      path: '/hot/vite-hmr',
      port: 6000,
      clientPort: 443,
      timeout: 30000,
    },
    watch: {
      usePolling: true,
      interval: 100,
    },
  },
});