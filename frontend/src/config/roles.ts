/**
 * 角色层次结构管理系统
 * 支持后端驱动的角色继承和权限管理
 */

// 角色接口定义
interface Role {
    id: number;
    code: string;
    displayName: string;
    description?: string;
    level: number;
    parentRoleId?: number;
    parentCode?: string;
    isActive: boolean;
    color: string;
    icon: string;
    inheritedRoles?: string[];
    createdAt?: string;
}

// 用户角色信息
export interface UserRole {
    id: string;
    email: string;
    roles: Role[];
}

// API响应类型
export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
}

// 角色API服务类
export class RoleService {
    private static baseUrl = '/admin';
    
    /**
     * 获取所有角色列表
     */
    static async getAllRoles(): Promise<ApiResponse<{ roles: Role[] }>> {
        try {
            const response = await fetch(`${this.baseUrl}/roles`, {
                credentials: 'include'
            });
            return await response.json();
        } catch (error) {
            return { success: false, message: '获取角色列表失败' };
        }
    }
    
    /**
     * 获取当前用户可管理的角色
     */
    static async getManageableRoles(): Promise<ApiResponse<{ roles: Role[] }>> {
        try {
            const response = await fetch(`${this.baseUrl}/roles/manageable`, {
                credentials: 'include'
            });
            return await response.json();
        } catch (error) {
            return { success: false, message: '获取可管理角色失败' };
        }
    }
    
    /**
     * 获取角色层次结构树
     */
    static async getRoleHierarchy(): Promise<ApiResponse<{ hierarchy: Role[] }>> {
        try {
            const response = await fetch(`${this.baseUrl}/roles/hierarchy`, {
                credentials: 'include'
            });
            return await response.json();
        } catch (error) {
            return { success: false, message: '获取角色层次结构失败' };
        }
    }
    
    /**
     * 创建新角色
     */
    static async createRole(roleData: {
        code: string;
        displayName: string;
        description: string;
        level: number;
        parentCode?: string;
        color: string;
        icon: string;
    }): Promise<{
        success: boolean;
        message: string;
        role?: Role;
    }> {
        try {
            const response = await fetch(`${this.baseUrl}/roles`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(roleData),
            });
            return await response.json();
        } catch (error) {
            return { success: false, message: '创建角色失败' };
        }
    }
    
    /**
     * 更新角色
     */
    static async updateRole(code: string, updates: {
        displayName?: string;
        description?: string;
        level?: number;
        parentCode?: string;
    }): Promise<ApiResponse<{ role: Role }>> {
        try {
            const response = await fetch(`${this.baseUrl}/roles/${code}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(updates),
            });
            return await response.json();
        } catch (error) {
            return { success: false, message: '更新角色失败' };
        }
    }
    
    /**
     * 删除角色
     */
    static async deleteRole(code: string): Promise<ApiResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/roles/${code}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            return await response.json();
        } catch (error) {
            return { success: false, message: '删除角色失败' };
        }
    }
    
    /**
     * 为用户分配角色
     */
    static async assignRoleToUser(userId: string, roleCode: string): Promise<ApiResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/users/${userId}/roles`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ role_code: roleCode }),
            });
            return await response.json();
        } catch (error) {
            return { success: false, message: '分配角色失败' };
        }
    }
    
    /**
     * 从用户移除角色
     */
    static async removeRoleFromUser(userId: string, roleCode: string): Promise<ApiResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/users/${userId}/roles`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ role_code: roleCode }),
            });
            return await response.json();
        } catch (error) {
            return { success: false, message: '移除角色失败' };
        }
    }
    
    /**
     * 批量更新用户角色
     */
    static async bulkUpdateUserRoles(userId: string, roleCodes: string[]): Promise<ApiResponse<{ user: UserRole }>> {
        try {
            const response = await fetch(`${this.baseUrl}/users/${userId}/roles`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ role_codes: roleCodes }),
            });
            return await response.json();
        } catch (error) {
            return { success: false, message: '批量更新用户角色失败' };
        }
    }
}

// 角色管理器类 - 管理角色缓存和工具方法
export class RoleManager {
    private static instance: RoleManager;
    private roles: Role[] = [];
    private roleMap: Map<string, Role> = new Map();
    private hierarchy: Role[] = [];
    private lastUpdate: number = 0;
    private readonly cacheTimeout = 5 * 60 * 1000; // 5分钟缓存

    private constructor() {}

    public static getInstance(): RoleManager {
        if (!RoleManager.instance) {
            RoleManager.instance = new RoleManager();
        }
        return RoleManager.instance;
    }

    /**
     * 刷新角色数据
     */
    public async refreshRoles(force: boolean = false): Promise<boolean> {
        const now = Date.now();
        if (!force && this.lastUpdate && (now - this.lastUpdate) < this.cacheTimeout) {
            return true; // 使用缓存
        }

        try {
            const response = await RoleService.getAllRoles();
            if (response.success && response.data?.roles) {
                this.roles = response.data.roles;
                this.roleMap.clear();
                this.roles.forEach(role => {
                    this.roleMap.set(role.code, role);
                });
                this.lastUpdate = now;
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to refresh roles:', error);
            return false;
        }
    }

    /**
     * 刷新角色层次结构
     */
    public async refreshHierarchy(): Promise<boolean> {
        try {
            const response = await RoleService.getRoleHierarchy();
            if (response.success && response.data?.hierarchy) {
                this.hierarchy = response.data.hierarchy;
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to refresh role hierarchy:', error);
            return false;
        }
    }

    /**
     * 获取所有角色
     */
    public async getAllRoles(): Promise<Role[]> {
        await this.refreshRoles();
        return [...this.roles];
    }

    /**
     * 获取角色层次结构
     */
    public async getRoleHierarchy(): Promise<Role[]> {
        await this.refreshHierarchy();
        return [...this.hierarchy];
    }

    /**
     * 根据代码获取角色
     */
    public async getRoleByCode(code: string): Promise<Role | undefined> {
        await this.refreshRoles();
        return this.roleMap.get(code);
    }

    /**
     * 获取可管理的角色
     */
    public async getManageableRoles(): Promise<Role[]> {
        try {
            const response = await RoleService.getManageableRoles();
            if (response.success && response.data?.roles) {
                return response.data.roles;
            }
            return [];
        } catch (error) {
            console.error('Failed to get manageable roles:', error);
            return [];
        }
    }

    /**
     * 清除缓存
     */
    public clearCache(): void {
        this.lastUpdate = 0;
        this.roles = [];
        this.roleMap.clear();
        this.hierarchy = [];
    }
}

// 角色工具类
export class RoleUtils {
    /**
     * 获取角色的所有父角色代码（包括间接父角色）
     */
    static getParentRoleCodes(roleCode: string, allRoles: Role[]): string[] {
        const roleMap = new Map(allRoles.map(r => [r.code, r]));
        const parentCodes: string[] = [];
        
        let currentRole = roleMap.get(roleCode);
        while (currentRole?.parentCode) {
            parentCodes.push(currentRole.parentCode);
            currentRole = roleMap.get(currentRole.parentCode);
        }
        
        return parentCodes;
    }
    
    /**
     * 获取角色的所有子角色代码（包括间接子角色）
     */
    static getChildRoleCodes(roleCode: string, allRoles: Role[]): string[] {
        const childCodes: string[] = [];
        
        function findChildren(code: string) {
            const children = allRoles.filter(r => r.parentCode === code);
            for (const child of children) {
                childCodes.push(child.code);
                findChildren(child.code);
            }
        }
        
        findChildren(roleCode);
        return childCodes;
    }
    
    /**
     * 检查用户是否有足够的权限级别
     */
    static hasPermissionLevel(userRoles: Role[], requiredLevel: number): boolean {
        if (!userRoles.length) return false;
        
        // 获取用户的最高权限级别（数值最小）
        const userLevel = Math.min(...userRoles.map(r => r.level));
        return userLevel <= requiredLevel;
    }
    
    /**
     * 构建角色层次结构树
     */
    static buildRoleTree(roles: Role[]): Role[] {
        const roleMap = new Map<string, Role & { children: Role[] }>();
        
        // 创建带有 children 属性的角色副本
        roles.forEach(role => {
            roleMap.set(role.code, { ...role, children: [] });
        });
        
        const rootRoles: Role[] = [];
        
        for (const role of roleMap.values()) {
            if (role.parentCode && roleMap.has(role.parentCode)) {
                const parent = roleMap.get(role.parentCode)!;
                parent.children.push(role);
            } else {
                rootRoles.push(role);
            }
        }
        
        return rootRoles;
    }
    
    /**
     * 获取角色的显示路径（例如：超级管理员 > 系统管理员 > 普通管理员）
     */
    static getRoleDisplayPath(roleCode: string, allRoles: Role[]): string {
        const roleMap = new Map(allRoles.map(r => [r.code, r]));
        const path: string[] = [];
        
        let currentRole = roleMap.get(roleCode);
        while (currentRole) {
            path.unshift(currentRole.displayName);
            currentRole = currentRole.parentCode ? roleMap.get(currentRole.parentCode) : undefined;
        }
        
        return path.join(' > ');
    }
    
    /**
     * 排序角色列表（按层级排序）
     */
    static sortRolesByLevel(roles: Role[]): Role[] {
        return [...roles].sort((a, b) => a.level - b.level);
    }

    /**
     * 获取角色的颜色（用于UI显示）
     */
    static getRoleColor(level: number): string {
        if (level <= 0) return '#ef4444'; // 红色 - 超级管理员
        if (level <= 10) return '#f97316'; // 橙色 - 管理员
        if (level <= 20) return '#eab308'; // 黄色 - 经理
        if (level <= 30) return '#22c55e'; // 绿色 - 员工
        return '#6b7280'; // 灰色 - 普通用户
    }

    /**
     * 获取角色的图标（用于UI显示）
     */
    static getRoleIcon(level: number): string {
        if (level <= 0) return 'fas fa-crown';
        if (level <= 10) return 'fas fa-shield-alt';
        if (level <= 20) return 'fas fa-user-tie';
        if (level <= 30) return 'fas fa-user-cog';
        return 'fas fa-user';
    }
}

// 全局角色管理器实例
export const roleManager = RoleManager.getInstance();

// 导出便捷方法
export const getRoleByCode = (code: string) => roleManager.getRoleByCode(code);
export const getAllRoles = () => roleManager.getAllRoles();
export const getRoleHierarchy = () => roleManager.getRoleHierarchy();
export const getManageableRoles = () => roleManager.getManageableRoles();

// 向后兼容的函数
export async function getRoleDisplayName(roleCode: string): Promise<string> {
    const role = await roleManager.getRoleByCode(roleCode);
    return role ? role.displayName : roleCode;
}

// 同步版本 - 使用缓存数据
export function getRoleDisplayNameSync(roleCode: string): string {
    // 这个函数需要先调用过getAllRoles()后才能正常工作
    const cachedRoles = (roleManager as any).roles || [];
    const role = cachedRoles.find((r: Role) => r.code === roleCode);
    return role ? role.displayName : roleCode;
}

// 默认权限级别定义（用于向后兼容）
export const PERMISSION_LEVELS = {
    SUPER_ADMIN: 0,
    ADMIN: 10,
    MANAGER: 20,
    STAFF: 30,
    USER: 40
} as const;

// 初始化角色系统
export async function initializeRoleSystem(): Promise<boolean> {
    try {
        const success = await roleManager.refreshRoles(true);
        if (success) {
            await roleManager.refreshHierarchy();
        }
        return success;
    } catch (error) {
        console.error('Failed to initialize role system:', error);
        return false;
    }
}
