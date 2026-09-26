import React from 'react';

export interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'light' | 'dark'; // 'light' for dark sidebar, 'dark' for light cards
  showText?: boolean;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  variant = 'light',
  showText = true,
  className = '',
}) => {
  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* 3D Isometric Cube Box SVG */}
      <div className={`relative ${iconSizes[size]} shrink-0`}>
        <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
          {/* Top Face */}
          <polygon
            points="20,4 35,12 20,20 5,12"
            fill="#E5982A"
            stroke="#1E110A"
            strokeWidth="0.5"
          />
          {/* Left Face */}
          <polygon
            points="5,12 20,20 20,36 5,28"
            fill="#9A4C1C"
            stroke="#1E110A"
            strokeWidth="0.5"
          />
          {/* Right Face */}
          <polygon
            points="20,20 35,12 35,28 20,36"
            fill="#B86228"
            stroke="#1E110A"
            strokeWidth="0.5"
          />
          {/* Box Inner Seams / Tape accent */}
          <line x1="20" y1="4" x2="20" y2="20" stroke="#FDE68A" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="2 2" />
        </svg>
      </div>

      {showText && (
        <span
          className={`
            font-bold tracking-tight ${textSizes[size]}
            ${variant === 'light' ? 'text-white' : 'text-brand-textDark'}
          `}
        >
          Stock<span className="text-amber-500 font-extrabold">Sense</span>
        </span>
      )}
    </div>
  );
};
