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
        login: './pages/auth/login.html',
        register: './pages/auth/register.html',
        userIndex: './pages/user/index.html',
        service: './pages/service/service.html',
        inspection: './pages/service/inspection.html',
        coverletter: './pages/service/coverletter.html',
        'airport-pickup': './pages/service/airport-pickup.html',
        // 管理中心页面
        adminIndex: './pages/admin/index.html',
        adminDashboard: './pages/admin/dashboard.html',
        adminUserManagement: './pages/admin/user-management.html',
        adminFormList: './pages/admin/form-list.html'
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
