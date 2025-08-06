import { notificationService } from '../services/notification-service';
import { authStore } from '../stores/auth-store';
import { FormComponent } from '../components/form';
import { PaginationComponent } from '../components/pagination';

/**
 * 功能演示页面
 * 展示所有新组件和功能的使用方法
 */
export class DemoPage {
  private container: HTMLElement;

  constructor() {
    this.container = document.getElementById('demoContainer')!;
    this.init();
  }

  private init(): void {
    this.render();
    this.setupDemos();
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="space-y-8">
        <!-- 页面标题 -->
        <div class="text-center">
          <h1 class="text-3xl font-bold text-gray-900 mb-4">现代化前端功能演示</h1>
          <p class="text-gray-600">展示重构后的组件和功能</p>
        </div>

        <!-- 通知系统演示 -->
        <div class="ea-card">
          <div class="ea-card-header">
            <h2 class="text-lg font-semibold">通知系统演示</h2>
          </div>
          <div class="ea-card-body">
            <p class="text-gray-600 mb-4">替代传统的 alert()，提供更好的用户体验</p>
            <div class="flex flex-wrap gap-2">
              <button id="btnSuccess" class="ea-button-small bg-green-600 hover:bg-green-700">成功通知</button>
              <button id="btnError" class="ea-button-small bg-red-600 hover:bg-red-700">错误通知</button>
              <button id="btnWarning" class="ea-button-small bg-yellow-600 hover:bg-yellow-700">警告通知</button>
              <button id="btnInfo" class="ea-button-small bg-blue-600 hover:bg-blue-700">信息通知</button>
              <button id="btnLoading" class="ea-button-small bg-purple-600 hover:bg-purple-700">加载通知</button>
              <button id="btnClear" class="ea-button-small bg-gray-600 hover:bg-gray-700">清除所有</button>
            </div>
          </div>
        </div>

        <!-- 用户认证状态演示 -->
        <div class="ea-card">
          <div class="ea-card-header">
            <h2 class="text-lg font-semibold">用户认证状态</h2>
          </div>
          <div class="ea-card-body">
            <div id="userStatus" class="mb-4">
              <!-- 用户状态将动态显示 -->
            </div>
            <div class="flex gap-2">
              <button id="btnCheckAuth" class="ea-button-small">检查认证状态</button>
              <button id="btnMockLogin" class="ea-button-small bg-green-600 hover:bg-green-700">模拟登录</button>
              <button id="btnLogout" class="ea-button-small bg-red-600 hover:bg-red-700">退出登录</button>
            </div>
          </div>
        </div>

        <!-- 表单组件演示 -->
        <div class="ea-card">
          <div class="ea-card-header">
            <h2 class="text-lg font-semibold">现代化表单组件</h2>
          </div>
          <div class="ea-card-body">
            <p class="text-gray-600 mb-4">支持自动保存、验证、提交等功能</p>
            <div id="demoFormContainer" class="max-w-md">
              <!-- 表单将在这里渲染 -->
            </div>
          </div>
        </div>

        <!-- 分页组件演示 -->
        <div class="ea-card">
          <div class="ea-card-header">
            <h2 class="text-lg font-semibold">分页组件演示</h2>
          </div>
          <div class="ea-card-body">
            <p class="text-gray-600 mb-4">现代化的分页控件，支持多种配置</p>
            <div id="paginationDemo"></div>
          </div>
        </div>

        <!-- HTTP 请求演示 -->
        <div class="ea-card">
          <div class="ea-card-header">
            <h2 class="text-lg font-semibold">HTTP 客户端演示</h2>
          </div>
          <div class="ea-card-body">
            <p class="text-gray-600 mb-4">统一的HTTP请求处理，支持拦截器和错误处理</p>
            <div class="flex gap-2 mb-4">
              <button id="btnGetDemo" class="ea-button-small">GET 请求演示</button>
              <button id="btnPostDemo" class="ea-button-small">POST 请求演示</button>
              <button id="btnErrorDemo" class="ea-button-small bg-red-600 hover:bg-red-700">错误处理演示</button>
            </div>
            <div id="httpResults" class="bg-gray-50 p-4 rounded text-sm min-h-[100px] overflow-auto">
              <p class="text-gray-500">请求结果将显示在这里...</p>
            </div>
          </div>
        </div>

        <!-- 样式系统演示 -->
        <div class="ea-card">
          <div class="ea-card-header">
            <h2 class="text-lg font-semibold">样式系统演示</h2>
          </div>
          <div class="ea-card-body">
            <p class="text-gray-600 mb-4">统一的设计系统和组件样式</p>
            
            <!-- 按钮样式 -->
            <div class="mb-6">
              <h3 class="font-medium mb-2">按钮样式</h3>
              <div class="flex flex-wrap gap-2">
                <button class="ea-button-small">主要按钮</button>
                <button class="ea-button-small bg-gray-600 hover:bg-gray-700">次要按钮</button>
                <button class="ea-button-small bg-green-600 hover:bg-green-700">成功按钮</button>
                <button class="ea-button-small bg-red-600 hover:bg-red-700">危险按钮</button>
                <button class="ea-button-small" disabled>禁用按钮</button>
              </div>
            </div>

            <!-- 徽章样式 -->
            <div class="mb-6">
              <h3 class="font-medium mb-2">状态徽章</h3>
              <div class="flex flex-wrap gap-2">
                <span class="ea-badge-success">成功</span>
                <span class="ea-badge-warning">警告</span>
                <span class="ea-badge-error">错误</span>
                <span class="ea-badge-info">信息</span>
              </div>
            </div>

            <!-- 网格布局 -->
            <div>
              <h3 class="font-medium mb-2">响应式网格</h3>
              <div class="ea-grid-3">
                <div class="bg-blue-50 p-4 rounded text-center">网格项 1</div>
                <div class="bg-green-50 p-4 rounded text-center">网格项 2</div>
                <div class="bg-yellow-50 p-4 rounded text-center">网格项 3</div>
                <div class="bg-purple-50 p-4 rounded text-center">网格项 4</div>
                <div class="bg-pink-50 p-4 rounded text-center">网格项 5</div>
                <div class="bg-indigo-50 p-4 rounded text-center">网格项 6</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private setupDemos(): void {
    this.setupNotificationDemo();
    this.setupAuthDemo();
    this.setupFormDemo();
    this.setupPaginationDemo();
    this.setupHttpDemo();
  }

  /**
   * 设置通知演示
   */
  private setupNotificationDemo(): void {
    document.getElementById('btnSuccess')?.addEventListener('click', () => {
      notificationService.success('这是一个成功通知！');
    });

    document.getElementById('btnError')?.addEventListener('click', () => {
      notificationService.error('这是一个错误通知！');
    });

    document.getElementById('btnWarning')?.addEventListener('click', () => {
      notificationService.warning('这是一个警告通知！');
    });

    document.getElementById('btnInfo')?.addEventListener('click', () => {
      notificationService.info('这是一个信息通知！');
    });

    document.getElementById('btnLoading')?.addEventListener('click', () => {
      const loadingId = notificationService.loading('正在处理中...');
      
      // 3秒后完成
      setTimeout(() => {
        notificationService.finishLoading(loadingId, 'success', '处理完成！');
      }, 3000);
    });

    document.getElementById('btnClear')?.addEventListener('click', () => {
      notificationService.clear();
    });
  }

  /**
   * 设置认证演示
   */
  private setupAuthDemo(): void {
    const updateUserStatus = () => {
      const user = authStore.getCurrentUser();
      const statusDiv = document.getElementById('userStatus')!;
      
      if (user) {
        statusDiv.innerHTML = `
          <div class="bg-green-50 border border-green-200 rounded p-3">
            <p class="text-green-800">
              ✅ 已登录用户：<strong>${user.email}</strong>
            </p>
            <p class="text-sm text-green-600 mt-1">
              角色：${user.roles.join(', ')}
            </p>
          </div>
        `;
      } else {
        statusDiv.innerHTML = `
          <div class="bg-yellow-50 border border-yellow-200 rounded p-3">
            <p class="text-yellow-800">⚠️ 未登录状态</p>
          </div>
        `;
      }
    };

    // 初始状态
    updateUserStatus();

    // 订阅状态变化
    authStore.subscribe(updateUserStatus);

    document.getElementById('btnCheckAuth')?.addEventListener('click', () => {
      updateUserStatus();
      notificationService.info('认证状态已更新');
    });

    document.getElementById('btnMockLogin')?.addEventListener('click', () => {
      // 模拟登录（仅用于演示）
      notificationService.info('这只是演示，实际登录请使用登录页面');
    });

    document.getElementById('btnLogout')?.addEventListener('click', () => {
      authStore.logout();
    });
  }

  /**
   * 设置表单演示
   */
  private setupFormDemo(): void {
    const formContainer = document.getElementById('demoFormContainer')!;
    
    const form = new FormComponent(formContainer, {
      fields: [
        {
          name: 'name',
          type: 'text',
          label: '姓名',
          required: true,
          placeholder: '请输入姓名',
        },
        {
          name: 'email',
          type: 'email',
          label: '邮箱',
          required: true,
          placeholder: '请输入邮箱',
        },
        {
          name: 'service',
          type: 'select',
          label: '服务类型',
          required: true,
          options: [
            { value: 'inspection', label: '预约看房' },
            { value: 'coverletter', label: '求职信' },
            { value: 'pickup', label: '接机服务' },
          ],
        },
        {
          name: 'priority',
          type: 'radio',
          label: '优先级',
          required: true,
          options: [
            { value: 'normal', label: '普通' },
            { value: 'urgent', label: '紧急' },
          ],
        },
        {
          name: 'message',
          type: 'textarea',
          label: '备注信息',
          placeholder: '请输入备注信息',
        },
      ],
      submitButtonText: '提交演示',
      autoSave: true,
      autoSaveKey: 'demo-form',
      onSubmit: async (formData) => {
        // 模拟提交
        await new Promise(resolve => setTimeout(resolve, 1000));
        notificationService.success('表单提交成功！这只是演示。');
        return { success: true };
      },
    });
  }

  /**
   * 设置分页演示
   */
  private setupPaginationDemo(): void {
    const paginationContainer = document.getElementById('paginationDemo')!;
    
    new PaginationComponent(
      paginationContainer,
      {
        currentPage: 1,
        totalPages: 10,
        totalItems: 95,
        pageSize: 10,
        showInfo: true,
        showSizeChanger: true,
      },
      {
        onPageChange: (page) => {
          notificationService.info(`切换到第 ${page} 页`);
        },
        onPageSizeChange: (pageSize) => {
          notificationService.info(`每页显示 ${pageSize} 条`);
        },
      }
    );
  }

  /**
   * 设置HTTP演示
   */
  private setupHttpDemo(): void {
    const resultsDiv = document.getElementById('httpResults')!;
    
    const updateResults = (content: string) => {
      resultsDiv.innerHTML = `<pre class="whitespace-pre-wrap">${content}</pre>`;
    };

    document.getElementById('btnGetDemo')?.addEventListener('click', async () => {
      try {
        updateResults('正在发送 GET 请求...');
        
        // 这是一个演示请求，实际可能会失败
        const response = await fetch('/api/demo/get');
        const data = await response.text();
        
        updateResults(`GET 请求成功:\n${data}`);
      } catch (error) {
        updateResults(`GET 请求演示:\n这是模拟的成功响应\n{\n  "message": "GET 请求成功",\n  "timestamp": "${new Date().toISOString()}"\n}`);
      }
    });

    document.getElementById('btnPostDemo')?.addEventListener('click', async () => {
      try {
        updateResults('正在发送 POST 请求...');
        
        // 模拟 POST 请求
        setTimeout(() => {
          updateResults(`POST 请求演示:\n这是模拟的成功响应\n{\n  "message": "POST 请求成功",\n  "data": {\n    "id": 123,\n    "status": "created"\n  },\n  "timestamp": "${new Date().toISOString()}"\n}`);
        }, 1000);
      } catch (error) {
        updateResults(`POST 请求失败:\n${error}`);
      }
    });

    document.getElementById('btnErrorDemo')?.addEventListener('click', () => {
      updateResults('错误处理演示:\n这展示了统一的错误处理机制');
      notificationService.error('这是一个模拟的错误通知');
    });
  }
}

export default DemoPage;
