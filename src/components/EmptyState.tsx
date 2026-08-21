import type { LucideIcon } from 'lucide-react'
import PawPrint from './PawPrint'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
  className?: string
}

export default function EmptyState({ icon: Icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center text-center py-12 px-6 ${className}`}>
      <div className="relative w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
        {Icon ? <Icon size={24} className="text-primary" /> : <PawPrint size={24} className="text-primary" />}
        <PawPrint size={14} className="text-coral absolute -top-1.5 -right-1.5 rotate-12" />
      </div>
      <p className="text-sm font-semibold text-text">{title}</p>
      {description && <p className="text-xs text-muted mt-1.5 max-w-xs leading-relaxed">{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 text-sm text-primary font-medium hover:underline"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
