import { useLang } from '../../contexts/LanguageContext';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'default';
  className?: string;
}

const variants = {
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-brand-100 text-brand-700',
  default: 'bg-gray-100 text-gray-600',
};

export default function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}

const STATUS_VARIANT: Record<string, BadgeProps['variant']> = {
  published: 'success',
  draft: 'warning',
  archived: 'default',
};

export function StatusBadge({ status }: { status: string }) {
  const { T } = useLang();
  const variant = STATUS_VARIANT[status] ?? 'warning';
  const label = (T.common[status as keyof typeof T.common] as string) ?? status;
  return <Badge variant={variant}>{label}</Badge>;
}
