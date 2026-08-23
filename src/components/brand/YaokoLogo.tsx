import { type FC } from 'react'

interface YaokoLogoProps {
  className?: string
  withTagline?: boolean
}

/**
 * Логотип ЯОКО — локальные акции.
 * Использует PNG-логотип из public/yaoko.png.
 */
export const YaokoLogo: FC<YaokoLogoProps> = ({ className = 'h-16', withTagline = false }) => {
  return (
    <div className={`flex flex-col items-start ${className}`}>
      <img
        src="/yaoko.png"
        alt="ЯОКО"
        className="h-full w-auto"
      />
      {withTagline && (
        <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.4em] text-loko-text-muted">
          Local Promotions Platform
        </span>
      )}
    </div>
  )
}
