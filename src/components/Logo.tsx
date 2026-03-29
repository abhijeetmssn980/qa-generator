import React from 'react';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ size = 'medium', showText = true }) => {
  const sizes = {
    small: { width: 40, height: 40, fontSize: 14 },
    medium: { width: 70, height: 70, fontSize: 24 },
    large: { width: 100, height: 100, fontSize: 32 }
  };

  const s = sizes[size];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <svg
        width={s.width}
        height={s.height}
        viewBox="0 0 120 120"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background circle for Q */}
        <circle cx="45" cy="60" r="32" fill="none" stroke="white" strokeWidth="3" opacity="0.9" />
        <circle cx="45" cy="60" r="28" fill="none" stroke="#fbbf24" strokeWidth="1.5" opacity="0.5" />

        {/* Q in white */}
        <text
          x="45"
          y="68"
          fontSize="32"
          fontWeight="bold"
          fill="white"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          Q
        </text>

        {/* Background circle for A */}
        <circle cx="80" cy="60" r="32" fill="none" stroke="#fbbf24" strokeWidth="3" opacity="0.9" />
        <circle cx="80" cy="60" r="28" fill="none" stroke="white" strokeWidth="1.5" opacity="0.5" />

        {/* A in orange */}
        <text
          x="80"
          y="68"
          fontSize="32"
          fontWeight="bold"
          fill="#fbbf24"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          A
        </text>

        {/* Decorative gear - top left */}
        <circle cx="25" cy="25" r="4" fill="white" opacity="0.8" />

        {/* Decorative sparkles */}
        <path 
          d="M 95 25 L 97 30 L 102 32 L 97 34 L 95 39 L 93 34 L 88 32 L 93 30 Z" 
          fill="#fbbf24" 
          opacity="0.8" 
        />
        <circle cx="25" cy="95" r="2.5" fill="white" opacity="0.7" />
        <circle cx="105" cy="95" r="2.5" fill="#fbbf24" opacity="0.7" />
      </svg>

      {showText && (
        <div style={{ textAlign: 'center', lineHeight: 1 }}>
          <div
            style={{
              fontWeight: 'bold',
              fontSize: `${s.fontSize}px`,
              letterSpacing: '0.5px',
              color: 'white',
              textShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
          >
            <span style={{ color: 'white' }}>QA</span>
            <span style={{ color: '#fbbf24' }}>Generator</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Logo;
