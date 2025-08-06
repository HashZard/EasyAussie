import { defineConfig } from 'vite'

export default defineConfig({
  root: './',
  publicDir: 'assets',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: './index.html',
        // 认证页面
        login: './pages/auth/login.html',
        register: './pages/auth/register.html',
        // 用户页面
        userIndex: './pages/user/index.html',
        // 服务页面
        service: './pages/service/service.html',
        inspection: './pages/service/inspection.html',
        coverletter: './pages/service/coverletter.html',
        application: './pages/service/application.html',
        'airport-pickup': './pages/service/airport-pickup.html',
        // 结果页面
        'submit-success': './pages/submit-success.html',
        'submit-fail': './pages/submit-fail.html',
        // 管理页面
        adminIndex: './pages/admin/index.html',
        managementAdmin: './pages/management/admin.html'
      }
    }
  },
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      },
      '/admin': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  },
  resolve: {
    alias: {
      '@': './src',
      '@components': './src/components',
      '@utils': './src/utils',
      '@services': './src/services',
      '@stores': './src/stores',
      '@types': './src/types'
    }
  }
})
