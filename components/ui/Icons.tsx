import React from 'react';
import { Beer, Link, Cigarette, Search, Zap, Crosshair, ShieldAlert, Heart, RefreshCcw } from 'lucide-react';

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
    RefreshCcw
};
