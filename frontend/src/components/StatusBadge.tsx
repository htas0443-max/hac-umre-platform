import { memo } from 'react';

type StatusType = 'approved' | 'pending' | 'rejected' | 'draft' | 'active' | 'inactive' | 'open' | 'resolved';

interface StatusBadgeProps {
    status: StatusType;
    size?: 'small' | 'default';
}

const statusConfig: Record<StatusType, { label: string; className: string; icon: string }> = {
    approved: { label: 'Onaylı', className: 'status-approved', icon: '✅' },
    pending: { label: 'Bekliyor', className: 'status-pending', icon: '⏳' },
    rejected: { label: 'Reddedildi', className: 'status-rejected', icon: '❌' },
    draft: { label: 'Taslak', className: 'status-draft', icon: '📝' },
    active: { label: 'Aktif', className: 'status-approved', icon: '🟢' },
    inactive: { label: 'Pasif', className: 'status-draft', icon: '⚪' },
    open: { label: 'Açık', className: 'status-approved', icon: '🟢' },
    resolved: { label: 'Çözüldü', className: 'status-draft', icon: '✓' },
};

const StatusBadge = memo(function StatusBadge({ status, size = 'default' }: StatusBadgeProps) {
    const config = statusConfig[status] || statusConfig.draft;

    return (
        <span
            className={`status-badge ${config.className} ${size === 'small' ? 'status-badge-small' : ''}`}
            data-testid={`status-badge-${status}`}
        >
            <span className="status-badge-icon">{config.icon}</span>
            <span className="status-badge-text">{config.label}</span>
        </span>
    );
});

export default StatusBadge;
