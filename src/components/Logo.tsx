import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  glow?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 40,
  glow = true,
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {glow && (
        <div
          className="absolute inset-0 rounded-full bg-amber-400/20 blur-md pointer-events-none animate-pulse"
          style={{ transform: 'scale(1.15)' }}
        />
      )}
      <img
        src="/logo.svg"
        alt="KhmerVoice AI Logo"
        width={size}
        height={size}
        className="relative z-10 w-full h-full object-contain drop-shadow-md select-none"
      />
    </div>
  );
};
