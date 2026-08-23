// Простые иконки для UI (svg-inline), чтобы не тянуть icon-пакеты

import type { FC, SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

const baseProps = (size = 18): SVGProps<SVGSVGElement> => ({
  width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
  stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round',
})

export const IconDashboard: FC<IconProps> = ({ size, ...p }) => (
  <svg {...baseProps(size)} {...p}><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>
)
export const IconBuilding: FC<IconProps> = ({ size, ...p }) => (
  <svg {...baseProps(size)} {...p}><path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01M15 17h.01"/></svg>
)
export const IconUsers: FC<IconProps> = ({ size, ...p }) => (
  <svg {...baseProps(size)} {...p}><circle cx="9" cy="8" r="3.2"/><path d="M2.5 20c.6-3.4 3.4-5.5 6.5-5.5s5.9 2.1 6.5 5.5"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.5c2.6.4 4.5 2.3 4.8 4.7"/></svg>
)
export const IconGift: FC<IconProps> = ({ size, ...p }) => (
  <svg {...baseProps(size)} {...p}><path d="M20 12v9H4v-9"/><path d="M2 7h20v5H2z"/><path d="M12 22V7"/><path d="M12 7H8a2.5 2.5 0 0 1 0-5c2 0 4 5 4 5z"/><path d="M12 7h4a2.5 2.5 0 0 0 0-5c-2 0-4 5-4 5z"/></svg>
)
export const IconTicket: FC<IconProps> = ({ size, ...p }) => (
  <svg {...baseProps(size)} {...p}><path d="M3 9V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4z"/><path d="M14 5v14" strokeDasharray="2 2"/></svg>
)
export const IconPin: FC<IconProps> = ({ size, ...p }) => (
  <svg {...baseProps(size)} {...p}><path d="M12 21s7-6 7-12a7 7 0 1 0-14 0c0 6 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/></svg>
)
export const IconTablet: FC<IconProps> = ({ size, ...p }) => (
  <svg {...baseProps(size)} {...p}><rect x="5" y="2" width="14" height="20" rx="2.5"/><path d="M11 18h2"/></svg>
)
export const IconMonitor: FC<IconProps> = ({ size, ...p }) => (
  <svg {...baseProps(size)} {...p}><rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
)
export const IconMap: FC<IconProps> = ({ size, ...p }) => (
  <svg {...baseProps(size)} {...p}><path d="M9 3 3 6v15l6-3 6 3 6-3V3l-6 3z"/><path d="M9 3v15M15 6v15"/></svg>
)
export const IconInbox: FC<IconProps> = ({ size, ...p }) => (
  <svg {...baseProps(size)} {...p}><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5h13l3.5 7v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6z"/></svg>
)
export const IconBell: FC<IconProps> = ({ size, ...p }) => (
  <svg {...baseProps(size)} {...p}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/></svg>
)
export const IconSettings: FC<IconProps> = ({ size, ...p }) => (
  <svg {...baseProps(size)} {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>
)
export const IconSearch: FC<IconProps> = ({ size, ...p }) => (
  <svg {...baseProps(size)} {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
)
export const IconChevronRight: FC<IconProps> = ({ size, ...p }) => (
  <svg {...baseProps(size)} {...p}><path d="m9 18 6-6-6-6"/></svg>
)
export const IconChevronDown: FC<IconProps> = ({ size, ...p }) => (
  <svg {...baseProps(size)} {...p}><path d="m6 9 6 6 6-6"/></svg>
)
export const IconPlus: FC<IconProps> = ({ size, ...p }) => (
  <svg {...baseProps(size)} {...p}><path d="M12 5v14M5 12h14"/></svg>
)
export const IconClose: FC<IconProps> = ({ size, ...p }) => (
  <svg {...baseProps(size)} {...p}><path d="M18 6 6 18M6 6l12 12"/></svg>
)
export const IconCheck: FC<IconProps> = ({ size, ...p }) => (
  <svg {...baseProps(size)} {...p}><path d="M20 6 9 17l-5-5"/></svg>
)
export const IconPhone: FC<IconProps> = ({ size, ...p }) => (
  <svg {...baseProps(size)} {...p}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
)
export const IconMail: FC<IconProps> = ({ size, ...p }) => (
  <svg {...baseProps(size)} {...p}><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>
)
export const IconArrowUp: FC<IconProps> = ({ size, ...p }) => (
  <svg {...baseProps(size)} {...p}><path d="M12 19V5M5 12l7-7 7 7"/></svg>
)
export const IconArrowDown: FC<IconProps> = ({ size, ...p }) => (
  <svg {...baseProps(size)} {...p}><path d="M12 5v14M19 12l-7 7-7-7"/></svg>
)
export const IconArrowRight: FC<IconProps> = ({ size, ...p }) => (
  <svg {...baseProps(size)} {...p}><path d="M5 12h14M12 5l7 7-7 7"/></svg>
)
export const IconDownload: FC<IconProps> = ({ size, ...p }) => (
  <svg {...baseProps(size)} {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg>
)
export const IconRefresh: FC<IconProps> = ({ size, ...p }) => (
  <svg {...baseProps(size)} {...p}><path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 4v5h-5"/></svg>
)
export const IconFilter: FC<IconProps> = ({ size, ...p }) => (
  <svg {...baseProps(size)} {...p}><path d="M22 3H2l8 9.5V19l4 2v-8.5z"/></svg>
)
export const IconLogout: FC<IconProps> = ({ size, ...p }) => (
  <svg {...baseProps(size)} {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></svg>
)
export const IconSpark: FC<IconProps> = ({ size, ...p }) => (
  <svg {...baseProps(size)} {...p}><path d="M12 3v6M12 15v6M3 12h6M15 12h6M5.6 5.6l4.2 4.2M14.2 14.2l4.2 4.2M5.6 18.4l4.2-4.2M14.2 9.8l4.2-4.2"/></svg>
)
export const IconLogo: FC<IconProps> = ({ size = 22, ...p }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...p}>
    <defs>
      <linearGradient id="lgi" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FF2D6A"/><stop offset="1" stopColor="#A855F7"/>
      </linearGradient>
    </defs>
    <rect width="24" height="24" rx="6" fill="url(#lgi)"/>
    <path d="M7 8v8h2v-3l2 3h2.4l-2.4-3.3L13.2 10H11l-2 2.6V8z" fill="#fff"/>
    <circle cx="17" cy="15.5" r="1.5" fill="#fff"/>
  </svg>
)
export const IconClock: FC<IconProps> = ({ size, ...p }) => (
  <svg {...baseProps(size)} {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
)
export const IconCalendar: FC<IconProps> = ({ size, ...p }) => (
  <svg {...baseProps(size)} {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
)
export const IconCamera: FC<IconProps> = ({ size, ...p }) => (
  <svg {...baseProps(size)} {...p}><path d="M23 19V8a2 2 0 0 0-2-2h-3l-2-3H8L6 6H3a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2z"/><circle cx="12" cy="13" r="4"/></svg>
)
export const IconShield: FC<IconProps> = ({ size, ...p }) => (
  <svg {...baseProps(size)} {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
)
export const IconTrend: FC<IconProps> = ({ size, ...p }) => (
  <svg {...baseProps(size)} {...p}><path d="M22 7 13.5 15.5l-5-5L1 18"/><path d="M16 7h6v6"/></svg>
)
export const IconTrash: FC<IconProps> = ({ size, ...p }) => (
  <svg {...baseProps(size)} {...p}><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
)
