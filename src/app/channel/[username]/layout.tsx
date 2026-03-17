"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { TrustpilotStars } from '@/components/common/TrustpilotStars';
import { VerifiedBadge } from '@/components/common/VerifiedBadge';
import { renderTextWithMentions, reactionIcons } from '@/utils/postHelpers';
import LeftSidebar from '@/components/layout/LeftSidebar';
import { useMemo } from 'react';

const ChannelContext = createContext<any>(null);
export const useChannel = () => useContext(ChannelContext);

export default function ChannelLayout({ children }: { children: React.ReactNode }) {
    const params = useParams();
    const router = useRouter();
    const pathname = usePathname();
    const slug = params.username as string;

    const [channel, setChannel] = useState<any>(null);
    const [posts, setPosts] = useState<any[]>([]); // Share posts count
    const [loading, setLoading] = useState(true);
    const [isFollowed, setIsFollowed] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
    const [savingChannel, setSavingChannel] = useState(false);
    const [trendingTopics, setTrendingTopics] = useState<any[]>([]);
    const [recommendedChannels, setRecommendedChannels] = useState<any[]>([]);
    const [activeIdentity, setActiveIdentity] = useState<any>(null);
    const [myChannels, setMyChannels] = useState<any[]>([]);
    const [showIdentityMenu, setShowIdentityMenu] = useState(false);
    const [toasts, setToasts] = useState<any[]>([]);
    const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
    const [submittingPost, setSubmittingPost] = useState(false);
    const [newPostTitle, setNewPostTitle] = useState('');
    const [newPostContent, setNewPostContent] = useState('');
    const [mojs, setMojs] = useState<any>(null);

    const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
    };

    const avatarInputRef = useRef<HTMLInputElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);

    const identities = useMemo(() => {
        const res: Record<string, any> = {
            candidate: {
                id: currentUserProfile?.id,
                type: 'profile',
                name: currentUserProfile?.full_name || 'Guest',
                username: currentUserProfile?.username || 'user',
                avatar: currentUserProfile?.avatar_url,
                isChannel: false,
                initials: currentUserProfile?.full_name?.split(' ').map((n: string) => (n[0] || '').toUpperCase()).join('') || "G",
                role: currentUserProfile?.work_info || "Career explorer",
                is_verified: currentUserProfile?.is_verified,
            }
        };
        myChannels.forEach(ch => {
            res[ch.id] = {
                id: ch.id,
                type: 'channel',
                name: ch.name,
                username: ch.username,
                role: "Channel",
                avatar: ch.avatar_url,
                isChannel: true,
                is_verified: ch.is_verified
            };
        });
        return res;
    }, [currentUserProfile, myChannels]);

    const activeIdKey = activeIdentity?.type === 'channel' ? activeIdentity.id : 'candidate';
    const currentId = identities[activeIdKey] || identities.candidate;

    useEffect(() => {
        const init = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return;
            const [profileRes, channelsRes] = await Promise.all([
                supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle(),
                supabase.from('channels').select('*').eq('owner_id', session.user.id)
            ]);
            if (profileRes.data) {
                setCurrentUserProfile(profileRes.data);
                setActiveIdentity({
                    type: 'profile', id: profileRes.data.id, name: profileRes.data.full_name || profileRes.data.username,
                    username: profileRes.data.username, avatar: profileRes.data.avatar_url, cover: profileRes.data.cover_url,
                    role: profileRes.data.work_info || 'Career Explorer',
                    followers: profileRes.data.followers_count, following: profileRes.data.following_count
                });
            }
            if (channelsRes.data) setMyChannels(channelsRes.data);

            const { data: latestPosts } = await supabase.from('posts').select('tags').order('created_at', { ascending: false }).limit(100);
            if (latestPosts) {
                const counts: Record<string, number> = {};
                latestPosts.forEach(p => p.tags?.forEach((tag: string) => { const n = tag.trim(); if (n) counts[n] = (counts[n] || 0) + 1; }));
                setTrendingTopics(Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([t]) => ({ tag: t.startsWith('#') ? t : `#${t}` })));
            }
            const { data: recChannels } = await supabase.from('channels').select('*').limit(5).order('followers_count', { ascending: false });
            if (recChannels) setRecommendedChannels(recChannels);
        };
        init();
        import('@mojs/core').then((m) => setMojs(m.default || m));
    }, []);

    useEffect(() => {
        const loadPageData = async () => {
            setLoading(true);
            const { data: channelData } = await supabase.from('channels').select('*, profiles:owner_id (*)').ilike('username', slug).maybeSingle();
            if (!channelData) { setLoading(false); return; }
            setChannel(channelData);
            const { data: postsData } = await supabase.from('posts').select('id').eq('channel_id', channelData.id);
            setPosts(postsData || []);
            if (currentUserProfile) {
                const { data: followData } = await supabase.from('follows').select('id').eq('follower_id', currentUserProfile.id).eq('following_channel_id', channelData.id).maybeSingle();
                setIsFollowed(!!followData);
            }
            setLoading(false);
        };
        loadPageData();
    }, [slug, currentUserProfile?.id]);

    const handleFollow = async () => {
        if (!currentUserProfile || !channel) return;
        if (isFollowed) {
            await supabase.from('follows').delete().eq('follower_id', currentUserProfile.id).eq('following_channel_id', channel.id);
            setIsFollowed(false);
            setChannel({ ...channel, followers_count: Math.max(0, channel.followers_count - 1) });
        } else {
            await supabase.from('follows').insert({ follower_id: currentUserProfile.id, following_channel_id: channel.id });
            setIsFollowed(true);
            setChannel({ ...channel, followers_count: (channel.followers_count || 0) + 1 });
        }
    };

    const handleSaveEdit = async () => {
        if (!channel) return;
        setSavingChannel(true);
        const { error } = await supabase.from('channels').update({ bio: channel.bio, website: channel.website, linkedin: channel.linkedin, twitter: channel.twitter, instagram: channel.instagram, facebook: channel.facebook, name: channel.name, username: channel.username, avatar_url: channel.avatar_url, cover_url: channel.cover_url, is_verified: channel.is_verified }).eq('id', channel.id);
        if (error) addToast('Failed to save', 'error');
        else { addToast('Saved'); setIsEditing(false); if (channel.username !== slug) router.push(`/channel/${channel.username}`); }
        setSavingChannel(false);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
        const file = e.target.files?.[0];
        if (!file || !channel) return;
        try {
            setSavingChannel(true);
            const formData = new FormData();
            formData.append('file', file);
            const res = await fetch('/api/upload', { method: 'POST', body: formData });
            if (!res.ok) throw new Error('Upload failed');
            const { url } = await res.json();
            setChannel({ ...channel, [type === 'avatar' ? 'avatar_url' : 'cover_url']: url });
            addToast('Image uploaded! Click Save Changes to finalize.', 'info');
        } catch (err: any) { addToast(err.message, 'error'); } finally { setSavingChannel(false); }
    };

    const handleCreatePost = async () => {
        if (!newPostContent.trim() || !channel) return;
        try {
            setSubmittingPost(true);
            const tags = [...newPostContent.matchAll(/#(\w+)/g)].map(m => m[1]);
            const { data, error } = await supabase.from('posts').insert([{ author_id: currentUserProfile.id, channel_id: channel.id, title: newPostTitle || "Channel Update", content: newPostContent, tags: tags.length > 0 ? tags : ["Channel"] }]).select(`*, profiles:author_id (*), channels:channel_id (*)`).maybeSingle();
            if (error) throw error;
            setPosts([data, ...posts]);
            setIsCreatePostModalOpen(false);
            setNewPostTitle(''); setNewPostContent('');
            addToast("Post published!", "success");
        } catch (err: any) { addToast(err.message, "error"); } finally { setSubmittingPost(false); }
    };

    if (loading || !channel) return (
        <section className="comm-main-rail" style={{ opacity: 0.6 }}>
            <div className="pro-profile-card-v3" style={{ height: '400px', background: '#f8fafc', borderRadius: '24px', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>
                <div style={{ height: '200px', background: '#e2e8f0', borderRadius: '24px 24px 0 0' }}></div>
                <div style={{ padding: '24px', display: 'flex', gap: '20px' }}>
                    <div style={{ width: '128px', height: '128px', background: '#e2e8f0', borderRadius: '20px', marginTop: '-64px', border: '4px solid #fff' }}></div>
                    <div style={{ flex: 1 }}>
                        <div style={{ height: '32px', background: '#e2e8f0', borderRadius: '8px', width: '200px', marginBottom: '12px' }}></div>
                        <div style={{ height: '20px', background: '#e2e8f0', borderRadius: '8px', width: '300px' }}></div>
                    </div>
                </div>
            </div>
            <style jsx>{` @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } } `}</style>
        </section>
    );

    const isOwner = currentUserProfile?.id === channel.owner_id;
    const isReviewsPage = pathname.endsWith('/reviews');
    const isSingleReviewPage = pathname.includes('/reviews/') && pathname.split('/').length > 4;

    return (
        <ChannelContext.Provider value={{ channel, setChannel, posts, setPosts, currentUserProfile, activeIdentity, addToast, isOwner, handleFollow, trendingTopics, recommendedChannels, myChannels, setActiveIdentity, showIdentityMenu, setShowIdentityMenu, toasts, setToasts, setIsCreatePostModalOpen, mojs, handleFileUpload, handleSaveEdit }}>
            <section className="comm-main-rail">
                {!isSingleReviewPage && (
                    <>
                        <div className="pro-profile-card-v3">
                            <div className="pro-cover-wrap-v4" style={{ backgroundImage: channel.cover_url ? `url(${channel.cover_url})` : 'none', backgroundColor: '#f1f5f9' }}>
                                {isOwner && isEditing && (
                                    <>
                                        <input type="file" ref={coverInputRef} style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, 'cover')} />
                                        <button className="btn-change-cover-v4" onClick={() => coverInputRef.current?.click()}>Change Cover</button>
                                    </>
                                )}
                            </div>
                            <div className="pro-header-layout-v4">
                                <div className="pro-avatar-v4-wrap" style={{ borderRadius: '24px', background: 'transparent', border: 'none', boxShadow: 'none' }}>
                                    <div style={{ width: '128px', height: '128px', borderRadius: '20px', background: channel.avatar_url ? `url(${channel.avatar_url})` : '#1e293b', backgroundSize: 'cover', border: '2px solid #fff', position: 'relative' }}>
                                        {isOwner && isEditing && (
                                            <>
                                                <input type="file" ref={avatarInputRef} style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, 'avatar')} />
                                                <button className="btn-edit-avatar-v4" onClick={() => avatarInputRef.current?.click()}>Edit</button>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="pro-content-v4">
                                    <div className="pro-header-top-v4">
                                        <div className="pro-content-start-v4">
                                            <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                {channel.name}
                                                {channel.is_verified && <VerifiedBadge size={24} isGold={true} />}
                                            </h1>
                                        </div>
                                        <div className="pro-content-end-v4">
                                            {isOwner ? (
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    {isEditing ? (
                                                        <>
                                                            <button className="btn-p-save-v3" onClick={handleSaveEdit} disabled={savingChannel}>{savingChannel ? 'Saving...' : 'Save'}</button>
                                                            <button className="btn-p-edit-v3" onClick={() => setIsEditing(false)}>Cancel</button>
                                                        </>
                                                    ) : <button className="btn-p-edit-v3" onClick={() => setIsEditing(true)}>Edit Channel</button>}
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                    <button className={`btn-p-follow-v3 ${isFollowed ? 'active' : ''}`} onClick={handleFollow}>{isFollowed ? 'Following' : 'Follow'}</button>
                                                    <button className="btn-p-icon-v3" title="Message" aria-label="Message" onClick={() => {
                                                        const type = activeIdentity?.type === 'channel' ? 'channel' : 'profile';
                                                        router.push(`/${type}/messages?with=${channel.username}&type=channel`);
                                                    }}>
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="pro-body-v4">
                                        {isEditing ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '10px' }}>
                                                <div style={{ display: 'flex', gap: '12px' }}>
                                                    <div style={{ flex: 1 }}>
                                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Channel Name</label>
                                                        <input className="edit-input-v4" value={channel.name || ''} onChange={(e) => setChannel({ ...channel, name: e.target.value })} placeholder="Name" />
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Username (URL slug)</label>
                                                        <input className="edit-input-v4" value={channel.username || ''} onChange={(e) => setChannel({ ...channel, username: e.target.value })} placeholder="username" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Bio</label>
                                                    <textarea className="pro-bio-v4" style={{ height: '80px', padding: '12px' }} value={channel.bio || ''} onChange={(e) => setChannel({ ...channel, bio: e.target.value })} maxLength={250} placeholder="Channel bio..." />
                                                </div>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                                    <div className="edit-field-group">
                                                        <label>Website</label>
                                                        <input className="edit-input-v4" value={channel.website || ''} onChange={(e) => setChannel({ ...channel, website: e.target.value })} placeholder="example.com" />
                                                    </div>
                                                    <div className="edit-field-group">
                                                        <label>LinkedIn</label>
                                                        <input className="edit-input-v4" value={channel.linkedin || ''} onChange={(e) => setChannel({ ...channel, linkedin: e.target.value })} placeholder="linkedin.com/in/..." />
                                                    </div>
                                                    <div className="edit-field-group">
                                                        <label>Twitter</label>
                                                        <input className="edit-input-v4" value={channel.twitter || ''} onChange={(e) => setChannel({ ...channel, twitter: e.target.value })} placeholder="twitter.com/..." />
                                                    </div>
                                                    <div className="edit-field-group">
                                                        <label>Instagram</label>
                                                        <input className="edit-input-v4" value={channel.instagram || ''} onChange={(e) => setChannel({ ...channel, instagram: e.target.value })} placeholder="instagram.com/..." />
                                                    </div>
                                                    <div className="edit-field-group">
                                                        <label>Facebook</label>
                                                        <input className="edit-input-v4" value={channel.facebook || ''} onChange={(e) => setChannel({ ...channel, facebook: e.target.value })} placeholder="facebook.com/..." />
                                                    </div>
                                                    <div className="edit-field-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => setChannel({ ...channel, is_verified: !channel.is_verified })}>
                                                        <input type="checkbox" checked={channel.is_verified || false} onChange={() => { }} style={{ cursor: 'pointer' }} />
                                                        <label style={{ margin: 0, cursor: 'pointer', fontSize: '13px', color: '#1e293b' }}>Verified Status</label>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : <p className="pro-bio-v4">{renderTextWithMentions(channel.bio || '')}</p>}
                                        {!isEditing && (
                                            <>
                                                <div className="pro-stats-row-v4">
                                                    <span><b>{(channel.followers_count || 0).toLocaleString()}</b> Followers</span>
                                                    <span><b>{(channel.following_count || 0).toLocaleString()}</b> Following</span>
                                                    <span><b>{posts.length}</b> Posts</span>
                                                    {channel.average_rating > 0 && (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
                                                            <TrustpilotStars rating={channel.average_rating} size={80} />
                                                            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>({channel.reviews_count || 0})</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="pro-tabs-v3">
                            <Link href={`/channel/${slug}`} className={`tab-f ${!isReviewsPage ? 'active' : ''}`} style={{ textDecoration: 'none' }}>Posts</Link>
                            <Link href={`/channel/${slug}/reviews`} className={`tab-f ${isReviewsPage ? 'active' : ''}`} style={{ textDecoration: 'none' }}>Reviews</Link>
                        </div>
                    </>
                )}
                <div className="pro-posts-list-v4">{children}</div>
            </section>

            <aside className="comm-right-rail">
                <div className="rail-card-v3"><h4>Trending Topics 🔥</h4> {trendingTopics.map((t, i) => <Link key={i} href={`/community?search=${t.tag}`} className="trending-item">{t.tag}</Link>)}</div>
                <div className="rail-card-v3">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <h4 style={{ margin: 0 }}>Bowls for you</h4>
                        <Link href="/community" style={{ fontSize: '12px', color: '#00a264', fontWeight: '700', textDecoration: 'none' }}>Explore all</Link>
                    </div>
                    {recommendedChannels.map((chan: any) => {
                        const formatCount = (num: number) => {
                            if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
                            if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
                            return num;
                        };
                        return (
                            <Link key={chan.id} href={`/channel/${chan.username}`} className="mini-bowl-item">
                                <div className="mini-bowl-logo" style={{
                                    backgroundImage: chan.avatar_url ? `url(${chan.avatar_url})` : 'none',
                                    backgroundColor: '#1e293b',
                                    backgroundSize: 'cover',
                                    borderRadius: '12px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '12px'
                                }}>
                                    {!chan.avatar_url && chan.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div className="mini-bowl-info">
                                    <h5 style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        {chan.name}
                                        {chan.is_verified && <VerifiedBadge size={12} isGold={true} />}
                                    </h5>
                                    <span className="mini-bowl-meta">{formatCount(chan.followers_count || 0)} members</span>
                                </div>
                                <button className="btn-follow-mini">Join</button>
                            </Link>
                        );
                    })}
                </div>
            </aside>

            {/* Modals handled globally but keeping local toast container for specific layout issues if any */}
            <div className="toast-container">{toasts.map(t => <div key={t.id} className={`custom-toast ${t.type}`}>{t.message}</div>)}</div>
            <style jsx global>{`
                .edit-input-v4 {
                    width: 100%;
                    padding: 10px 14px;
                    border: 1px solid #e2e8f0;
                    border-radius: 10px;
                    font-size: 14px;
                    background: #fff;
                    color: #1e293b;
                    outline: none;
                    transition: all 0.2s;
                    font-family: inherit;
                }
                .edit-input-v4:focus {
                    border-color: #00a264;
                    box-shadow: 0 0 0 3px rgba(0, 162, 100, 0.1);
                }
                .edit-field-group { margin-bottom: 2px; }
                .edit-field-group label {
                    display: block;
                    font-size: 12px;
                    font-weight: 700;
                    color: #64748b;
                    margin-bottom: 6px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .social-pill-v3 {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background: #f1f5f9;
                    color: #475569;
                    transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    border: none;
                    text-decoration: none;
                }
                .social-pill-v3:hover {
                    background: #e2e8f0;
                    color: #1e293b;
                    transform: translateY(-3px);
                    box-shadow: 0 5px 15px rgba(0,0,0,0.08);
                }
                .social-pill-v3 svg {
                    transition: transform 0.2s;
                }
                .social-pill-v3:hover svg {
                    transform: scale(1.1);
                }
                .reaction-particle-premium { position: fixed; pointer-events: none; z-index: 9999; animation: rx 1.2s forwards; } @keyframes rx { 0% { opacity:0; transform: scale(0); } 100% { opacity:0; transform: translate(var(--tx), var(--ty)) scale(0.5); } } 
            `}</style>
        </ChannelContext.Provider>
    );
}
