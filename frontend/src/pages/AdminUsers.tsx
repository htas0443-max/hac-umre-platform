import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Search, Shield, ShieldOff, Filter } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useSEO } from '../hooks/useSEO';
import Breadcrumb from '../components/Breadcrumb';

interface UserProfile {
    id: string;
    email: string;
    role: string;
    company_name: string | null;
    is_active: boolean;
    created_at: string;
}

const ROLE_LABELS: Record<string, string> = {
    user: 'Kullanıcı',
    operator: 'Operatör',
    admin: 'Admin',
    super_admin: 'Süper Admin',
    support: 'Destek',
};

const ROLE_COLORS: Record<string, string> = {
    user: '#3B82F6',
    operator: '#F59E0B',
    admin: '#8B5CF6',
    super_admin: '#EF4444',
    support: '#10B981',
};

export default function AdminUsers() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [togglingId, setTogglingId] = useState<string | null>(null);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(0);
    const PAGE_SIZE = 20;

    useSEO({ title: 'Kullanıcı Yönetimi - Admin', noIndex: true });

    const loadUsers = useCallback(async () => {
        try {
            setLoading(true);
            let query = supabase
                .from('profiles')
                .select('*', { count: 'exact' })
                .order('created_at', { ascending: false })
                .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

            if (roleFilter !== 'all') {
                query = query.eq('role', roleFilter);
            }
            if (searchQuery.trim()) {
                query = query.ilike('email', `%${searchQuery.trim()}%`);
            }

            const { data, count, error } = await query;

            if (error) throw error;
            setUsers(data || []);
            setTotalCount(count || 0);
        } catch (err) {
            console.error('Kullanıcılar yüklenemedi:', err);
        } finally {
            setLoading(false);
        }
    }, [page, roleFilter, searchQuery]);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    const toggleUserStatus = async (userId: string, currentActive: boolean) => {
        try {
            setTogglingId(userId);
            const { error } = await supabase
                .from('profiles')
                .update({ is_active: !currentActive })
                .eq('id', userId);

            if (error) throw error;

            setUsers(prev =>
                prev.map(u =>
                    u.id === userId ? { ...u, is_active: !currentActive } : u
                )
            );
        } catch (err) {
            console.error('Kullanıcı durumu güncellenemedi:', err);
        } finally {
            setTogglingId(null);
        }
    };

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ padding: '0' }}
        >
            <Breadcrumb />

            {/* Header */}
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                        <Users size={28} color="var(--primary-teal)" /> Kullanıcı Yönetimi
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        {totalCount} kayıtlı kullanıcı
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: '1 1 250px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <input
                        type="text"
                        placeholder="E-posta ile ara..."
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
                        style={{
                            width: '100%',
                            padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-primary)',
                            fontSize: '0.9rem',
                        }}
                    />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Filter size={16} color="var(--text-secondary)" />
                    <select
                        value={roleFilter}
                        onChange={(e) => { setRoleFilter(e.target.value); setPage(0); }}
                        style={{
                            padding: '0.75rem 1rem',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-primary)',
                            fontSize: '0.9rem',
                        }}
                    >
                        <option value="all">Tüm Roller</option>
                        <option value="user">Kullanıcı</option>
                        <option value="operator">Operatör</option>
                        <option value="admin">Admin</option>
                        <option value="support">Destek</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
                    Yükleniyor...
                </div>
            ) : users.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔍</div>
                    Sonuç bulunamadı
                </div>
            ) : (
                <div className="card" style={{ overflowX: 'auto', padding: '0' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>E-posta</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Rol</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Firma</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Durum</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Kayıt Tarihi</th>
                                <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>İşlem</th>
                            </tr>
                        </thead>
                        <tbody>
                            <AnimatePresence>
                                {users.map((user, idx) => (
                                    <motion.tr
                                        key={user.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.03 }}
                                        style={{
                                            borderBottom: '1px solid var(--border-color)',
                                            background: idx % 2 === 0 ? 'transparent' : 'var(--bg-secondary)',
                                        }}
                                    >
                                        <td style={{ padding: '0.875rem 1rem', fontWeight: 500 }}>
                                            {user.email}
                                        </td>
                                        <td style={{ padding: '0.875rem 1rem' }}>
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '0.25rem',
                                                padding: '0.25rem 0.625rem',
                                                borderRadius: '50px',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                background: `${ROLE_COLORS[user.role] || '#6B7280'}20`,
                                                color: ROLE_COLORS[user.role] || '#6B7280',
                                                border: `1px solid ${ROLE_COLORS[user.role] || '#6B7280'}40`,
                                            }}>
                                                {ROLE_LABELS[user.role] || user.role}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.875rem 1rem', color: 'var(--text-secondary)' }}>
                                            {user.company_name || '—'}
                                        </td>
                                        <td style={{ padding: '0.875rem 1rem' }}>
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '0.25rem',
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '50px',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                background: user.is_active !== false ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                                                color: user.is_active !== false ? '#10B981' : '#EF4444',
                                            }}>
                                                {user.is_active !== false ? '✓ Aktif' : '✕ Engelli'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.875rem 1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                            {new Date(user.created_at).toLocaleDateString('tr-TR')}
                                        </td>
                                        <td style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>
                                            {user.role !== 'super_admin' && (
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => toggleUserStatus(user.id, user.is_active !== false)}
                                                    disabled={togglingId === user.id}
                                                    style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '0.375rem',
                                                        padding: '0.5rem 0.875rem',
                                                        borderRadius: '8px',
                                                        border: 'none',
                                                        fontSize: '0.8rem',
                                                        fontWeight: 600,
                                                        cursor: togglingId === user.id ? 'wait' : 'pointer',
                                                        background: user.is_active !== false
                                                            ? 'rgba(239,68,68,0.15)'
                                                            : 'rgba(16,185,129,0.15)',
                                                        color: user.is_active !== false ? '#EF4444' : '#10B981',
                                                        opacity: togglingId === user.id ? 0.6 : 1,
                                                    }}
                                                >
                                                    {user.is_active !== false ? (
                                                        <><ShieldOff size={14} /> Engelle</>
                                                    ) : (
                                                        <><Shield size={14} /> Aktifleştir</>
                                                    )}
                                                </motion.button>
                                            )}
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
                    <button
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0}
                        className="btn btn-outline btn-small"
                    >
                        ← Önceki
                    </button>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Sayfa {page + 1} / {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={page >= totalPages - 1}
                        className="btn btn-outline btn-small"
                    >
                        Sonraki →
                    </button>
                </div>
            )}
        </motion.div>
    );
}
