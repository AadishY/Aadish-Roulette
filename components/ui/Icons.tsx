import React from 'react';
import { Beer, Link, Cigarette, Search, Zap, Crosshair, ShieldAlert, Heart, RefreshCcw, Smartphone, Syringe } from 'lucide-react';

export const ChainsawIcon = ({ className, size = 24 }: { className?: string; size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Handle */}
    <path d="M4 7c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h2v-8H4z" />
    <path d="M6 9v4" />
    {/* Blade Spine */}
    <path d="M6 7l14-2v4" />
    {/* Teeth */}
    <path d="M6 15l2 2 2-2 2 2 2-2 2 2 2-2 2 2" />
    {/* Blade Tip Connection */}
    <path d="M20 9v8l-2-2" />
  </svg>
);

export const ChokeIcon = ({ className, size = 24 }: { className?: string; size?: number }) => (
  // Looks like a barrel extension / muzzle brake
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="8" y="2" width="8" height="20" rx="1" />
    <line x1="8" y1="6" x2="16" y2="6" />
    <line x1="8" y1="10" x2="16" y2="10" />
    <line x1="8" y1="14" x2="16" y2="14" />
    <line x1="8" y1="18" x2="16" y2="18" />
    <path d="M4 12h4" />
    <path d="M16 12h4" />
  </svg>
);

// Or better, create a custom stylized one
export const RemoteIcon = ({ className, size = 24 }: { className?: string; size?: number }) => (
  // Simple Remote Control Shape
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="7" y="2" width="10" height="20" rx="2" />
    <circle cx="12" cy="6" r="1.5" />
    <rect x="10" y="10" width="4" height="2" />
    <rect x="10" y="14" width="4" height="2" />
    <path d="M12 18v.01" />
  </svg>
);

export const BigInverterIcon = ({ className, size = 24 }: { className?: string; size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M12 2v20" />
    <path d="M8 10l-2 4h4l-2 4" /> {/* Lightning left */}
    <path d="M18 10l-2 4h4l-2 4" /> {/* Lightning right */}
  </svg>
);

export const Icons = {
  Beer,
  Cuffs: Link,
  Cigs: Cigarette,
  Glass: Search,
  Saw: ChainsawIcon,
  Zap,
  Crosshair,
  ShieldAlert,
  Heart,
  RefreshCcw,
  Phone: Smartphone,
  Inverter: Zap,
  Adrenaline: Syringe,
  Choke: ChokeIcon,
  Remote: RemoteIcon,
  BigInverter: BigInverterIcon
};
