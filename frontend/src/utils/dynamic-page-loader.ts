/**
 * 动态页面加载器
 * 处理SPA中动态加载HTML页面和执行相关脚本
 */

export class DynamicPageLoader {
    private loadedScripts: Set<string> = new Set();

    /**
     * 加载页面内容并执行相关脚本
     */
    async loadPage(url: string, container: HTMLElement): Promise<void> {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to load page: ${response.status}`);
            }

            const html = await response.text();
            container.innerHTML = html;

            // 执行页面中的脚本
            await this.executeScripts(container);
            
        } catch (error) {
            console.error('Page loading error:', error);
            throw error;
        }
    }

    /**
     * 执行容器中的脚本
     */
    private async executeScripts(container: HTMLElement): Promise<void> {
        const scripts = container.querySelectorAll('script');
        
        for (const script of scripts) {
            try {
                if (script.src) {
                    // 外部脚本
                    if (!this.loadedScripts.has(script.src)) {
                        await this.loadExternalScript(script.src);
                        this.loadedScripts.add(script.src);
                    }
                } else if (script.textContent?.trim()) {
                    // 内联脚本
                    this.executeInlineScript(script.textContent);
                }
            } catch (error) {
                console.error('Script execution error:', error);
            }
        }
    }

    /**
     * 加载外部脚本
     */
    private loadExternalScript(src: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
            document.head.appendChild(script);
        });
    }

    /**
     * 执行内联脚本
     */
    private executeInlineScript(code: string): void {
        try {
            // 创建一个函数作用域来执行脚本，避免污染全局作用域
            const func = new Function(code);
            func();
        } catch (error) {
            console.error('Inline script execution error:', error);
        }
    }

    /**
     * 清理已加载的脚本记录
     */
    clearCache(): void {
        this.loadedScripts.clear();
    }
}

// 导出单例实例
export const pageLoader = new DynamicPageLoader();
