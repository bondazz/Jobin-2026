"use client";

import Link from 'next/link';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@/components/providers/UserProvider';
import { DotLottie } from '@lottiefiles/dotlottie-web';
import { supabase } from '@/lib/supabase';

import { GlassdoorIcon } from '@/components/common/GlassdoorIcon';
import { LottieIcon } from '@/components/common/LottieIcon';
import { PostCard } from '@/components/post/PostCard';
import {
    formatRelativeTime,
    buildCommentTree,
    renderTextWithMentions,
    reactionIcons
} from '@/utils/postHelpers';
import { VerifiedBadge } from '@/components/common/VerifiedBadge';
import LeftSidebar from '@/components/layout/LeftSidebar';


// --- SUPABASE DATA FETCHERS ---

// --- SUPABASE DATA FETCHERS ---

const fetchProfile = async (username: string) => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', username)
        .limit(1)
        .maybeSingle();

    if (error) {
        console.error('Database error fetching profile:', error.message || error);
        return null;
    }
    return data;
};







const fetchPosts = async (profileId: string) => {
    const { data, error } = await supabase
        .from('posts')
        .select('*, profiles:author_id (*)')
        .eq('author_id', profileId)
        .is('channel_id', null)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching posts:', error);
        return [];
    }
    return data;
};


export default function ProfilePage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.username as string;

    const {
        currentUserProfile,
        activeIdentity,
        identities,
        isCreatePostModalOpen,
        setIsCreatePostModalOpen,
        refreshUserData,
        switchIdentity
    } = useUser();

    // Map local setters to global ones for compatibility
    const setActiveIdentity = (...args: any[]) => switchIdentity(typeof args[0] === 'string' ? args[0] : args[0].id);
    const setCurrentUserProfile = (...args: any[]) => refreshUserData();
    const [pro, setPro] = useState<any>(null);
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFollowed, setIsFollowed] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [savingProfile, setSavingProfile] = useState(false);
    const [submittingPost, setSubmittingPost] = useState(false);
    const [toasts, setToasts] = useState<any[]>([]);
    const [confirmModal, setConfirmModal] = useState<any>({ isOpen: false, title: '', message: '', onConfirm: null, type: 'danger' });
    const [recommendedChannels, setRecommendedChannels] = useState<any[]>([]);
    const [trendingTopics, setTrendingTopics] = useState<any[]>([]);
    const [expandedComments, setExpandedComments] = useState<any[]>([]);
    const [fullyExpandedPosts, setFullyExpandedPosts] = useState<any[]>([]);
    const [activeReactionPostId, setActiveReactionPostId] = useState<any | null>(null);
    const [activeReactionCommentId, setActiveReactionCommentId] = useState<string | null>(null);
    const [replyToCommentId, setReplyToCommentId] = useState<string | null>(null);
    const [savedPosts, setSavedPosts] = useState<any[]>([]);
    const [hoveredItemId, setHoveredItemId] = useState<any | null>(null);
    const [mojs, setMojs] = useState<any>(null);
    const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const [commentsData, setCommentsData] = useState<Record<string, any[]>>({});
    const [newPostTitle, setNewPostTitle] = useState('');
    const [newPostContent, setNewPostContent] = useState('');
    const [editingPost, setEditingPost] = useState<any>(null);
    const [userReactions, setUserReactions] = useState<Record<string, string>>({});
    const [userCommentReactions, setUserCommentReactions] = useState<Record<string, string>>({});
    const [openMenuPostId, setOpenMenuPostId] = useState<string | number | null>(null);
    const [reportingPost, setReportingPost] = useState<any>(null);
    const [reportingComment, setReportingComment] = useState<any>(null);
    const [reportReason, setReportReason] = useState('');
    const [reportDetails, setReportDetails] = useState('');
    const [isReporting, setIsReporting] = useState(false);
    const [submittingReport, setSubmittingReport] = useState(false);
    const postMenuRef = useRef<HTMLDivElement>(null);

    const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
    };

    const showConfirm = (title: string, message: string, onConfirm: () => void, type: 'danger' | 'success' = 'danger') => {
        setConfirmModal({ isOpen: true, title, message, onConfirm, type });
    };

    const avatarInputRef = useRef<HTMLInputElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover' | 'post') => {
        const file = e.target.files?.[0];
        if (!file || !pro) return;

        // Size Limits
        const limitMB = type === 'avatar' ? 2 : 3;
        if (file.size > limitMB * 1024 * 1024) {
            addToast(`Fayl çox böyükdür. ${type === 'avatar' ? 'Profil' : 'Arxa fon'} şəkli üçün maksimum ${limitMB} MB icazə verilir.`, 'error');
            return;
        }

        try {
            setSavingProfile(true);

            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Upload failed');
            }

            const { url } = await response.json();

            if (type === 'post') return url;

            setPro({ ...pro, [type === 'avatar' ? 'avatar_url' : 'cover_url']: url });
            addToast('Image uploaded! Don\'t forget to click "Save Changes" to finalize.', 'info');
        } catch (error: any) {
            console.error('Upload error:', error);
            addToast('Upload error: ' + error.message, 'error');
        } finally {
            setSavingProfile(false);
        }
    };

    const [myChannels, setMyChannels] = useState<any[]>([]);
    const [showIdentityMenu, setShowIdentityMenu] = useState(false);
    const [activeMainTab, setActiveMainTab] = useState('Profile'); // Profile vs Management
    const [activeManagementTab, setActiveManagementTab] = useState('Posts');

    const isOwnProfile = currentUserProfile && slug === currentUserProfile.username;

    const formatCount = (n: number) => {
        if (!n) return '0';
        if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'm';
        if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
        return n.toString();
    };

    // Load all context in one shot for performance
    useEffect(() => {
        const init = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return;

            // Parallel fetch user profile, reactions, and saved posts
            const [profileRes, reactionsRes, savedRes, channelsRes] = await Promise.all([
                supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle(),
                supabase.from('post_reactions').select('post_id, reaction_type').eq('user_id', session.user.id),
                supabase.from('saved_posts').select('post_id').eq('user_id', session.user.id),
                supabase.from('channels').select('*').eq('owner_id', session.user.id)
            ]);

            if (profileRes.data) {
                setCurrentUserProfile(profileRes.data);
                const profileId = {
                    type: 'profile',
                    id: profileRes.data.id,
                    name: profileRes.data.full_name || profileRes.data.username,
                    username: profileRes.data.username,
                    avatar: profileRes.data.avatar_url,
                    cover: profileRes.data.cover_url,
                    role: profileRes.data.work_info || 'Career Explorer',
                    followers: profileRes.data.followers_count,
                    following: profileRes.data.following_count
                };
                setActiveIdentity(profileId);
            } else {
                // Fallback to metadata if DB profile not found
                const meta = session.user.user_metadata;
                setCurrentUserProfile({
                    id: session.user.id,
                    username: meta?.username || session.user.email?.split('@')[0],
                    full_name: meta?.full_name || 'Personal Account',
                    avatar_url: meta?.avatar_url || meta?.picture || null
                });
            }

            if (channelsRes.data) {
                setMyChannels(channelsRes.data);
            }

            if (reactionsRes.data) {
                const mapped = reactionsRes.data.reduce((acc: any, r: any) => ({ ...acc, [r.post_id]: r.reaction_type }), {});
                setUserReactions(mapped);
            }

            if (savedRes.data) {
                setSavedPosts(savedRes.data.map((s: any) => s.post_id));
            }

            // Fetch recommended channels
            const { data: recChannels } = await supabase
                .from('channels')
                .select('*')
                .limit(5)
                .order('followers_count', { ascending: false });
            if (recChannels) setRecommendedChannels(recChannels);

            // Fetch Global Trending Topics
            const { data: latestPosts } = await supabase
                .from('posts')
                .select('tags')
                .order('created_at', { ascending: false })
                .limit(100);

            if (latestPosts) {
                const counts: Record<string, number> = {};
                latestPosts.forEach(p => {
                    if (p.tags && Array.isArray(p.tags)) {
                        p.tags.forEach((tag: string) => {
                            const normalized = tag.trim().toLowerCase();
                            if (normalized) counts[normalized] = (counts[normalized] || 0) + 1;
                        });
                    }
                });
                const sorted = Object.entries(counts)
                    .filter(([_, count]) => count > 0)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([tag]) => ({ tag: tag.startsWith('#') ? tag : `#${tag}` }));
                setTrendingTopics(sorted);
            }
        };
        init();
        import('@mojs/core').then((module) => { setMojs(module.default || module); });
    }, []);

    useEffect(() => {
        const loadPageData = async () => {
            setLoading(true);
            const profileData = await fetchProfile(slug);
            if (!profileData) {
                setLoading(false);
                return;
            }

            // 1. Fetch posts and follow status (if current user loaded) in parallel
            const postsPromise = fetchPosts(profileData.id);
            const followPromise = currentUserProfile
                ? supabase.from('follows').select('id').eq('follower_id', currentUserProfile.id).eq('following_id', profileData.id).maybeSingle()
                : Promise.resolve({ data: null });

            const [postsData, followDataRes] = await Promise.all([postsPromise, followPromise]);

            setPro({ ...profileData, real_posts_count: postsData.length });
            setPosts(postsData);
            setIsFollowed(!!followDataRes.data);

            // 2. Fetch comments for ONLY these posts if they exist
            if (postsData.length > 0) {
                const postIds = postsData.map((p: any) => p.id);
                const { data: fetchedComments, error: commentsError } = await supabase
                    .from('comments')
                    .select('*, profiles:author_id (*)')
                    .in('post_id', postIds)
                    .order('created_at', { ascending: true });

                if (commentsError) {
                    console.error("Error fetching comments in Profile:", commentsError);
                }

                if (fetchedComments) {
                    const mappedComments: Record<string, any[]> = {};
                    fetchedComments.forEach(c => {
                        if (!mappedComments[c.post_id]) mappedComments[c.post_id] = [];
                        mappedComments[c.post_id].push(c);
                    });
                    setCommentsData(mappedComments);
                }
            }

            // Sync active identity: Prioritize persistence, then context
            const saved = localStorage.getItem('jobin_active_identity');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    if (parsed.type === 'profile' && currentUserProfile) {
                        setActiveIdentity({
                            type: 'profile',
                            id: currentUserProfile.id,
                            name: currentUserProfile.full_name || currentUserProfile.username,
                            username: currentUserProfile.username,
                            avatar: currentUserProfile.avatar_url,
                            cover: currentUserProfile.cover_url,
                            role: currentUserProfile.work_info || 'Career Explorer',
                            followers: currentUserProfile.followers_count,
                            following: currentUserProfile.following_count
                        });
                    } else if (parsed.type === 'channel') {
                        const targetChan = (myChannels || []).find((c: any) => c.id === parsed.id);
                        if (targetChan) {
                            setActiveIdentity({
                                type: 'channel',
                                id: targetChan.id,
                                name: targetChan.name,
                                username: targetChan.username,
                                avatar: targetChan.avatar_url,
                                cover: targetChan.cover_url,
                                role: 'Professional Channel',
                                followers: targetChan.followers_count,
                                following: targetChan.following_count
                            });
                        }
                    }
                } catch (e) { console.error("Persistence sync error", e); }
            } else if (profileData.id === currentUserProfile?.id) {
                // No saved identity, fallback to contextual sync
                setActiveIdentity({
                    type: 'profile',
                    id: profileData.id,
                    name: profileData.full_name || profileData.username,
                    username: profileData.username,
                    avatar: profileData.avatar_url,
                    cover: profileData.cover_url,
                    role: profileData.work_info || 'Career Explorer',
                    followers: profileData.followers_count,
                    following: profileData.following_count
                });
            }

            setLoading(false);
        };
        loadPageData();
        setIsEditing(false);
    }, [slug, currentUserProfile?.id]);

    const handleFollow = async () => {
        if (!currentUserProfile || !pro) return;
        if (isFollowed) {
            const { error } = await supabase.from('follows').delete().eq('follower_id', currentUserProfile.id).eq('following_id', pro.id);
            if (!error) {
                setIsFollowed(false);
                setPro({ ...pro, followers_count: (pro.followers_count || 1) - 1 });
            }
        } else {
            const { error } = await supabase.from('follows').insert([{ follower_id: currentUserProfile.id, following_id: pro.id }]);
            if (!error) {
                setIsFollowed(true);
                setPro({ ...pro, followers_count: (pro.followers_count || 0) + 1 });
            }
        }
    };

    const handleCreatePost = async () => {
        if (!newPostContent.trim()) return;
        if (!currentUserProfile) {
            addToast("İstifadəçi məlumatları hələ yüklənməyib. Zəhmət olmasa bir neçə saniyə gözləyin və ya yenidən daxil olun.", "error");
            return;
        }

        try {
            setSubmittingPost(true);
            const hashtagRegex = /#(\w+)/g;
            const tags = [...newPostContent.matchAll(hashtagRegex)].map(m => m[1]);

            const newPost = {
                author_id: currentUserProfile.id,
                title: newPostTitle || "Untitled Post",
                content: newPostContent,
                tags: tags.length > 0 ? tags : ["Profile"],
                likes_count: 0,
                comments_count: 0
            };

            const { data, error } = await supabase
                .from('posts')
                .insert([newPost])
                .select(`*, profiles:author_id (*)`)
                .maybeSingle();

            if (error) {
                console.error("Post creation error:", error);
                addToast("Xəta baş verdi: " + error.message, "error");
            } else if (!data) {
                addToast("Post yaradıldı, lakin geri oxuna bilmədi. RLS 'SELECT' siyasətlərinizi yoxlayın.", "error");
            } else {
                setPosts([data, ...posts]);
                setIsCreatePostModalOpen(false);
                setNewPostTitle('');
                setNewPostContent('');
                addToast("Post created successfully!", "success");
            }
        } catch (err: any) {
            console.error("Unexpected error:", err);
            addToast("Gözlənilməz xəta: " + err.message, "error");
        } finally {
            setSubmittingPost(false);
        }
    };

    const handleUpdatePost = async () => {
        if (!editingPost || !editingPost.content.trim()) return;

        const hashtagRegex = /#(\w+)/g;
        const tags = [...editingPost.content.matchAll(hashtagRegex)].map(m => m[1]);

        const { error } = await supabase
            .from('posts')
            .update({
                title: editingPost.title,
                content: editingPost.content,
                tags: tags.length > 0 ? tags : editingPost.tags
            })
            .eq('id', editingPost.id);

        if (error) {
            addToast("Error: " + error.message, "error");
        } else {
            setPosts(posts.map(p => p.id === editingPost.id ? { ...p, title: editingPost.title, content: editingPost.content, tags: tags.length > 0 ? tags : p.tags } : p));
            setEditingPost(null);
            addToast("Post updated successfully!", "success");
        }
    };

    const handleSaveEdit = async () => {
        if (!pro) return;
        setSavingProfile(true);

        try {
            // Check if username changed and is unique
            if (pro.username !== slug) {
                const { data: existing } = await supabase.from('profiles').select('id').ilike('username', pro.username).limit(1).maybeSingle();
                if (existing && existing.id !== pro.id) {
                    addToast('This username is already taken. Please choose another one.', 'error');
                    setSavingProfile(false);
                    return;
                }
            }

            const updatePayload: any = {
                full_name: pro.full_name,
                username: pro.username,
                bio: pro.bio,
                work_info: pro.work_info,
                website: pro.website,
                avatar_url: pro.avatar_url,
                cover_url: pro.cover_url,
                is_verified: pro.is_verified || false,
                // New individual columns
                linkedin_url: pro.linkedin_url,
                instagram_url: pro.instagram_url,
                facebook_url: pro.facebook_url,
                twitter_url: pro.twitter_url
            };

            const { error } = await supabase
                .from('profiles')
                .update(updatePayload)
                .eq('id', pro.id);

            if (error) throw error;

            // Cleanup old images if they were changed
            const oldAvatar = currentUserProfile?.avatar_url;
            const oldCover = currentUserProfile?.cover_url;

            if (oldAvatar && pro.avatar_url !== oldAvatar) {
                fetch('/api/delete-file', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: oldAvatar })
                }).catch(err => console.error("Old avatar cleanup failed:", err));
            }

            if (oldCover && pro.cover_url !== oldCover) {
                fetch('/api/delete-file', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: oldCover })
                }).catch(err => console.error("Old cover cleanup failed:", err));
            }

            setIsEditing(false);
            if (pro.username !== slug) {
                router.push(`/profile/${pro.username}`);
            }
            addToast('Profile updated successfully!', 'success');
            refreshUserData();
        } catch (error: any) {
            console.error('Save error:', error);
            addToast('Error saving profile: ' + error.message, 'error');
        } finally {
            setSavingProfile(false);
        }
    };



    const currentId = activeIdentity || {
        id: 'candidate',
        type: 'profile',
        full_name: currentUserProfile?.full_name || 'Guest',
        name: currentUserProfile?.full_name || 'Guest',
        username: currentUserProfile?.username || 'user',
        avatar: currentUserProfile?.avatar_url,
        isChannel: false,
        initials: currentUserProfile?.full_name?.split(' ').map((n: string) => (n[0] || '').toUpperCase()).join('') || "G",
        role: currentUserProfile?.work_info || "Career explorer",
        is_verified: currentUserProfile?.is_verified,
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (postMenuRef.current && !postMenuRef.current.contains(event.target as Node)) {
                setOpenMenuPostId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleDeletePost = async (postId: string | number) => {
        showConfirm(
            "Delete Post",
            "Are you sure you want to delete this post? This action cannot be undone.",
            async () => {
                const postToDelete = posts.find(p => p.id === postId);
                const { error } = await supabase.from('posts').delete().eq('id', postId);
                if (!error) {
                    setPosts(posts.filter(p => p.id !== postId));
                    setOpenMenuPostId(null);
                    addToast("Post deleted successfully", "success");

                    // R2 Storage Cleanup
                    if (postToDelete) {
                        const urlsToDelete: string[] = [];
                        if (postToDelete.image_url) urlsToDelete.push(postToDelete.image_url);
                        if (postToDelete.images && Array.isArray(postToDelete.images)) {
                            postToDelete.images.forEach((u: string) => {
                                if (u && !urlsToDelete.includes(u)) urlsToDelete.push(u);
                            });
                        }

                        urlsToDelete.forEach(url => {
                            fetch('/api/delete-file', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ url })
                            }).catch(err => console.error("Post image cleanup failed:", err));
                        });
                    }
                } else {
                    addToast("Error: " + error.message, "error");
                }
            }
        );
    };

    const handleReportPost = (post: any) => {
        setReportingPost(post);
        setReportingComment(null);
        setReportReason('');
        setReportDetails('');
    };

    const handleReportComment = (comment: any) => {
        setReportingComment(comment);
        setReportingPost(null);
        setReportReason('');
        setReportDetails('');
    };

    const handleReportSubmit = async () => {
        if ((!reportingPost && !reportingComment) || !reportReason) return;
        setSubmittingReport(true);

        let error;
        if (reportingPost) {
            const res = await supabase.from('post_reports').insert([{
                post_id: reportingPost.id,
                reporter_id: currentUserProfile?.id,
                reason: reportReason,
                details: reportDetails
            }]);
            error = res.error;
        } else if (reportingComment) {
            const res = await supabase.from('comment_reports').insert([{
                comment_id: reportingComment.id,
                reporter_id: currentUserProfile?.id,
                reason: reportReason,
                details: reportDetails
            }]);
            error = res.error;
        }

        if (!error) {
            addToast("Report submitted successfully. Thank you!", "success");
            setReportingPost(null);
            setReportingComment(null);
            setReportReason('');
            setReportDetails('');
        } else {
            console.error(error);
            addToast("Error: " + error.message, "error");
        }
        setSubmittingReport(false);
    };


    useEffect(() => {
        import('@mojs/core').then((module) => { setMojs(module.default || module); });
    }, []);

    const triggerBurst = (x: number, y: number, type: string) => {
        if (!x || !y) return;

        const iconSVGs: Record<string, string> = {
            'Like': `< svg width = "32" height = "32" viewBox = "0 0 32 32" fill = "none" ><circle cx="16" cy="16" r="16" fill="#0CAA41"/><path d="M11 20.5V11.5H13.5V20.5H11ZM14.5 20.5V11.5H15.5L19.5 7.5L21 8.5V10.5L19 13.5H23.5L24.5 15V19L23 20.5H14.5Z" fill="white"/></svg > `,
            'Helpful': `< svg width = "32" height = "32" viewBox = "0 0 32 32" fill = "none" ><circle cx="16" cy="16" r="16" fill="#00AEEF"/><path d="M10 16L13 13L16 16L19 13L22 16M11 19C11 19 13 22 16 22C19 22 21 19 21 19" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg > `,
            'Smart': `< svg width = "32" height = "32" viewBox = "0 0 32 32" fill = "none" ><circle cx="16" cy="16" r="16" fill="#00A3FF"/><path d="M16 8L18.5 13.5H24L19.5 17L21 22.5L16 19.5L11 22.5L12.5 17L8 13.5H13.5L16 8Z" fill="white" stroke="black" strokeWidth="1.2"/></svg > `,
            'Uplifting': `< svg width = "32" height = "32" viewBox = "0 0 32 32" fill = "none" ><circle cx="16" cy="16" r="16" fill="#B159FF"/><path d="M16 8L17.5 11L20.5 10L19.5 13L23 14.5L20 16L21.5 19L18.5 18L17 21L15 18.5L12 19.5L13 16.5L10 16L12.5 14L11 11L14 12L16 8Z" fill="white" stroke="black" strokeWidth="1.2"/></svg > `,
            'Funny': `< svg width = "32" height = "32" viewBox = "0 0 32 32" fill = "none" ><circle cx="16" cy="16" r="16" fill="#FF4B91"/><circle cx="16" cy="16" r="7" fill="white" stroke="black" strokeWidth="1.2"/><path d="M13 15C13 15 13.5 14 14.5 14C15.5 14 16 15 16 15M17 15C17 15 17.5 14 18.5 14C19.5 14 20 15 20 15M14 18C14 18 15 20 16.5 20C18 20 19 18 19 18" stroke="black" strokeWidth="1.2" strokeLinecap="round"/></svg > `
        };

        const svgContent = iconSVGs[type] || iconSVGs['Like'];
        const count = 10;

        if (mojs) {
            new mojs.Shape({
                parent: document.body,
                shape: 'circle',
                fill: 'none',
                stroke: (type === 'Like' ? '#0CAA41' : (type === 'Helpful' ? '#00AEEF' : '#00A3FF')),
                radius: { 0: 60 },
                strokeWidth: { 10: 0 },
                opacity: { 1: 0 },
                duration: 600,
                easing: 'expo.out',
                left: x,
                top: y
            }).play();
        }

        for (let i = 0; i < count; i++) {
            const el = document.createElement('div');
            el.className = 'reaction-particle-premium';
            el.innerHTML = svgContent;

            const angle = (i / count) * Math.PI * 2 + (Math.random() * 0.4 - 0.2);
            const dist = 100 + Math.random() * 80;
            const tx = Math.cos(angle) * dist;
            const ty = Math.sin(angle) * dist;
            const rot = Math.random() * 180 - 90;
            const size = i % 2 === 0 ? 18 : 32;

            el.style.left = `${x} px`;
            el.style.top = `${y} px`;
            el.style.width = `${size} px`;
            el.style.height = `${size} px`;
            el.style.setProperty('--tx', `${tx} px`);
            el.style.setProperty('--ty', `${ty} px`);
            el.style.setProperty('--rot', `${rot} deg`);

            const svg = el.querySelector('svg');
            if (svg) {
                svg.setAttribute('width', size.toString());
                svg.setAttribute('height', size.toString());
            }

            document.body.appendChild(el);
            setTimeout(() => el.remove(), 1250);
        }
    };

    const handleReaction = async (postId: any, label: string, e: any) => {
        if (!currentUserProfile) return;
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);

        triggerBurst(clientX, clientY, label);

        const currentReaction = userReactions[postId];
        if (currentReaction === label) {
            await supabase.from('post_reactions').delete().eq('post_id', postId).eq('user_id', currentUserProfile.id);
            await supabase.rpc('decrement_likes_count', { post_id: postId });
            setUserReactions(prev => { const n = { ...prev }; delete n[postId]; return n; });
            setPosts(posts.map(p => p.id === postId ? { ...p, likes_count: Math.max(0, (p.likes_count || 1) - 1) } : p));
        } else {
            await supabase.from('post_reactions').upsert({ post_id: postId, user_id: currentUserProfile.id, reaction_type: label }, { onConflict: 'post_id,user_id' });
            if (!currentReaction) {
                await supabase.rpc('increment_likes_count', { post_id: postId });
            }
            setUserReactions(prev => ({ ...prev, [postId]: label }));
            if (!currentReaction) {
                setPosts(posts.map(p => p.id === postId ? { ...p, likes_count: (p.likes_count || 0) + 1 } : p));
            }
        }
        setActiveReactionPostId(null);
    };

    const handleAddComment = async (postId: any, text: string, parentId: string | null = null) => {
        if (!text.trim() || !currentUserProfile) return;
        const { data, error } = await supabase
            .from('comments')
            .insert([{
                post_id: postId,
                author_id: currentUserProfile.id,
                content: text,
                parent_id: parentId
            }])
            .select('*, profiles:author_id (*)')
            .single();

        if (error) {
            console.error("Error adding comment:", error);
            addToast("Error: " + error.message, "error");
        } else {
            setCommentsData(prev => ({ ...prev, [postId]: [...(prev[postId] || []), data] }));

            // Increment post's total comment count (for both comments and replies)
            await supabase.rpc('increment_comment_count', { post_id: postId });
            setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments_count: (p.comments_count || 0) + 1 } : p));
        }
    };

    const handleAddReply = async (postId: any, parentId: string, text: string) => {
        await handleAddComment(postId, text, parentId);
        setReplyToCommentId(null);
    };

    const handleDeleteComment = async (postId: any, commentId: string) => {
        showConfirm(
            "Delete Comment",
            "Are you sure you want to delete this comment?",
            async () => {
                // Calculate how many items will be removed (the comment itself + its replies)
                const currentPostComments = commentsData[postId] || [];
                const itemsToRemove = currentPostComments.filter(c => c.id === commentId || c.parent_id === commentId);
                const removeCount = itemsToRemove.length;

                const { error } = await supabase.from('comments').delete().eq('id', commentId);
                if (!error) {
                    setCommentsData(prev => ({
                        ...prev,
                        [postId]: (prev[postId] || []).filter(c => c.id !== commentId && c.parent_id !== commentId)
                    }));

                    // Immediately update the post's count in the state
                    setPosts(prev => prev.map(p => p.id === postId ? {
                        ...p,
                        comments_count: Math.max(0, (p.comments_count || 0) - removeCount)
                    } : p));

                    // RPC for safety, though Trigger in SQL handles DB sync
                    await supabase.rpc('decrement_comment_count', { post_id: postId });
                    addToast("Comment deleted", "success");
                } else {
                    addToast("Error: " + error.message, "error");
                }
            }
        );
    };

    const handleCommentReaction = async (commentId: string, label: string, postId: any, e: any) => {
        if (!currentUserProfile) return;
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);

        triggerBurst(clientX, clientY, label);

        const currentReaction = userCommentReactions[commentId];

        if (currentReaction === label) {
            await supabase.from('comment_reactions').delete().eq('comment_id', commentId).eq('user_id', currentUserProfile.id);
            await supabase.rpc('decrement_comment_likes', { com_id: commentId });

            setUserCommentReactions(prev => {
                const n = { ...prev };
                delete n[commentId];
                return n;
            });

            setCommentsData(prev => ({
                ...prev,
                [postId]: (prev[postId] || []).map(c => c.id === commentId ? { ...c, likes_count: Math.max(0, (c.likes_count || 1) - 1) } : c)
            }));
        } else {
            await supabase.from('comment_reactions').upsert({
                comment_id: commentId,
                user_id: currentUserProfile.id,
                reaction_type: label
            }, { onConflict: 'comment_id,user_id' });

            if (!currentReaction) {
                await supabase.rpc('increment_comment_likes', { com_id: commentId });
            }

            setUserCommentReactions(prev => ({ ...prev, [commentId]: label }));

            setCommentsData(prev => ({
                ...prev,
                [postId]: (prev[postId] || []).map(c => {
                    if (c.id === commentId && !currentReaction) {
                        return { ...c, likes_count: (c.likes_count || 0) + 1 };
                    }
                    return c;
                })
            }));
        }
        setActiveReactionCommentId(null);
    };

    const toggleSavePost = async (postId: any) => {
        if (!currentUserProfile) return;
        const isCurrentlySaved = savedPosts.includes(postId);

        if (isCurrentlySaved) {
            const { error } = await supabase.from('saved_posts').delete().eq('post_id', postId).eq('user_id', currentUserProfile.id);
            if (!error) setSavedPosts(prev => prev.filter(id => id !== postId));
        } else {
            const { error } = await supabase.from('saved_posts').insert([{ post_id: postId, user_id: currentUserProfile.id }]);
            if (!error) setSavedPosts(prev => [...prev, postId]);
        }
    };
    const handleHeaderMouseEnter = (id: number | string) => { if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current); setHoveredItemId(id); };
    const handleHeaderMouseLeave = () => { hoverTimeoutRef.current = setTimeout(() => { setHoveredItemId(null); }, 300); };
    const toggleComments = (postId: any) => { setExpandedComments(prev => prev.includes(postId) ? prev.filter(id => id !== postId) : [...prev, postId]); };
    const toggleFullComments = (postId: any) => { setFullyExpandedPosts(prev => prev.includes(postId) ? prev.filter(id => id !== postId) : [...prev, postId]); };
    const handleShare = (postId: any) => { if (typeof window !== 'undefined') { const url = window.location.origin + `/ community / post / ${postId} `; navigator.clipboard.writeText(url); addToast("Post link copied!", "info"); } };



    const proPosts = pro ? [
        {
            id: 101, author: pro.full_name, role: pro.work_info, company: (pro.work_info || "").split(' • ')[1] || "Wharton", bowl: "Pro Channel", time: "2d",
            title: "The cost of toxic cultures",
            content: "Toxic cultures don't just hurt employees—they hurt performance. In my research, I've found that the biggest predictor of turnover is not pay or burnout, but the inability to thrive in a respectful environment.",
            likes: 1200, type: 'candidate', avatar: pro.avatar_url, karma: "2.5M", postsCount: 42, tags: ["Leadership", "Culture"]
        },
        {
            id: 102, author: pro.full_name, role: pro.work_info, company: "Wharton", bowl: "Pro Channel", time: "5d",
            title: "Why you should rethink your goals",
            content: "When we set goals, we often focus on the outcome. But the most successful people focus on the systems that lead to those outcomes.",
            likes: 850, type: 'candidate', avatar: pro.avatar_url, karma: "2.5M", postsCount: 42, tags: ["Productivity", "Growth"],
            poll: {
                question: "Do you focus more on goals or systems?",
                options: [{ label: "Goals", votes: 450 }, { label: "Systems", votes: 1200 }]
            }
        }
    ] : [];

    const recommendedBowls = [
        { id: 4, name: "Jobs in STEM", icon: "https://img.naukimg.com/logo_images/groups/v1/362038.gif", members: "5M" },
        { id: 5, name: "Finance", icon: "https://img.naukimg.com/logo_images/groups/v2/44512.gif", members: "2M" },
    ];
    const popularBowls = [
        { id: 1, name: "HR Jobs & Advice", icon: "https://img.naukimg.com/logo_images/groups/v1/4607713.gif" },
        { id: 2, name: "Salaries in HR", icon: "https://img.naukimg.com/logo_images/groups/v1/4630125.gif" },
        { id: 3, name: "Human Resources", icon: "https://img.naukimg.com/logo_images/groups/v1/485096.gif" },
    ];

    return (
        <>
            <section className="comm-main-rail">
                {loading ? (
                    <div className="profile-skeleton-v3">
                        <div className="skeleton-cover"></div>
                        <div className="skeleton-header">
                            <div className="skeleton-avatar"></div>
                            <div className="skeleton-info">
                                <div className="skeleton-line title"></div>
                                <div className="skeleton-line text"></div>
                            </div>
                        </div>
                        <div className="skeleton-body">
                            <div className="skeleton-line full"></div>
                            <div className="skeleton-line full"></div>
                            <div className="skeleton-line half"></div>
                        </div>
                    </div>
                ) : !pro ? (
                    <div className="pro-profile-card-v3" style={{ textAlign: 'center', padding: '120px 40px', background: '#fff' }}>
                        <div style={{ marginBottom: '24px' }}>
                            <svg width="68" height="68" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6M9 9l6 6" /></svg>
                        </div>
                        <h2 style={{ color: '#1e293b', marginBottom: '12px', fontSize: '24px', fontWeight: '800' }}>Profile Not Found</h2>
                        <p style={{ color: '#64748b', marginBottom: '32px', fontSize: '16px', lineHeight: '1.6' }}>The profile you are looking for might have been removed or never existed.</p>
                        <Link href="/community" className="btn-create-post-main" style={{ display: 'inline-flex', textDecoration: 'none', width: 'auto', padding: '12px 24px' }}>Go back to Community</Link>
                    </div>
                ) : (
                    <>
                        {/* PROFILE HEADER CARD */}
                        <div className="pro-profile-card-v3">

                            {/* COVER PHOTO AREA */}
                            <div className="pro-cover-wrap-v4" style={{
                                backgroundImage: loading || !pro ? 'none' : (pro.cover_url ? `url(${pro.cover_url})` : 'none'),
                                backgroundColor: pro?.cover_url ? 'transparent' : '#f1f5f9'
                            }}>
                                {isOwnProfile && isEditing && (
                                    <>
                                        <input type="file" ref={coverInputRef} style={{ display: 'none' }} accept="image/*" onChange={(e) => handleFileUpload(e, 'cover')} />
                                        <button className="btn-change-cover-v4" onClick={() => coverInputRef.current?.click()}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
                                            Change Cover
                                        </button>
                                    </>
                                )}
                            </div>

                            <div className="pro-header-layout-v4">
                                <div className="pro-avatar-v4-wrap">
                                    <img
                                        src={loading || !pro ? '' : (pro.avatar_url || (pro.full_name ? `https://ui-avatars.com/api/?name=${encodeURIComponent(pro.full_name)}&background=0CAA41&color=fff&size=128` : '/profile.png'))}
                                        alt={pro?.full_name || ''
                                        }
                                        style={{ opacity: loading ? 0 : 1 }
                                        }
                                    />
                                    {
                                        isOwnProfile && isEditing && (
                                            <>
                                                <input type="file" ref={avatarInputRef} style={{ display: 'none' }} accept="image/*" onChange={(e) => handleFileUpload(e, 'avatar')} />
                                                <button
                                                    className="btn-edit-avatar-v4"
                                                    title="Change profile photo"
                                                    onClick={() => avatarInputRef.current?.click()}
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
                                                </button>
                                            </>
                                        )
                                    }
                                </div >

                                <div className="pro-content-v4">
                                    {/* TOP ROW: NAME & ACTIONS */}
                                    <div className="pro-header-top-v4">
                                        <div className="pro-content-start-v4">
                                            {loading ? (
                                                <div className="skeleton-line" style={{ width: '200px', height: '32px' }}></div>
                                            ) : (
                                                <>
                                                    <div className="pro-name-row-v4">
                                                        {isEditing ? (
                                                            <div style={{ display: 'flex', gap: '12px', width: '100%', flexWrap: 'wrap' }}>
                                                                <div className="edit-field-half">
                                                                    <label className="ef-label">Full Name</label>
                                                                    <input className="ef-input" value={pro.full_name || ''} onChange={(e) => setPro({ ...pro, full_name: e.target.value })} placeholder="Your full name" />
                                                                </div>
                                                                <div className="edit-field-half">
                                                                    <label className="ef-label">Username (@slug)</label>
                                                                    <input className="ef-input" value={pro.username || ''} onChange={(e) => setPro({ ...pro, username: e.target.value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') })} placeholder="your_username" />
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                <h1>{pro.full_name || 'Unnamed User'}</h1>
                                                                {!loading && pro.is_verified && (
                                                                    <VerifiedBadge size={22} showTooltip={true} />
                                                                )}

                                                            </div>
                                                        )}
                                                    </div>

                                                    {isEditing && isOwnProfile && (
                                                        <button
                                                            className={`btn-verified-toggle ${pro.is_verified ? 'active' : 'inactive'}`}
                                                            title={pro.is_verified ? 'Click to remove verified badge' : 'Click to add verified badge (Premium)'}
                                                            onClick={() => setPro({ ...pro, is_verified: !pro.is_verified })}
                                                            style={{ padding: '4px 12px', borderRadius: '99px', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid', borderColor: pro.is_verified ? 'rgba(0,162,100,0.2)' : '#e2e8f0', background: pro.is_verified ? '#e5fff5' : '#f8fafc', cursor: 'pointer', marginTop: '4px', alignSelf: 'flex-start' }}
                                                        >
                                                            <VerifiedBadge size={14} />

                                                            <span style={{ fontSize: '13px', fontWeight: 700, color: pro.is_verified ? '#00603b' : '#64748b' }}>{pro.is_verified ? 'Verified' : 'Unverified'}</span>
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>

                                        <div className="pro-content-end-v4">
                                            {!loading && isOwnProfile ? (
                                                isEditing ? (
                                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                        <button className="btn-p-save-v3" onClick={handleSaveEdit} disabled={savingProfile}>
                                                            {savingProfile ? 'Saving...' : 'Save Changes'}
                                                        </button>
                                                        <button style={{ background: 'none', border: '1.5px solid #e2e8f0', padding: '8px 16px', borderRadius: '24px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', color: '#64748b' }} onClick={() => setIsEditing(false)}>Cancel</button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        className="btn-p-edit-v3"
                                                        onClick={() => setIsEditing(true)}
                                                        title="Edit Profile"
                                                        aria-label="Edit Profile"
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                                                        Edit Profile
                                                    </button>
                                                )
                                            ) : !loading && (
                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                    <button className={`btn-p-follow-v3 ${isFollowed ? 'active' : ''}`} onClick={handleFollow}>
                                                        {isFollowed ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg> Following</> : 'Follow'}
                                                    </button>
                                                    <button className="btn-p-icon-v3" title="Message" aria-label="Message" onClick={() => {
                                                        const type = activeIdentity?.type === 'channel' ? 'channel' : 'profile';
                                                        router.push(`/${type}/messages?with=${pro.username}&type=profile`);
                                                    }}>
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                                                    </button>
                                                </div>
                                            )}
                                            {!isEditing && !loading && (
                                                <button className="btn-p-share-v3">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* LOWER PART: BIO, STATS, SOCIAL, EDIT FIELDS */}
                                    <div className="pro-body-v4">
                                        {isEditing ? (
                                            <div className="edit-fields-container-v4">
                                                <div className="edit-row-v4">
                                                    <div className="edit-col-v4">
                                                        <label>Bio</label>
                                                        <textarea value={pro.bio || ''} onChange={(e) => setPro({ ...pro, bio: e.target.value })} placeholder="Write something about yourself..." maxLength={250} />
                                                    </div>
                                                </div>
                                                <div className="edit-row-v4">
                                                    <div className="edit-col-v4">
                                                        <label>Job Title / Role</label>
                                                        <input value={pro.work_info || ''} onChange={(e) => setPro({ ...pro, work_info: e.target.value })} placeholder="Software Engineer" />
                                                    </div>
                                                    <div className="edit-col-v4">
                                                        <label>Website</label>
                                                        <input value={pro.website || ''} onChange={(e) => setPro({ ...pro, website: e.target.value })} placeholder="https://..." />
                                                    </div>
                                                </div>
                                                <div className="edit-row-v4">
                                                    <div className="edit-col-v4">
                                                        <label>LinkedIn</label>
                                                        <input value={pro.linkedin_url || ''} onChange={(e) => setPro({ ...pro, linkedin_url: e.target.value })} placeholder="https://linkedin.com/in/..." />
                                                    </div>
                                                    <div className="edit-col-v4">
                                                        <label>Instagram</label>
                                                        <input value={pro.instagram_url || ''} onChange={(e) => setPro({ ...pro, instagram_url: e.target.value })} placeholder="https://instagram.com/..." />
                                                    </div>
                                                </div>
                                                <div className="edit-row-v4">
                                                    <div className="edit-col-v4">
                                                        <label>Facebook</label>
                                                        <input value={pro.facebook_url || ''} onChange={(e) => setPro({ ...pro, facebook_url: e.target.value })} placeholder="https://facebook.com/..." />
                                                    </div>
                                                    <div className="edit-col-v4">
                                                        <label>Twitter/X</label>
                                                        <input value={pro.twitter_url || ''} onChange={(e) => setPro({ ...pro, twitter_url: e.target.value })} placeholder="https://twitter.com/..." />
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                {pro.bio && <p className="pro-bio-v4">{renderTextWithMentions(pro.bio)}</p>}
                                                {pro.work_info && <p className="pro-job-v4">{pro.work_info}</p>}

                                                <div className="pro-stats-row-v4" style={{ marginTop: '0px' }}>
                                                    <span><b>{(pro.followers_count || 0).toLocaleString()}</b> Followers</span>
                                                    <span><b>{(pro.following_count || 0).toLocaleString()}</b> Following</span>
                                                    <span><b>{posts.length || pro.posts_count || 0}</b> Posts</span>
                                                </div>

                                                {(pro.website || pro.twitter_url || pro.linkedin_url || pro.instagram_url || pro.facebook_url) && (
                                                    <div className="pro-social-row-v4">
                                                        {pro.website && <a href={pro.website} target="_blank" rel="noopener noreferrer" className="pro-social-link-v4" title="Website"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg></a>}
                                                        {pro.twitter_url && <a href={pro.twitter_url} target="_blank" rel="noopener noreferrer" className="pro-social-link-v4" title="Twitter/X"><svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg></a>}
                                                        {pro.facebook_url && <a href={pro.facebook_url} target="_blank" rel="noopener noreferrer" className="pro-social-link-v4" title="Facebook"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V15.3h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 3.3h-2.33v6.579C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" /></svg></a>}
                                                        {pro.instagram_url && <a href={pro.instagram_url} target="_blank" rel="noopener noreferrer" className="pro-social-link-v4" title="Instagram"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg></a>}
                                                        {pro.linkedin_url && <a href={pro.linkedin_url} target="_blank" rel="noopener noreferrer" className="pro-social-link-v4" title="LinkedIn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z" /><circle cx="4" cy="4" r="2" /></svg></a>}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>

                            </div >
                        </div >

                        <div className="pro-tabs-v3">
                            {activeMainTab === 'Profile' ? (
                                <>
                                    <button className={`tab-f ${activeManagementTab === 'Posts' ? 'active' : ''}`} onClick={() => setActiveManagementTab('Posts')}>Posts</button>
                                    <button className={`tab-f ${activeManagementTab === 'CV' ? 'active' : ''}`} onClick={() => setActiveManagementTab('CV')}>CV & Resume</button>
                                    <button className={`tab-f ${activeManagementTab === 'Reviews' ? 'active' : ''}`} onClick={() => setActiveManagementTab('Reviews')}>Reviews</button>
                                </>
                            ) : (
                                <>
                                    <button className={`tab-f ${activeManagementTab === 'Overview' ? 'active' : ''}`} onClick={() => setActiveManagementTab('Overview')}>Personal Stats</button>
                                    <button className={`tab-f ${activeManagementTab === 'Recommended' ? 'active' : ''}`} onClick={() => setActiveManagementTab('Recommended')}>Recommended</button>
                                    <button className={`tab-f ${activeManagementTab === 'Settings' ? 'active' : ''}`} onClick={() => setActiveManagementTab('Settings')}>Settings</button>
                                </>
                            )}
                        </div>

                        {
                            activeMainTab === 'Profile' ? (
                                <>
                                    {activeManagementTab === 'Posts' && (
                                        <div className="pro-posts-list-v4">
                                            {loading ? (
                                                <div className="post-card-v4" style={{ textAlign: 'center', padding: '40px' }}>Loading posts...</div>
                                            ) : posts.length === 0 ? (
                                                <div className="post-card-v4" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>No posts yet.</div>
                                            ) : posts.map((post) => {
                                                const postComments = commentsData[post.id] || [];
                                                const isSaved = savedPosts.includes(post.id);
                                                const isMyPost = post.author_id === currentUserProfile?.id;

                                                return (
                                                    <PostCard
                                                        key={post.id}
                                                        post={post}
                                                        currentUserProfile={currentUserProfile}
                                                        comments={commentsData[post.id] || []}
                                                        userReaction={userReactions[post.id]}
                                                        userCommentReactions={userCommentReactions}
                                                        isExpanded={expandedComments.includes(post.id)}
                                                        isFullyExpanded={fullyExpandedPosts.includes(post.id)}
                                                        onReaction={handleReaction}
                                                        onCommentReaction={handleCommentReaction}
                                                        onAddComment={handleAddComment}
                                                        onAddReply={handleAddReply}
                                                        onDeleteComment={handleDeleteComment}
                                                        onDeletePost={handleDeletePost}
                                                        onEditPost={(p) => setEditingPost(p)}
                                                        onShare={handleShare}
                                                        onToggleComments={toggleComments}
                                                        onToggleFullComments={toggleFullComments}
                                                        onReportPost={handleReportPost}
                                                        onReportComment={handleReportComment}
                                                        disableHoverCard={true}
                                                    />
                                                );
                                            })}
                                        </div>
                                    )}

                                    {activeManagementTab === 'CV' && (
                                        <div className="cv-management-area-pro">
                                            <div className="cv-upload-card-pro">
                                                <div className="cv-icon-main">
                                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                                                </div>
                                                <h3>Resume & Documents</h3>
                                                <p>Manage your professional documents and CV files.</p>
                                                <div className="cv-actions-row">
                                                    <button className="btn-cv-upload">
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                                                        Upload New CV
                                                    </button>
                                                    <button className="btn-cv-generate">
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                                                        Build with AI
                                                    </button>
                                                </div>
                                                <div className="active-cv-file">
                                                    <div className="file-info">
                                                        <div className="file-type-tag">PDF</div>
                                                        <div className="file-details">
                                                            <span className="f-name">Samir_Miriyev_CV_2026.pdf</span>
                                                            <span className="f-meta">Updated 12 mins ago • 450 KB</span>
                                                        </div>
                                                    </div>
                                                    <div className="file-actions">
                                                        <button className="btn-file-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8" /><circle cx="12" cy="12" r="3" /></svg></button>
                                                        <button className="btn-file-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg></button>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="cv-details-grid-pro">
                                                <div className="cv-detail-card">
                                                    <h4>Skill Tags</h4>
                                                    <div className="cv-tags-cloud">
                                                        {["React", "TypeScript", "Next.js", "Node.js", "PostgreSQL", "UI Design"].map((tag: string) => (
                                                            <span key={tag} className="cv-tag-item">{tag}</span>
                                                        ))}
                                                        <button className="btn-add-tag">+</button>
                                                    </div>
                                                </div>
                                                <div className="cv-detail-card">
                                                    <h4>Portfolio Links</h4>
                                                    <div className="cv-links-list">
                                                        <div className="cv-link-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" /></svg> Github.com/samirmiriyev</div>
                                                        <div className="cv-link-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg> samirmiriyev.dev</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="management-content-hub">
                                    <div className="welcome-stats-row-pro">
                                        {[
                                            { label: 'Jobs Applied', value: '12', icon: 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z', color: '#00a264' },
                                            { label: 'Interviews', value: '3', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2', color: '#00AEEF' },
                                            { label: 'Profile Views', value: '48', icon: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8', color: '#FF4B91' },
                                        ].map((s, i) => (
                                            <div key={i} className="mini-stat-card-pro">
                                                <div className="s-icon-wrap" style={{ color: s.color }}>
                                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={s.icon} /></svg>
                                                </div>
                                                <div className="s-info">
                                                    <span className="s-val">{s.value}</span>
                                                    <span className="s-lab">{s.label}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="dashboard-section-pro mt-40">
                                        <div className="section-header-compact-left">
                                            <h2>Active Applications</h2>
                                            <Link href="#" className="link-more">View all →</Link>
                                        </div>
                                        <div className="application-stack-pro">
                                            {[
                                                { comp: 'Google', pos: 'Frontend Lead', status: 'Interview', date: '2 days ago', logo: 'https://img.naukimg.com/logo_images/groups/v2/44512.gif' },
                                                { comp: 'Meta', pos: 'Product Engineer', status: 'Applied', date: '1 week ago', logo: 'https://img.naukimg.com/logo_images/groups/v2/42932.gif' },
                                            ].map((app, i) => (
                                                <div key={i} className="app-item-glass-pro">
                                                    <div className="app-branding">
                                                        <div className="mini-logo"><img src={app.logo} alt="" /></div>
                                                        <div className="app-meta">
                                                            <h4>{app.pos}</h4>
                                                            <span>{app.comp}</span>
                                                        </div>
                                                    </div>
                                                    <div className="app-status">
                                                        <span className={`status-pill ${app.status.toLowerCase()}`}>{app.status}</span>
                                                        <span className="app-date">{app.date}</span>
                                                    </div>
                                                    <button className="btn-ghost-sm">Details</button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )
                        }
                    </>
                )
                }
            </section >

            {/* RIGHT RAIL: PERFECTLY SYNCED WITH COMMUNITY PAGE */}
            < aside className="comm-right-rail" >
                <div className="rail-card-v3">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <h4 style={{ margin: 0 }}>Trending Topics 🔥</h4>
                    </div>
                    <div className="trending-list">{trendingTopics.map((topic, i) => (
                        <Link key={i} href={`/community?search=${encodeURIComponent(topic.tag.replace('#', ''))}`} className="trending-item">
                            <span className="t-name">{topic.tag}</span>
                        </Link>
                    ))}</div>
                </div>

                <div className="rail-card-v3">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <h4 style={{ margin: 0 }}>Bowls for you</h4>
                        <Link href="/community" style={{ fontSize: '12px', color: '#00a264', fontWeight: '700', textDecoration: 'none' }}>Explore all</Link>
                    </div>
                    {recommendedChannels.length > 0 ? recommendedChannels.map(chan => (
                        <Link key={chan.id} href={`/channel/${chan.username}`} className="mini-bowl-item">
                            <div className="mini-bowl-logo" style={{
                                backgroundImage: chan.avatar_url ? `url(${chan.avatar_url})` : 'none',
                                backgroundColor: '#1e293b',
                                backgroundSize: 'cover',
                                borderRadius: '12px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '12px', width: '40px', height: '40px'
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
                    )) : (
                        <div className="skeleton-mini-bowls">
                            {[1, 2].map(i => (
                                <div key={i} style={{ display: 'flex', gap: '12px', marginBottom: '12px', alignItems: 'center' }}>
                                    <div style={{ width: '40px', height: '40px', background: '#f1f5f9', borderRadius: '12px' }} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ width: '80%', height: '10px', background: '#f1f5f9', marginBottom: '6px' }} />
                                        <div style={{ width: '40%', height: '8px', background: '#f1f5f9' }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="rail-card-v3 jobs-promo-card">
                    <div className="promo-content">
                        <div className="promo-image"><LottieIcon src="https://lottie.host/98263714-e014-4854-a4c0-3b83d95f57ac/e4adTK82z0.lottie" size={220} /></div>
                        <h3>Find your dream job in seconds</h3>
                        <p>Explore thousands of open roles across global tech hubs.</p>
                        <Link href="/jobs" className="btn-promo-cta">Explore Jobs <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg></Link>
                    </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                    <Link href="#" style={{ color: '#64748b', textDecoration: 'none' }}>Help</Link>
                    <Link href="#" style={{ color: '#64748b', textDecoration: 'none' }}>Terms</Link>
                    <Link href="#" style={{ color: '#64748b', textDecoration: 'none' }}>Privacy</Link>
                    <Link href="#" style={{ color: '#64748b', textDecoration: 'none' }}>Cookies</Link>
                </div>
                <p>© 2026 Jobin LLC.</p>
            </aside>

            {/* CREATE POST MODAL */}
            {isCreatePostModalOpen && (
                <div className="modal-overlay-v3" onClick={() => setIsCreatePostModalOpen(false)}>
                    <div className="modal-content-v3" onClick={e => e.stopPropagation()}>
                        <div className="modal-header-v3">
                            <h2>Create a post</h2>
                            <button className="btn-close-modal" onClick={() => setIsCreatePostModalOpen(false)}>×</button>
                        </div>
                        <div className="modal-body-v3">
                            <input
                                className="post-title-input"
                                placeholder="Title (optional)"
                                value={newPostTitle}
                                onChange={e => setNewPostTitle(e.target.value)}
                            />
                            <textarea
                                className="post-content-textarea"
                                placeholder="What's on your mind?"
                                value={newPostContent}
                                onChange={e => setNewPostContent(e.target.value)}
                            ></textarea>
                        </div>
                        <div className="modal-footer-v3">
                            <button className="btn-cancel-post" onClick={() => setIsCreatePostModalOpen(false)}>Cancel</button>
                            <button className="btn-submit-post" onClick={handleCreatePost} disabled={!newPostContent.trim() || submittingPost}>
                                {submittingPost ? 'Posting...' : 'Post'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* EDIT POST MODAL */}
            {editingPost && (
                <div className="modal-overlay-v3" onClick={() => setEditingPost(null)}>
                    <div className="modal-content-v3" onClick={e => e.stopPropagation()}>
                        <div className="modal-header-v3">
                            <h2>Edit post</h2>
                            <button className="btn-close-modal" onClick={() => setEditingPost(null)}>×</button>
                        </div>
                        <div className="modal-body-v3">
                            <input
                                className="post-title-input"
                                placeholder="Title (optional)"
                                value={editingPost.title}
                                onChange={e => setEditingPost({ ...editingPost, title: e.target.value })}
                            />
                            <textarea
                                className="post-content-textarea"
                                placeholder="Edit your post..."
                                value={editingPost.content}
                                onChange={e => setEditingPost({ ...editingPost, content: e.target.value })}
                            ></textarea>
                        </div>
                        <div className="modal-footer-v3">
                            <button className="btn-cancel-post" onClick={() => setEditingPost(null)}>Cancel</button>
                            <button className="btn-submit-post" onClick={handleUpdatePost}>Save Changes</button>
                        </div>
                    </div>
                </div>
            )}

            {/* REPORT MODAL */}
            {(reportingPost || reportingComment) && (
                <div className="report-modal-overlay" onClick={() => { setReportingPost(null); setReportingComment(null); }}>
                    <div className="report-modal" onClick={e => e.stopPropagation()}>
                        <div className="report-header">
                            <h2>Report {reportingPost ? 'Post' : 'Comment'}</h2>
                            <button className="btn-close-report" onClick={() => { setReportingPost(null); setReportingComment(null); }}>✕</button>
                        </div>
                        <div className="report-body">
                            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px' }}>If you believe this {reportingPost ? 'post' : 'comment'} violates our guidelines, please select a reason below:</p>
                            <div className="report-options">
                                {['Spam', 'Scam/Fraud', 'Sexual Content', 'Hate Speech/Violence', 'Misinformation'].map(r => (
                                    <label key={r} className="report-option">
                                        <input type="radio" name="report_reason" value={r} checked={reportReason === r} onChange={(e) => setReportReason(e.target.value)} />
                                        <span>{r}</span>
                                    </label>
                                ))}
                            </div>
                            <label className="report-label mt-16">Additional notes:</label>
                            <textarea className="report-textarea" value={reportDetails} onChange={(e) => setReportDetails(e.target.value)} placeholder="Provide more details..." />
                        </div>
                        <div className="report-footer">
                            <button className="btn-cancel-report" onClick={() => { setReportingPost(null); setReportingComment(null); }}>Cancel</button>
                            <button className="btn-submit-report" disabled={!reportReason || submittingReport} onClick={handleReportSubmit}>
                                {submittingReport ? 'Submitting...' : `Report ${reportingPost ? 'Post' : 'Comment'}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CUSTOM CONFIRM MODAL */}
            {confirmModal.isOpen && (
                <div className="modal-overlay-v5" onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}>
                    <div className="confirm-modal-v5" onClick={e => e.stopPropagation()}>
                        <div className={`modal-icon-v5 ${confirmModal.type === 'success' ? 'info' : ''}`}>
                            {confirmModal.type === 'success' ? (
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            ) : (
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                            )}
                        </div>
                        <h3>{confirmModal.title}</h3>
                        <p>{confirmModal.message}</p>
                        <div className="modal-actions-v5">
                            <button className="btn-modal-v5 cancel" onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}>Cancel</button>
                            <button className={`btn-modal-v5 ${confirmModal.type === 'success' ? 'confirm-success' : 'confirm'}`} onClick={() => { if (confirmModal.onConfirm) confirmModal.onConfirm(); setConfirmModal({ ...confirmModal, isOpen: false }); }}>
                                {confirmModal.type === 'success' ? 'Continue' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* TOAST NOTIFICATIONS */}
            <div className="toast-container">
                {toasts.map(toast => (
                    <div key={toast.id} className={`custom-toast ${toast.type}`}>
                        <div className="toast-icon-wrap">
                            {toast.type === 'success' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00a264" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                            {toast.type === 'error' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="3"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>}
                            {toast.type === 'info' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="3"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>}
                        </div>
                        <div className="toast-message">{toast.message}</div>
                        <div className="toast-close" onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}>×</div>
                    </div>
                ))}
            </div>
        </>
    );
}


