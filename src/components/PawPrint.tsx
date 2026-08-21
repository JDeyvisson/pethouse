interface PawPrintProps {
  size?: number
  className?: string
  color?: string
  style?: React.CSSProperties
}

export default function PawPrint({ size = 16, className = '', color = 'currentColor', style }: PawPrintProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      className={className}
      style={style}
      aria-hidden="true"
    >
      <ellipse cx="12" cy="15.5" rx="6.2" ry="5.2" />
      <ellipse cx="4.8" cy="9.2" rx="2.6" ry="3.2" />
      <ellipse cx="10.4" cy="5.8" rx="2.4" ry="3" />
      <ellipse cx="15.6" cy="5.8" rx="2.4" ry="3" />
      <ellipse cx="19.2" cy="9.2" rx="2.6" ry="3.2" />
    </svg>
  )
}
