import React from 'react';

/**
 * Formats a date string into a relative time like "2h ago", "3d ago", etc.
 */
export const formatRelativeTime = (dateString: string) => {
    if (!dateString) return 'Just now';
    const postDate = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - postDate.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}w`;
    return postDate.toLocaleDateString();
};

/**
 * Builds a hierarchical comment tree from a flat list of comments.
 */
export const buildCommentTree = (comments: any[]) => {
    const map = new Map();
    const roots: any[] = [];

    comments.forEach(c => {
        map.set(c.id, { ...c, replies: [] });
    });

    comments.forEach(c => {
        const item = map.get(c.id);
        if (c.parent_id && map.has(c.parent_id)) {
            map.get(c.parent_id).replies.push(item);
        } else {
            roots.push(item);
        }
    });

    return roots;
};

/**
 * Renders text with clickable @mentions and #hashtags.
 */
export const renderTextWithMentions = (text: string) => {
    if (!text) return '';
    const parts = text.split(/(@\w+|#\w+)/g);
    return parts.map((part, i) => {
        if (part.startsWith('@')) {
            return (
                <a key={i} href={`/profile/${part.substring(1)}`} style={{ color: '#00a264', fontWeight: '700', textDecoration: 'none' }} onClick={(e) => e.stopPropagation()}>
                    {part}
                </a>
            );
        } else if (part.startsWith('#')) {
            return (
                <a key={i} href={`/community?search=${encodeURIComponent(part)}`} style={{ color: '#00a264', fontWeight: '700', textDecoration: 'none' }} onClick={(e) => e.stopPropagation()}>
                    {part}
                </a>
            );
        }
        return part;
    });
};

/**
 * Shared reaction icons configuration
 */
export const reactionIcons = [
    { id: 'like', label: 'Like', lottie: 'https://lottie.host/a587fb5d-43d0-4278-a4e3-b0a5728926ad/1hVyiPBHdi.lottie' },
    { id: 'helpful', label: 'Helpful', lottie: 'https://lottie.host/ad4c4a82-e116-4a41-9f11-3174689d1176/yPnnNuqAK1.lottie' },
    { id: 'smart', label: 'Smart', type: 'smart' },
    { id: 'uplifting', label: 'Uplifting', type: 'uplifting' },
    { id: 'funny', label: 'Funny', type: 'funny' }
];
