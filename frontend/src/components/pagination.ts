export interface PaginationConfig {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  pageSize?: number;
  maxVisiblePages?: number;
  showInfo?: boolean;
  showSizeChanger?: boolean;
  pageSizeOptions?: number[];
}

export interface PaginationCallbacks {
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

/**
 * 现代化分页组件
 * 提供灵活的分页控制，支持多种显示模式
 */
export class PaginationComponent {
  private container: HTMLElement;
  private config: Required<PaginationConfig>;
  private callbacks: PaginationCallbacks;

  constructor(
    container: HTMLElement | string,
    config: PaginationConfig,
    callbacks: PaginationCallbacks
  ) {
    this.container = typeof container === 'string' 
      ? document.getElementById(container)!
      : container;
    
    if (!this.container) {
      throw new Error('Pagination container not found');
    }

    this.config = {
      maxVisiblePages: 7,
      showInfo: true,
      showSizeChanger: false,
      pageSizeOptions: [10, 20, 50, 100],
      pageSize: 10,
      totalItems: 0,
      ...config,
    };

    this.callbacks = callbacks;
    this.render();
  }

  /**
   * 更新分页配置
   */
  update(config: Partial<PaginationConfig>): void {
    this.config = { ...this.config, ...config };
    this.render();
  }

  /**
   * 渲染分页组件
   */
  private render(): void {
    const { currentPage, totalPages, totalItems, pageSize, showInfo, showSizeChanger } = this.config;

    if (totalPages <= 1 && !showInfo) {
      this.container.innerHTML = '';
      return;
    }

    const infoHtml = showInfo ? this.renderInfo() : '';
    const paginationHtml = totalPages > 1 ? this.renderPagination() : '';
    const sizeChangerHtml = showSizeChanger ? this.renderSizeChanger() : '';

    this.container.innerHTML = `
      <div class="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div class="flex items-center gap-4">
          ${infoHtml}
          ${sizeChangerHtml}
        </div>
        ${paginationHtml}
      </div>
    `;

    this.bindEvents();
  }

  /**
   * 渲染信息显示
   */
  private renderInfo(): string {
    const { currentPage, totalPages, totalItems, pageSize } = this.config;
    
    if (!totalItems) {
      return `<span class="text-sm text-gray-500">共 ${totalPages} 页</span>`;
    }

    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, totalItems);

    return `
      <span class="text-sm text-gray-500">
        显示 ${start}-${end} 条，共 ${totalItems} 条记录
      </span>
    `;
  }

  /**
   * 渲染页面大小选择器
   */
  private renderSizeChanger(): string {
    const { pageSize, pageSizeOptions } = this.config;

    return `
      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-500">每页</span>
        <select 
          class="pagination-size-select border border-gray-300 rounded px-2 py-1 text-sm"
          data-current="${pageSize}"
        >
          ${pageSizeOptions.map(size => `
            <option value="${size}" ${size === pageSize ? 'selected' : ''}>
              ${size}
            </option>
          `).join('')}
        </select>
        <span class="text-sm text-gray-500">条</span>
      </div>
    `;
  }

  /**
   * 渲染分页按钮
   */
  private renderPagination(): string {
    const { currentPage, totalPages } = this.config;
    const pages = this.getVisiblePages();

    return `
      <nav class="flex items-center gap-1">
        ${this.renderNavButton('prev', currentPage > 1, '上一页')}
        ${pages.map(page => this.renderPageButton(page, currentPage)).join('')}
        ${this.renderNavButton('next', currentPage < totalPages, '下一页')}
      </nav>
    `;
  }

  /**
   * 渲染导航按钮（上一页/下一页）
   */
  private renderNavButton(type: 'prev' | 'next', enabled: boolean, label: string): string {
    const icon = type === 'prev' 
      ? '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>'
      : '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"></path></svg>';

    return `
      <button
        class="pagination-nav-btn flex items-center gap-1 px-3 py-2 text-sm border rounded-md transition-colors ${enabled 
          ? 'text-gray-700 border-gray-300 hover:bg-gray-50' 
          : 'text-gray-400 border-gray-200 cursor-not-allowed'
        }"
        data-type="${type}"
        ${enabled ? '' : 'disabled'}
      >
        ${type === 'prev' ? icon : ''}
        <span class="hidden sm:inline">${label}</span>
        ${type === 'next' ? icon : ''}
      </button>
    `;
  }

  /**
   * 渲染页码按钮
   */
  private renderPageButton(page: number | '...', currentPage: number): string {
    if (page === '...') {
      return `
        <span class="px-3 py-2 text-sm text-gray-400">...</span>
      `;
    }

    const isActive = page === currentPage;
    
    return `
      <button
        class="pagination-page-btn px-3 py-2 text-sm border rounded-md transition-colors ${isActive
          ? 'bg-primary-600 text-white border-primary-600'
          : 'text-gray-700 border-gray-300 hover:bg-gray-50'
        }"
        data-page="${page}"
        ${isActive ? 'disabled' : ''}
      >
        ${page}
      </button>
    `;
  }

  /**
   * 获取可见页码
   */
  private getVisiblePages(): (number | '...')[] {
    const { currentPage, totalPages, maxVisiblePages } = this.config;

    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | '...')[] = [];
    const halfVisible = Math.floor(maxVisiblePages / 2);

    // 总是显示第一页
    pages.push(1);

    if (currentPage <= halfVisible + 2) {
      // 当前页靠近开始
      for (let i = 2; i <= Math.min(maxVisiblePages - 1, totalPages - 1); i++) {
        pages.push(i);
      }
      if (totalPages > maxVisiblePages) {
        pages.push('...');
      }
    } else if (currentPage >= totalPages - halfVisible - 1) {
      // 当前页靠近结束
      if (totalPages > maxVisiblePages) {
        pages.push('...');
      }
      for (let i = Math.max(2, totalPages - maxVisiblePages + 2); i <= totalPages - 1; i++) {
        pages.push(i);
      }
    } else {
      // 当前页在中间
      pages.push('...');
      for (let i = currentPage - halfVisible + 1; i <= currentPage + halfVisible - 1; i++) {
        pages.push(i);
      }
      pages.push('...');
    }

    // 总是显示最后一页
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  }

  /**
   * 绑定事件
   */
  private bindEvents(): void {
    // 页码按钮点击
    this.container.querySelectorAll('.pagination-page-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const page = parseInt((e.target as HTMLElement).dataset.page!);
        if (page !== this.config.currentPage) {
          this.callbacks.onPageChange(page);
        }
      });
    });

    // 导航按钮点击
    this.container.querySelectorAll('.pagination-nav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const type = (e.currentTarget as HTMLElement).dataset.type;
        if (type === 'prev' && this.config.currentPage > 1) {
          this.callbacks.onPageChange(this.config.currentPage - 1);
        } else if (type === 'next' && this.config.currentPage < this.config.totalPages) {
          this.callbacks.onPageChange(this.config.currentPage + 1);
        }
      });
    });

    // 页面大小选择器
    const sizeSelect = this.container.querySelector('.pagination-size-select') as HTMLSelectElement;
    if (sizeSelect && this.callbacks.onPageSizeChange) {
      sizeSelect.addEventListener('change', (e) => {
        const newSize = parseInt((e.target as HTMLSelectElement).value);
        if (this.callbacks.onPageSizeChange) {
          this.callbacks.onPageSizeChange(newSize);
        }
      });
    }
  }
}

/**
 * 简化的分页函数，兼容旧代码
 */
export function renderPagination(
  container: HTMLElement | string,
  currentPage: number,
  totalPages: number,
  onPageChange: (page: number) => void
): PaginationComponent {
  return new PaginationComponent(
    container,
    { currentPage, totalPages },
    { onPageChange }
  );
}
