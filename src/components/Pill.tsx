interface PillProps {
  children: React.ReactNode
  variant?: 'default' | 'active' | 'coral' | 'info' | 'honey'
}

export default function Pill({ children, variant = 'default' }: PillProps) {
  const classes = {
    default: 'bg-subtle-md text-muted border border-medium',
    active: 'bg-white text-gray-900',
    coral: 'bg-coral text-white',
    info: 'bg-info/15 text-info',
    honey: 'bg-honey/15 text-honey',
  }

  return (
    <span className={`pill ${classes[variant]}`}>{children}</span>
  )
}
