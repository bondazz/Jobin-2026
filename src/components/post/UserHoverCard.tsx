"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { VerifiedBadge } from '../common/VerifiedBadge';


export const UserHoverCard = ({ user, visible, onMouseEnter, onMouseLeave }: { user: any, visible: boolean, onMouseEnter: () => void, onMouseLeave: () => void }) => {
    // Priority: use passed data if available, then fetch from DB
    const [stats, setStats] = useState({
        followers: user.followers_count || 0,
        following: user.following_count || 0,
        posts: user.posts_count || 0
    });
    const [fetched, setFetched] = useState(false);

    useEffect(() => {
        const userId = user.id || user.uid || user.author_id || user.user_id;
        if (visible && userId && !fetched) {
            const fetchStats = async () => {
                try {
                    const [followersRes, followingRes, postsRes] = await Promise.all([
                        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId),
                        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId),
                        supabase.from('posts').select('*', { count: 'exact', head: true }).eq('author_id', userId)
                    ]);

                    setStats({
                        followers: Math.max(followersRes.count || 0, user.followers_count || 0),
                        following: Math.max(followingRes.count || 0, user.following_count || 0),
                        posts: Math.max(postsRes.count || 0, user.posts_count || 0)
                    });
                    setFetched(true);
                } catch (err) {
                    console.error("Error fetching hover card stats:", err);
                    // On error, we keep the initial state from props
                    setFetched(true);
                }
            };
            fetchStats();
        }
    }, [visible, user.id, user.uid, user.author_id, user.user_id, fetched]);

    if (!visible) return null;
    const authorInitials = user.author ? user.author.split(' ').map((n: any) => n[0]).join('') : user.initials;
    const themeColor = user.type === 'company' ? '#1e293b' : (user.color || '#00a264');
    const avatarImg = user.avatar_url || user.avatar || null;
    const coverImg = user.cover_url || user.cover || null;

    return (
        <div className="user-hover-card" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
            <div className="hover-card-header" style={{
                backgroundImage: coverImg ? `url(${coverImg})` : 'none',
                backgroundColor: coverImg ? 'transparent' : themeColor,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: coverImg ? 1 : 0.1
            }}></div>
            <div className="hover-card-content">
                <div className="avatar-initials big" style={{
                    backgroundImage: avatarImg ? `url(${avatarImg})` : 'none',
                    backgroundColor: avatarImg ? 'transparent' : themeColor,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}>
                    {!avatarImg && authorInitials}
                </div>
                <div className="hover-user-info">
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {user.author || user.name || user.full_name}
                        {user.is_verified && (
                            <VerifiedBadge size={14} isGold={user.isChannel} />
                        )}

                    </h4>
                    <p className="hover-role">{user.role || user.work_info || (user.type === 'company' ? 'Company' : 'Career Explorer')}</p>
                </div>
                <div className="hover-stats">
                    <div className="h-stat"><span>{stats.followers}</span> Followers</div>
                    <div className="h-stat"><span>{stats.following}</span> Following</div>
                    <div className="h-stat"><span>{stats.posts}</span> Posts</div>
                </div>
                <Link
                    href={user.isChannel ? `/channel/${user.username}` : `/profile/${user.username || user.author_id ? user.username : (user.author || user.name || user.full_name || '').replace(/\s+/g, '_')}`}
                    className="btn-view-profile-hover"
                    style={{ textDecoration: 'none', textAlign: 'center', display: 'block' }}
                >
                    {user.isChannel ? 'View Channel' : 'View Profile'}
                </Link>
            </div>
        </div>
    );
};
