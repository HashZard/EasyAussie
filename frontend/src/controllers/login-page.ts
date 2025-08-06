import { authStore } from '../stores/auth-store';
import { notificationService } from '../services/notification-service';
import { FormComponent } from '../components/form';

/**
 * 现代化登录页面组件
 */
export class LoginPage {
  private container: HTMLElement;
  private captchaImg?: HTMLImageElement;

  constructor() {
    this.container = document.getElementById('loginContainer')!;
    this.init();
  }

  /**
   * 初始化登录页面
   */
  private async init(): Promise<void> {
    // 检查是否已经登录
    const user = authStore.getCurrentUser();
    if (user) {
      this.redirectToReturnUrl();
      return;
    }

    this.render();
    this.setupForm();
  }

  /**
   * 渲染登录页面
   */
  private render(): void {
    this.container.innerHTML = `
      <div class="text-center mb-6">
        <h1 class="text-2xl font-bold text-gray-900 mb-2">用户登录</h1>
        <p class="text-gray-600">欢迎回到 Easy Aussie</p>
      </div>
      
      <div id="loginFormContainer"></div>
      
      <div class="mt-6 text-center">
        <p class="text-sm text-gray-600">
          还没有账号？
          <a href="/pages/auth/register.html" class="text-blue-600 hover:text-blue-500 font-medium">
            立即注册
          </a>
        </p>
      </div>
    `;
  }

  /**
   * 设置表单
   */
  private setupForm(): void {
    const formContainer = document.getElementById('loginFormContainer')!;
    
    // 创建自定义验证码字段HTML
    const captchaFieldHtml = `
      <div class="ea-field">
        <label class="ea-label">
          验证码
          <span class="text-red-500">*</span>
        </label>
        <div class="flex gap-2 items-center">
          <input 
            name="captcha" 
            type="text" 
            class="ea-input flex-1" 
            placeholder="请输入验证码"
            maxlength="4"
            required
          />
          <img 
            id="captchaImg" 
            src="/api/captcha" 
            alt="验证码" 
            class="captcha-img cursor-pointer hover:opacity-80 transition-opacity"
            title="点击刷新验证码"
          />
        </div>
      </div>
    `;

    // 使用表单组件
    const form = new FormComponent(formContainer, {
      fields: [
        {
          name: 'email',
          type: 'email',
          label: '邮箱地址',
          required: true,
          placeholder: '请输入邮箱地址',
          validation: {
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          },
        },
        {
          name: 'password',
          type: 'password',
          label: '密码',
          required: true,
          placeholder: '请输入密码',
          validation: {
            minLength: 6,
          },
        },
      ],
      submitButtonText: '登录',
      autoSave: false, // 登录表单不需要自动保存
      onSubmit: this.handleLogin.bind(this),
      onSuccess: () => {
        this.redirectToReturnUrl();
      },
      onError: (error) => {
        // 刷新验证码
        this.refreshCaptcha();
      },
    });

    // 手动添加验证码字段（因为它需要特殊处理）
    const formElement = formContainer.querySelector('form')!;
    const submitButton = formElement.querySelector('button[type="submit"]')!;
    
    // 在提交按钮前插入验证码字段
    submitButton.parentNode!.insertBefore(
      this.createElementFromHTML(captchaFieldHtml),
      submitButton
    );

    // 设置验证码图片事件
    this.setupCaptcha();
  }

  /**
   * 设置验证码功能
   */
  private setupCaptcha(): void {
    this.captchaImg = document.getElementById('captchaImg') as HTMLImageElement;
    
    if (this.captchaImg) {
      this.captchaImg.addEventListener('click', () => {
        this.refreshCaptcha();
      });

      // 加载失败时也可以点击刷新
      this.captchaImg.addEventListener('error', () => {
        this.captchaImg!.alt = '验证码加载失败，点击重试';
      });
    }
  }

  /**
   * 刷新验证码
   */
  private refreshCaptcha(): void {
    if (this.captchaImg) {
      this.captchaImg.src = `/api/captcha?reload=${Date.now()}`;
    }
  }

  /**
   * 处理登录
   */
  private async handleLogin(formData: FormData): Promise<any> {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const captcha = formData.get('captcha') as string;

    // 验证验证码
    if (!captcha || captcha.length !== 4) {
      throw new Error('请输入4位验证码');
    }

    try {
      // 使用认证存储进行登录
      const user = await authStore.login({
        email: email.trim(),
        password: password.trim(),
        captcha: captcha.trim(),
      });

      notificationService.success(`欢迎回来，${user.email}！`);
      return user;
    } catch (error) {
      // 登录失败，刷新验证码
      this.refreshCaptcha();
      throw error;
    }
  }

  /**
   * 重定向到返回URL
   */
  private redirectToReturnUrl(): void {
    const urlParams = new URLSearchParams(window.location.search);
    const returnUrl = urlParams.get('next') || '/index.html';
    
    // 延迟跳转，让用户看到成功消息
    setTimeout(() => {
      window.location.href = returnUrl;
    }, 1000);
  }

  /**
   * 从HTML字符串创建元素
   */
  private createElementFromHTML(htmlString: string): HTMLElement {
    const div = document.createElement('div');
    div.innerHTML = htmlString.trim();
    return div.firstChild as HTMLElement;
  }
}

export default LoginPage;
