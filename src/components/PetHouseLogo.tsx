export default function PetHouseLogo({ dark = false }: { dark?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <path
            d="M16 4 L28 14 L28 28 L4 28 L4 14 Z"
            fill={dark ? '#5E8B7E' : 'rgba(94,139,126,0.15)'}
            stroke="#5E8B7E"
            strokeWidth="1.5"
          />
          <path
            d="M11 28 L11 20 Q11 17 16 17 Q21 17 21 20 L21 28"
            fill={dark ? '#3d6d62' : '#5E8B7E'}
          />
          <circle cx="11" cy="10" r="2.5" fill="#5E8B7E" />
          <circle cx="16" cy="8" r="2" fill="#5E8B7E" />
          <circle cx="21" cy="10" r="2.5" fill="#5E8B7E" />
        </svg>
      </div>
      <div>
        <p className={`text-sm font-bold leading-none tracking-wide ${dark ? 'text-gray-900' : 'text-text'}`}>
          Pet<span className="text-primary">House</span>
        </p>
      </div>
    </div>
  )
}
