import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  sublabel: string
  accent?: boolean
}

export default function StatCard({ icon: Icon, label, value, sublabel, accent }: StatCardProps) {
  return (
    <div className={`card p-5 flex flex-col gap-3 ${accent ? 'border-primary/30' : ''}`}>
      <div className="flex items-center gap-2">
        <div className={`p-2 rounded-lg ${accent ? 'bg-primary/20' : 'bg-subtle'}`}>
          <Icon size={16} className={accent ? 'text-primary' : 'text-muted'} />
        </div>
        <span className="text-xs text-muted font-medium uppercase tracking-wider">{label}</span>
      </div>
      <div>
        <p className="text-3xl font-bold text-text">{value}</p>
        <p className="text-xs text-muted mt-1">{sublabel}</p>
      </div>
    </div>
  )
}
