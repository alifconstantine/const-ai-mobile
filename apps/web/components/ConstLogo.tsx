'use client';

import React from 'react';

interface ConstLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  showText?: boolean;
  className?: string;
  textClassName?: string;
  iconClassName?: string;
  color?: string;
}

export function ConstLogoIcon({ 
  size = 'md', 
  className = '', 
  color = 'currentColor' 
}: { 
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number; 
  className?: string; 
  color?: string; 
}) {
  let sizeClass = 'w-7 h-7';
  if (size === 'xs') sizeClass = 'w-4.5 h-4.5';
  if (size === 'sm') sizeClass = 'w-5.5 h-5.5';
  if (size === 'md') sizeClass = 'w-7 h-7';
  if (size === 'lg') sizeClass = 'w-9 h-9';
  if (size === 'xl') sizeClass = 'w-11 h-11';
  if (typeof size === 'number') sizeClass = `w-[${size}px] h-[${size}px]`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      className={`${sizeClass} shrink-0 ${className}`}
      fill="none"
    >
      <defs>
        <clipPath id="const-razor-c6-p32-global">
          <path fillRule="evenodd" d="M432 72C250 36 40 136 40 256C40 376 250 476 432 440C320 384 180 320 180 256C180 192 320 128 432 72Z" />
        </clipPath>
      </defs>
      <g transform="translate(512 0) scale(-1 1) rotate(32 256 256)" clipPath="url(#const-razor-c6-p32-global)" fill={color === 'currentColor' ? 'currentColor' : color}>
        <rect x="-60" y="38" width="632" height="60" />
        <rect x="-60" y="113" width="632" height="60" />
        <rect x="-60" y="188" width="632" height="60" />
        <rect x="-60" y="264" width="632" height="60" />
        <rect x="-60" y="339" width="632" height="60" />
        <rect x="-60" y="414" width="632" height="60" />
      </g>
    </svg>
  );
}

export default function ConstLogo({
  size = 'md',
  showText = true,
  className = '',
  textClassName = '',
  iconClassName = '',
  color = 'currentColor',
}: ConstLogoProps) {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <ConstLogoIcon size={size} className={iconClassName} color={color} />
      {showText && (
        <span className={`font-serif font-normal tracking-tight text-white ${
          size === 'xs' ? 'text-base' : size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-2xl' : size === 'xl' ? 'text-3xl' : 'text-xl'
        } ${textClassName}`}>
          Const AI
        </span>
      )}
    </div>
  );
}
