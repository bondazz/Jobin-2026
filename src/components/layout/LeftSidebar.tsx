"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { VerifiedBadge } from '@/components/common/VerifiedBadge';

interface LeftSidebarProps {
    currentUserProfile: any;
    activeIdentity: any;
    identities: Record<string, any>;
    onIdentityChange: (key: string) => void;
    onCreatePost: () => void;
    onCreateChannel?: () => void;
    unreadCount?: number;
}

export default function LeftSidebar({
    currentUserProfile,
    activeIdentity,
    identities,
    onIdentityChange,
    onCreatePost,
    onCreateChannel,
    unreadCount = 0
}: LeftSidebarProps) {
    const pathname = usePathname();
    const [showIdentityMenu, setShowIdentityMenu] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);

    // Close popover on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setShowIdentityMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const currentId = activeIdentity || {
        name: currentUserProfile?.full_name || 'Guest',
        username: currentUserProfile?.username || 'user',
        avatar: currentUserProfile?.avatar_url,
        type: 'profile',
        is_verified: currentUserProfile?.is_verified
    };

    const menuItems = [
        { name: 'Community', href: '/community', icon: <CommunityIcon /> },
        { name: 'Jobs', href: '/jobs', icon: <JobsIcon /> },
        { name: 'Companies', href: '/companies', icon: <CompaniesIcon /> },
        { name: 'Candidates', href: '/candidates', icon: <CandidatesIcon /> },
        { name: 'Messages', href: currentId.type === 'channel' ? '/channel/messages' : '/profile/messages', icon: <MessagesIcon /> },
        { name: 'Bookmarks', href: '/community?filter=saved', icon: <BookmarkIcon /> },
    ];

    const finalMenuItems = [...menuItems];
    finalMenuItems.push({ name: 'Profile', href: currentUserProfile ? `/profile/${currentUserProfile.username}` : '#', icon: <ProfileIcon /> });

    if (currentId.type === 'channel') {
        finalMenuItems.push({
            name: 'Reviews',
            href: `/channel/${currentId.username}/reviews`,
            icon: <ReviewsIcon />
        });
    }

    return (
        <aside className="new-left-sidebar desktop-only">
            <nav className="sidebar-nav-v5">
                {finalMenuItems.map((item, idx) => (
                    <Link key={idx} href={item.href} className={`nav-link-v5 ${pathname === item.href ? 'active' : ''}`}>
                        <div className="nav-icon-v5">{item.icon}</div>
                        <span className="nav-text-v5">{item.name}</span>
                        {item.name === 'Messages' && unreadCount > 0 && (
                            <span className="nav-badge-v5">{unreadCount}</span>
                        )}
                    </Link>
                ))}

                <button className="btn-post-v5" onClick={onCreatePost}>
                    Post
                </button>
            </nav>

            {currentUserProfile && (
                <div className="identity-switcher-v5" ref={popoverRef}>
                    <div className="active-id-v5" onClick={() => setShowIdentityMenu(!showIdentityMenu)}>
                        <div className="id-avatar-v5" style={{
                            backgroundImage: currentId.avatar ? `url(${currentId.avatar})` : 'none',
                            backgroundColor: currentId.avatar ? 'transparent' : (currentId.type === 'channel' ? '#1e293b' : '#00a264'),
                            borderRadius: currentId.type === 'channel' ? '10px' : '50%'
                        }}>
                            {!currentId.avatar && (currentId.name || '?').substring(0, 1).toUpperCase()}
                        </div>
                        <div className="id-details-v5">
                            <div className="id-name-v5">
                                {currentId.name}
                                {currentId.is_verified && <VerifiedBadge size={14} isGold={currentId.type === 'channel'} style={{ marginLeft: '4px', transform: 'translateY(1px)' }} />}
                            </div>
                            <div className="id-handle-v5">@{currentId.username || currentId.name?.toLowerCase().replace(/\s+/g, '_')}</div>
                        </div>
                        <div className="id-more-v5">•••</div>
                    </div>

                    {showIdentityMenu && (
                        <div className="id-popover-v5">
                            <div className="id-popover-header">Switch accounts</div>
                            {Object.entries(identities).map(([key, id]) => (
                                <div
                                    key={key}
                                    className={`id-popover-item ${activeIdentity?.id === id.id && activeIdentity?.type === (id.isChannel ? 'channel' : 'profile') ? 'active' : ''}`}
                                    onClick={() => { onIdentityChange(key); setShowIdentityMenu(false); }}
                                >
                                    <div className="id-avatar-v5" style={{
                                        width: '32px', height: '32px',
                                        backgroundImage: id.avatar ? `url(${id.avatar})` : 'none',
                                        backgroundColor: id.avatar ? 'transparent' : (id.isChannel ? '#1e293b' : '#00a264'),
                                        borderRadius: id.isChannel ? '6px' : '50%',
                                        fontSize: '12px'
                                    }}>
                                        {!id.avatar && (id.full_name || id.name || '?').substring(0, 1).toUpperCase()}
                                    </div>
                                    <div className="id-details-v5" style={{ marginLeft: '12px' }}>
                                        <div className="id-name-v5" style={{ fontSize: '14px', display: 'flex', alignItems: 'center' }}>
                                            {id.full_name || id.name}
                                            {id.is_verified && <VerifiedBadge size={12} isGold={id.isChannel} style={{ marginLeft: '4px' }} />}
                                        </div>
                                        <div className="id-handle-v5" style={{ fontSize: '12px' }}>@{id.username || (id.full_name || id.name)?.toLowerCase().replace(/\s+/g, '_')}</div>
                                    </div>
                                    {activeIdentity?.id === id.id && activeIdentity?.type === (id.isChannel ? 'channel' : 'profile') && (
                                        <div style={{ marginLeft: 'auto', color: '#00a264' }}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                                        </div>
                                    )}
                                </div>
                            ))}
                            <div className="id-popover-divider" />
                            <div className="id-popover-item create" onClick={() => { onCreateChannel?.(); setShowIdentityMenu(false); }}>
                                <div className="id-avatar-v5" style={{ width: '32px', height: '32px', background: '#f1f5f9', color: '#64748b', borderRadius: '6px', fontSize: '16px' }}>+</div>
                                <div className="id-details-v5" style={{ marginLeft: '12px' }}>
                                    <div className="id-name-v5" style={{ color: '#64748b', fontSize: '14px' }}>Create Channel</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </aside>
    );
}

// --- Icons (Matching the provided screenshot/site aesthetics) ---
function CommunityIcon() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
    );
}

function JobsIcon() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
    );
}

function CompaniesIcon() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
    );
}

function CandidatesIcon() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    );
}

function MessagesIcon() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
    );
}

function BookmarkIcon() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
    );
}

function ProfileIcon() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    );
}

function ReviewsIcon() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
    );
}
