"use client";

import React from 'react';

export const GlassdoorIcon = ({ type, size = 32 }: { type: string, size?: number }) => {
    const icons: Record<string, React.ReactNode> = {
        like: (
            <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="16" fill="#0CAA41" />
                <path d="M11 20.5V11.5H13.5V20.5H11ZM14.5 20.5V11.5H15.5L19.5 7.5L21 8.5V10.5L19 13.5H23.5L24.5 15V19L23 20.5H14.5Z" fill="white" />
            </svg>
        ),
        helpful: (
            <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="16" fill="#00AEEF" />
                <path d="M10 16L13 13L16 16L19 13L22 16M11 19C11 19 13 22 16 22C19 22 21 19 21 19" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
        ),
        smart: (
            <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="16" fill="#00A3FF" />
                <path d="M16 8L18.5 13.5H24L19.5 17L21 22.5L16 19.5L11 22.5L12.5 17L8 13.5H13.5L16 8Z" fill="white" stroke="black" strokeWidth="1.2" />
            </svg>
        ),
        uplifting: (
            <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="16" fill="#B159FF" />
                <path d="M16 8L17.5 11L20.5 10L19.5 13L23 14.5L20 16L21.5 19L18.5 18L17 21L15 18.5L12 19.5L13 16.5L10 16L12.5 14L11 11L14 12L16 8Z" fill="white" stroke="black" strokeWidth="1.2" />
            </svg>
        ),
        funny: (
            <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="16" fill="#FF4B91" />
                <circle cx="16" cy="16" r="7" fill="white" stroke="black" strokeWidth="1.2" />
                <path d="M13 15C13 15 13.5 14 14.5 14C15.5 14 16 15 16 15M17 15C17 15 17.5 14 18.5 14C19.5 14 20 15 20 15M14 18C14 18 15 20 16.5 20C18 20 19 18 19 18" stroke="black" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
        )
    };
    return icons[type] || icons.like;
};
