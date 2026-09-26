import React from 'react';

export interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'light' | 'dark';
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
      {/* 3D Isometric Cube Box in Brown & Cream */}
      <div className={`relative ${iconSizes[size]} shrink-0`}>
        <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
          {/* Top Face */}
          <polygon
            points="20,4 35,12 20,20 5,12"
            fill="#E2DDD7"
            stroke="#26190F"
            strokeWidth="0.8"
          />
          {/* Left Face */}
          <polygon
            points="5,12 20,20 20,36 5,28"
            fill="#895A38"
            stroke="#26190F"
            strokeWidth="0.8"
          />
          {/* Right Face */}
          <polygon
            points="20,20 35,12 35,28 20,36"
            fill="#4E3C2F"
            stroke="#26190F"
            strokeWidth="0.8"
          />
          {/* Inner Seam */}
          <line x1="20" y1="4" x2="20" y2="20" stroke="#FAF5EE" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="2 2" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <span
            className={`
              font-serif font-bold tracking-tight leading-tight ${textSizes[size]}
              ${variant === 'light' ? 'text-white' : 'text-[#30241F]'}
            `}
          >
            Stock<span className="text-[#895A38] font-normal italic">Sense</span>
          </span>
          <span className="text-[9px] uppercase tracking-widest text-[#A3968C] -mt-0.5">
            Inventory System
          </span>
        </div>
      )}
    </div>
  );
};
