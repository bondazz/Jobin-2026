"use client";

import React from 'react';

interface TrustpilotStarsProps {
    rating: number;
    size?: number;
    className?: string;
}

/**
 * Trustpilot Official Stars SVG Display
 * Uses the pre-defined SVG files for half-point ratings
 */
export const TrustpilotStars: React.FC<TrustpilotStarsProps> = ({
    rating,
    size = 120,
    className = ""
}) => {
    // Round to nearest 0.5 as Trustpilot does
    const rounded = Math.round(rating * 2) / 2;
    // Base URL for stars - user will upload to Cloudflare bucket
    // For now using local path from public/stars/
    const starsUrl = `/stars/stars-${rounded}.svg`;

    return (
        <div className={`trustpilot-stars-display ${className}`} style={{ width: size }}>
            <img
                src={starsUrl}
                alt={`TrustScore ${rating} out of 5`}
                style={{ width: '100%', height: 'auto', display: 'block' }}
            />
        </div>
    );
};
