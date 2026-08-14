interface PillProps {
  children: React.ReactNode
  variant?: 'default' | 'active' | 'coral'
}

export default function Pill({ children, variant = 'default' }: PillProps) {
  const classes = {
    default: 'bg-subtle-md text-muted border border-medium',
    active: 'bg-white text-gray-900',
    coral: 'text-white',
  }

  if (variant === 'coral') {
    return (
      <span className="pill text-white" style={{ backgroundColor: '#FF7E5F' }}>
        {children}
      </span>
    )
  }

  return (
    <span className={`pill ${classes[variant]}`}>{children}</span>
  )
}
