import PawPrint from './PawPrint'

interface PawSpinnerProps {
  size?: number
  label?: string
  className?: string
  pawColorClassName?: string
  labelColorClassName?: string
}

const DELAYS = ['0s', '0.15s', '0.3s']

export default function PawSpinner({
  size = 14,
  label,
  className = '',
  pawColorClassName = 'text-primary',
  labelColorClassName = 'text-muted',
}: PawSpinnerProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`} role="status" aria-live="polite">
      <span className="inline-flex items-end gap-0.5">
        {DELAYS.map((delay, i) => (
          <span key={i} className="animate-bounce-soft inline-flex" style={{ animationDelay: delay }}>
            <PawPrint size={size} className={pawColorClassName} style={{ transform: `rotate(${(i - 1) * 12}deg)` }} />
          </span>
        ))}
      </span>
      {label && <span className={`text-sm ${labelColorClassName}`}>{label}</span>}
    </span>
  )
}
