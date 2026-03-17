"use client";

import React from 'react';

interface Props {
    filled: boolean;
    half?: boolean;
    size?: number;
    color?: string;
    className?: string;
    onClick?: () => void;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
}

/**
 * Premium Star Icon - Trustpilot Style (Square with Star cutout/overlay)
 */
export const StarIcon: React.FC<Props> = ({
    filled,
    half,
    size = 24,
    color = "#00a264",
    className = "",
    onClick,
    onMouseEnter,
    onMouseLeave
}) => {
    const bgColor = filled ? color : "#dbdbe0";

    return (
        <div
            className={`relative grid place-items-center transition-all duration-200 ${onClick ? 'cursor-pointer hover:scale-110 active:scale-95' : ''} ${className}`}
            style={{
                width: size,
                height: size,
                backgroundColor: half ? '#dbdbe0' : bgColor,
                borderRadius: '2px', // Trustpilot square style
                overflow: 'hidden',
                flexShrink: 0
            }}
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            {/* Half fill background overlay */}
            {half && (
                <div
                    className="absolute top-0 left-0 h-full z-0"
                    style={{ width: '50%', backgroundColor: color }}
                />
            )}

            {/* Star Icon - Centered via Grid and Path Transform */}
            <svg
                viewBox="0 0 24 24"
                fill="none"
                className="relative z-10"
                style={{
                    width: '68%',
                    height: '68%',
                    display: 'block'
                }}
            >
                <path
                    d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                    fill="#FFFFFF"
                    transform="translate(0, 0.5)"
                />
            </svg>
        </div>
    );
};
