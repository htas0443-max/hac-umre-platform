/**
 * Merkezi Yetki Yönetim Sistemi (RBAC)
 * 
 * Her rol için izin verilen işlemleri tanımlar.
 * Admin paneli sidebar ve route korumasında kullanılır.
 */
import type { UserRole } from '../types';

// Yetki tanımları
export type Permission =
    | 'dashboard'
    | 'approval'
    | 'tours.create'
    | 'tours.edit'
    | 'tours.delete'
    | 'tours.view'
    | 'reviews'
    | 'tickets'
    | 'import'
    | 'audit'
    | 'analytics'
    | 'files'
    | 'users'
    | 'verification'
    | 'notifications'
    | 'settings'
    | 'cms'
    | 'reports'
    | 'history'
    | 'feature_flags'
    | 'own_tours'
    | 'own_stats'
    | 'license_upload'
    | 'favorites'
    | 'user_reviews';

// Rol → Yetki haritası
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
    super_admin: [
        'dashboard', 'approval', 'tours.create', 'tours.edit', 'tours.delete', 'tours.view',
        'reviews', 'tickets', 'import', 'audit', 'analytics', 'files',
        'users', 'verification', 'notifications', 'settings', 'cms', 'reports',
        'history', 'feature_flags',
        'own_tours', 'own_stats', 'license_upload', 'favorites', 'user_reviews',
    ],
    admin: [
        'dashboard', 'approval', 'tours.create', 'tours.edit', 'tours.view',
        'reviews', 'tickets', 'import', 'audit', 'analytics', 'files',
        'users', 'verification', 'notifications', 'settings', 'cms', 'reports',
        'history', 'feature_flags',
    ],
    support: [
        'tickets', 'reviews',
    ],
    operator: [
        'own_tours', 'own_stats', 'license_upload', 'tours.create', 'tours.edit',
    ],
    user: [
        'tours.view', 'favorites', 'user_reviews',
    ],
};

/**
 * Belirli bir rolün belirli bir yetkiye sahip olup olmadığını kontrol eder.
 */
export function hasPermission(role: UserRole | undefined, permission: Permission): boolean {
    if (!role) return false;
    const permissions = ROLE_PERMISSIONS[role];
    if (!permissions) return false;
    return permissions.includes(permission);
}

/**
 * Belirli bir rolün admin/yönetici seviyesinde olup olmadığını kontrol eder.
 */
export function isAdminRole(role: UserRole | undefined): boolean {
    return role === 'super_admin' || role === 'admin';
}

/**
 * Belirli bir rolün panele erişip erişemeyeceğini kontrol eder.
 * Admin, super_admin ve support rollerinin admin paneline erişimi var.
 */
export function canAccessAdminPanel(role: UserRole | undefined): boolean {
    return role === 'super_admin' || role === 'admin' || role === 'support';
}

/**
 * Belirli bir rol için izin verilen yetkilerin listesini döndürür.
 */
export function getPermissions(role: UserRole | undefined): Permission[] {
    if (!role) return [];
    return ROLE_PERMISSIONS[role] || [];
}
