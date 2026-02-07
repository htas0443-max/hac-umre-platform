import type { LucideIcon } from 'lucide-react';
import {
    Search,
    Building2,
    Building,
    Plane,
    User,
    Package,
    Star,
    Globe,
    CheckCircle,
    XCircle,
    Clock,
    MessageCircle,
    Send,
    Crown,
    Shield,
    Lock,
    Download,
    Edit,
    FileText,
    Zap,
    BarChart3,
    Target,
    Lightbulb,
    Rocket,
    PartyPopper,
    Filter,
    Calendar,
    MapPin,
    Phone,
    Mail,
    ChevronRight,
    ChevronDown,
    Plus,
    Minus,
    RefreshCw,
    Settings,
    LogOut,
    Eye,
    EyeOff,
    AlertCircle,
    Info,
    HelpCircle,
    Ticket,
    Home,
    List,
    Grid,
    Menu,
    X,
    ArrowLeft,
    ArrowRight,
    ExternalLink,
    Copy,
    Trash2,
    Upload,
    Check,
    Mic,
    MicOff,
} from 'lucide-react';

// İkon haritası
const iconMap = {
    search: Search,
    hotel: Building2,
    building: Building,
    plane: Plane,
    user: User,
    package: Package,
    star: Star,
    globe: Globe,
    check: CheckCircle,
    'check-simple': Check,
    x: XCircle,
    clock: Clock,
    message: MessageCircle,
    send: Send,
    crown: Crown,
    shield: Shield,
    lock: Lock,
    download: Download,
    edit: Edit,
    file: FileText,
    zap: Zap,
    chart: BarChart3,
    target: Target,
    lightbulb: Lightbulb,
    rocket: Rocket,
    party: PartyPopper,
    filter: Filter,
    calendar: Calendar,
    location: MapPin,
    phone: Phone,
    mail: Mail,
    'chevron-right': ChevronRight,
    'chevron-down': ChevronDown,
    plus: Plus,
    minus: Minus,
    refresh: RefreshCw,
    settings: Settings,
    logout: LogOut,
    eye: Eye,
    'eye-off': EyeOff,
    alert: AlertCircle,
    info: Info,
    help: HelpCircle,
    ticket: Ticket,
    home: Home,
    list: List,
    grid: Grid,
    menu: Menu,
    close: X,
    'arrow-left': ArrowLeft,
    'arrow-right': ArrowRight,
    'external-link': ExternalLink,
    copy: Copy,
    trash: Trash2,
    upload: Upload,
    mic: Mic,
    'mic-off': MicOff,
} as const;

export type IconName = keyof typeof iconMap;

interface IconProps {
    name: IconName;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
    color?: 'primary' | 'gold' | 'muted' | 'success' | 'error' | 'warning' | 'current';
    className?: string;
    strokeWidth?: number;
}

const sizes: Record<string, number> = {
    xs: 14,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 28,
    '2xl': 32,
};

const colors: Record<string, string> = {
    primary: 'var(--primary-teal)',
    gold: 'var(--accent-gold)',
    muted: 'var(--text-secondary)',
    success: '#059669',
    error: '#DC2626',
    warning: '#D97706',
    current: 'currentColor',
};

export default function Icon({
    name,
    size = 'md',
    color = 'current',
    className = '',
    strokeWidth = 2
}: IconProps) {
    const LucideIcon = iconMap[name] as LucideIcon;

    if (!LucideIcon) {
        console.warn(`Icon "${name}" not found`);
        return null;
    }

    return (
        <LucideIcon
            size={sizes[size]}
            color={colors[color]}
            strokeWidth={strokeWidth}
            className={`icon ${className}`}
            aria-hidden="true"
        />
    );
}

// Named export for icon map (useful for checking available icons)
export { iconMap };
