import { notificationService } from '../services/notification-service';
import { authStore } from '../stores/auth-store';

export interface FormFieldConfig {
  name: string;
  type: 'text' | 'email' | 'password' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'file' | 'hidden';
  label?: string;
  placeholder?: string;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  validation?: {
    pattern?: RegExp;
    minLength?: number;
    maxLength?: number;
    custom?: (value: any) => string | null;
  };
  attributes?: Record<string, any>;
}

export interface FormConfig {
  fields: FormFieldConfig[];
  submitUrl?: string;
  method?: 'POST' | 'PUT' | 'PATCH';
  successUrl?: string;
  failUrl?: string;
  autoSave?: boolean;
  autoSaveKey?: string;
  submitButtonText?: string;
  resetAfterSubmit?: boolean;
  onSubmit?: (data: FormData) => Promise<any>;
  onSuccess?: (response: any) => void;
  onError?: (error: any) => void;
}

/**
 * 现代化表单组件
 * 提供自动保存、验证、提交等功能
 */
export class FormComponent {
  private container: HTMLElement;
  private form: HTMLFormElement;
  private config: FormConfig;
  private autoSaveTimer: number | null = null;

  constructor(container: HTMLElement | string, config: FormConfig) {
    this.container = typeof container === 'string' 
      ? document.getElementById(container)!
      : container;
    
    if (!this.container) {
      throw new Error('Form container not found');
    }

    this.config = {
      method: 'POST',
      submitButtonText: '提交',
      resetAfterSubmit: true,
      autoSave: true,
      ...config,
    };

    this.render();
    this.bindEvents();
    this.restoreAutoSave();
  }

  /**
   * 渲染表单
   */
  private render(): void {
    const fieldsHtml = this.config.fields.map(field => this.renderField(field)).join('');
    
    this.container.innerHTML = `
      <form class="ea-form space-y-6">
        ${fieldsHtml}
        <div class="flex gap-4 pt-4">
          <button type="submit" class="ea-button flex-1">
            ${this.config.submitButtonText}
          </button>
          <button type="reset" class="ea-button-secondary flex-1">
            重置
          </button>
        </div>
      </form>
    `;

    this.form = this.container.querySelector('form')!;
  }

  /**
   * 渲染单个字段
   */
  private renderField(field: FormFieldConfig): string {
    const { name, type, label, placeholder, required, options, attributes = {} } = field;
    
    const commonAttributes = {
      name,
      id: name,
      required: required || false,
      ...attributes,
    };

    let inputHtml = '';

    switch (type) {
      case 'textarea':
        inputHtml = `
          <textarea 
            class="ea-textarea" 
            placeholder="${placeholder || ''}"
            ${this.attributesToString(commonAttributes)}
          ></textarea>
        `;
        break;

      case 'select':
        inputHtml = `
          <select class="ea-select" ${this.attributesToString(commonAttributes)}>
            <option value="">请选择</option>
            ${options?.map(opt => 
              `<option value="${opt.value}">${opt.label}</option>`
            ).join('') || ''}
          </select>
        `;
        break;

      case 'radio':
        inputHtml = `
          <div class="flex flex-wrap gap-4">
            ${options?.map(opt => `
              <label class="ea-radio-option">
                <input 
                  type="radio" 
                  name="${name}" 
                  value="${opt.value}"
                  ${required ? 'required' : ''}
                  class="mr-2"
                />
                ${opt.label}
              </label>
            `).join('') || ''}
          </div>
        `;
        break;

      case 'checkbox':
        inputHtml = `
          <div class="flex flex-wrap gap-4">
            ${options?.map(opt => `
              <label class="ea-checkbox-option">
                <input 
                  type="checkbox" 
                  name="${name}[]" 
                  value="${opt.value}"
                  class="mr-2"
                />
                ${opt.label}
              </label>
            `).join('') || ''}
          </div>
        `;
        break;

      case 'file':
        inputHtml = `
          <input 
            type="file" 
            class="ea-file-input"
            ${this.attributesToString(commonAttributes)}
          />
        `;
        break;

      case 'hidden':
        return `<input type="hidden" ${this.attributesToString(commonAttributes)} />`;

      default:
        inputHtml = `
          <input 
            type="${type}" 
            class="ea-input" 
            placeholder="${placeholder || ''}"
            ${this.attributesToString(commonAttributes)}
          />
        `;
    }

    if (!label) {
      return inputHtml;
    }

    return `
      <div class="ea-field">
        <label for="${name}" class="ea-label">
          ${label}
          ${required ? '<span class="text-red-500">*</span>' : ''}
        </label>
        ${inputHtml}
      </div>
    `;
  }

  /**
   * 将属性对象转换为字符串
   */
  private attributesToString(attributes: Record<string, any>): string {
    return Object.entries(attributes)
      .map(([key, value]) => {
        if (typeof value === 'boolean') {
          return value ? key : '';
        }
        return `${key}="${String(value).replace(/"/g, '&quot;')}"`;
      })
      .filter(Boolean)
      .join(' ');
  }

  /**
   * 绑定事件
   */
  private bindEvents(): void {
    // 表单提交
    this.form.addEventListener('submit', this.handleSubmit.bind(this));

    // 表单重置
    this.form.addEventListener('reset', this.handleReset.bind(this));

    // 自动保存
    if (this.config.autoSave) {
      this.form.addEventListener('input', this.handleAutoSave.bind(this));
      this.form.addEventListener('change', this.handleAutoSave.bind(this));
    }

    // 实时验证
    this.form.querySelectorAll('input, textarea, select').forEach(field => {
      field.addEventListener('blur', () => this.validateField(field as HTMLInputElement));
    });
  }

  /**
   * 处理表单提交
   */
  private async handleSubmit(e: Event): Promise<void> {
    e.preventDefault();

    // 验证表单
    if (!this.validateForm()) {
      return;
    }

    const submitBtn = this.form.querySelector('button[type="submit"]') as HTMLButtonElement;
    const originalText = submitBtn.textContent;
    
    try {
      submitBtn.disabled = true;
      submitBtn.textContent = '提交中...';

      const formData = new FormData(this.form);
      
      // 添加用户邮箱（如果需要）
      const user = authStore.getCurrentUser();
      if (user && !formData.has('email')) {
        formData.append('email', user.email);
      }

      let response: any;

      if (this.config.onSubmit) {
        response = await this.config.onSubmit(formData);
      } else if (this.config.submitUrl) {
        const httpResponse = await fetch(this.config.submitUrl, {
          method: this.config.method,
          body: formData,
          credentials: 'include',
        });

        if (!httpResponse.ok) {
          throw new Error(`请求失败: ${httpResponse.status}`);
        }

        response = await httpResponse.json();
      } else {
        throw new Error('未配置提交处理方式');
      }

      // 成功处理
      this.clearAutoSave();
      
      if (this.config.onSuccess) {
        this.config.onSuccess(response);
      } else {
        notificationService.success('提交成功');
      }

      if (this.config.resetAfterSubmit) {
        this.form.reset();
      }

      if (this.config.successUrl) {
        window.location.href = this.config.successUrl;
      }

    } catch (error) {
      console.error('Form submission error:', error);
      
      if (this.config.onError) {
        this.config.onError(error);
      } else {
        notificationService.error(
          error instanceof Error ? error.message : '提交失败，请稍后重试'
        );
      }

      if (this.config.failUrl) {
        window.location.href = this.config.failUrl;
      }
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  }

  /**
   * 处理表单重置
   */
  private handleReset(): void {
    this.clearAutoSave();
    this.clearValidationErrors();
  }

  /**
   * 处理自动保存
   */
  private handleAutoSave(): void {
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
    }

    this.autoSaveTimer = window.setTimeout(() => {
      this.saveToStorage();
    }, 500);
  }

  /**
   * 验证整个表单
   */
  private validateForm(): boolean {
    let isValid = true;
    
    this.form.querySelectorAll('input, textarea, select').forEach(field => {
      if (!this.validateField(field as HTMLInputElement)) {
        isValid = false;
      }
    });

    return isValid;
  }

  /**
   * 验证单个字段
   */
  private validateField(field: HTMLInputElement): boolean {
    const fieldConfig = this.config.fields.find(f => f.name === field.name);
    if (!fieldConfig) return true;

    this.clearFieldError(field);

    const value = field.value.trim();
    
    // 必填验证
    if (fieldConfig.required && !value) {
      this.showFieldError(field, `${fieldConfig.label || fieldConfig.name} 是必填项`);
      return false;
    }

    // 自定义验证
    if (fieldConfig.validation) {
      const { pattern, minLength, maxLength, custom } = fieldConfig.validation;

      if (pattern && value && !pattern.test(value)) {
        this.showFieldError(field, `${fieldConfig.label || fieldConfig.name} 格式不正确`);
        return false;
      }

      if (minLength && value.length < minLength) {
        this.showFieldError(field, `${fieldConfig.label || fieldConfig.name} 最少需要 ${minLength} 个字符`);
        return false;
      }

      if (maxLength && value.length > maxLength) {
        this.showFieldError(field, `${fieldConfig.label || fieldConfig.name} 最多允许 ${maxLength} 个字符`);
        return false;
      }

      if (custom) {
        const customError = custom(value);
        if (customError) {
          this.showFieldError(field, customError);
          return false;
        }
      }
    }

    return true;
  }

  /**
   * 显示字段错误
   */
  private showFieldError(field: HTMLElement, message: string): void {
    field.classList.add('border-red-500');
    
    let errorElement = field.parentElement?.querySelector('.field-error');
    if (!errorElement) {
      errorElement = document.createElement('div');
      errorElement.className = 'field-error text-red-500 text-sm mt-1';
      field.parentElement?.appendChild(errorElement);
    }
    
    errorElement.textContent = message;
  }

  /**
   * 清除字段错误
   */
  private clearFieldError(field: HTMLElement): void {
    field.classList.remove('border-red-500');
    const errorElement = field.parentElement?.querySelector('.field-error');
    if (errorElement) {
      errorElement.remove();
    }
  }

  /**
   * 清除所有验证错误
   */
  private clearValidationErrors(): void {
    this.form.querySelectorAll('.border-red-500').forEach(el => {
      el.classList.remove('border-red-500');
    });
    this.form.querySelectorAll('.field-error').forEach(el => {
      el.remove();
    });
  }

  /**
   * 保存到本地存储
   */
  private saveToStorage(): void {
    if (!this.config.autoSave) return;

    const key = this.config.autoSaveKey || 'ea-form-autosave';
    const data: Record<string, any> = {};

    this.form.querySelectorAll('input, textarea, select').forEach(field => {
      const element = field as HTMLInputElement;
      if (element.type === 'file' || !element.name) return;

      if (element.type === 'radio' || element.type === 'checkbox') {
        if (element.checked) {
          if (element.name.endsWith('[]')) {
            if (!data[element.name]) data[element.name] = [];
            data[element.name].push(element.value);
          } else {
            data[element.name] = element.value;
          }
        }
      } else {
        data[element.name] = element.value;
      }
    });

    localStorage.setItem(key, JSON.stringify(data));
  }

  /**
   * 从本地存储恢复
   */
  private restoreAutoSave(): void {
    if (!this.config.autoSave) return;

    const key = this.config.autoSaveKey || 'ea-form-autosave';
    const saved = localStorage.getItem(key);
    
    if (!saved) return;

    try {
      const data = JSON.parse(saved);
      
      Object.entries(data).forEach(([name, value]) => {
        const elements = this.form.querySelectorAll(`[name="${name}"], [name="${name}[]"]`);
        
        elements.forEach((element) => {
          const field = element as HTMLInputElement;
          
          if (field.type === 'radio' || field.type === 'checkbox') {
            field.checked = Array.isArray(value) 
              ? value.includes(field.value)
              : value === field.value;
          } else if (field.tagName === 'SELECT') {
            field.value = value as string;
          } else if (field.type !== 'file') {
            field.value = value as string;
          }
        });
      });
    } catch (error) {
      console.warn('Failed to restore auto-save data:', error);
    }
  }

  /**
   * 清除自动保存数据
   */
  private clearAutoSave(): void {
    const key = this.config.autoSaveKey || 'ea-form-autosave';
    localStorage.removeItem(key);
  }

  /**
   * 获取表单数据
   */
  getFormData(): FormData {
    return new FormData(this.form);
  }

  /**
   * 设置字段值
   */
  setFieldValue(name: string, value: any): void {
    const field = this.form.querySelector(`[name="${name}"]`) as HTMLInputElement;
    if (field) {
      field.value = value;
    }
  }

  /**
   * 获取字段值
   */
  getFieldValue(name: string): any {
    const field = this.form.querySelector(`[name="${name}"]`) as HTMLInputElement;
    return field ? field.value : null;
  }

  /**
   * 销毁组件
   */
  destroy(): void {
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
    }
  }
}
