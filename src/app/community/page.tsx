"use client";

import Link from 'next/link';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUser } from '@/components/providers/UserProvider';
// Dynamically import mojs on the client side
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


// --- SUB COMPONENTS ---


// --- TYPES ---



export default function CommunityPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const searchTerm = searchParams.get('search');

    const {
        currentUserProfile,
        activeIdentity,
        identities,
        isCreatePostModalOpen,
        setIsCreatePostModalOpen,
        isCreateChannelModalOpen,
        setIsCreateChannelModalOpen
    } = useUser();

    // The rest of your existing states...
    const [showIdentityMenu, setShowIdentityMenu] = useState(false);
    const [expandedComments, setExpandedComments] = useState<any[]>([]);
    const [fullyExpandedPosts, setFullyExpandedPosts] = useState<any[]>([]);
    const [activeReactionPostId, setActiveReactionPostId] = useState<any | null>(null);
    const [replyToCommentId, setReplyToCommentId] = useState<string | null>(null);
    const [savedPosts, setSavedPosts] = useState<any[]>([]);
    const [hoveredItemId, setHoveredItemId] = useState<any | null>(null);
    const [isReporting, setIsReporting] = useState(false);
    const [reportingPost, setReportingPost] = useState<any>(null);
    const [reportingComment, setReportingComment] = useState<any>(null);
    const [reportReason, setReportReason] = useState('');
    const [reportDetails, setReportDetails] = useState('');
    const [submittingReport, setSubmittingReport] = useState(false);
    const [mojs, setMojs] = useState<any>(null);

    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    // Removed local currentUserProfile
    const [newPostTitle, setNewPostTitle] = useState('');
    const [newPostContent, setNewPostContent] = useState('');
    const [submittingPost, setSubmittingPost] = useState(false);
    // Removed local isCreatePostModalOpen
    const [commentsData, setCommentsData] = useState<Record<string, any[]>>({});

    const [editingPost, setEditingPost] = useState<any>(null);
    const [userReactions, setUserReactions] = useState<Record<string, string>>({});
    const [userCommentReactions, setUserCommentReactions] = useState<Record<string, string>>({});
    const [toasts, setToasts] = useState<any[]>([]);
    const [confirmModal, setConfirmModal] = useState<any>({ isOpen: false, title: '', message: '', onConfirm: null, type: 'danger' });
    const [postImages, setPostImages] = useState<string[]>([]);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [recommendedChannels, setRecommendedChannels] = useState<any[]>([]);
    const [trendingTopics, setTrendingTopics] = useState<any[]>([]);
    const postImageInputRef = useRef<HTMLInputElement>(null);

    const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
    };

    const showConfirm = (title: string, message: string, onConfirm: () => void, type: 'danger' | 'success' = 'danger') => {
        setConfirmModal({ isOpen: true, title, message, onConfirm, type });
    };

    const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Unified Context Loading for page-specific data
    useEffect(() => {
        const init = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return;

            // Parallel fetch reactions and saved posts
            const [reactionsRes, commentReactionsRes, savedRes] = await Promise.all([
                supabase.from('post_reactions').select('post_id, reaction_type').eq('user_id', session.user.id),
                supabase.from('comment_reactions').select('comment_id, reaction_type').eq('user_id', session.user.id),
                supabase.from('saved_posts').select('post_id').eq('user_id', session.user.id)
            ]);

            if (reactionsRes.data) {
                const mapped = reactionsRes.data.reduce((acc: any, r: any) => ({ ...acc, [r.post_id]: r.reaction_type }), {});
                setUserReactions(mapped);
            }

            if (commentReactionsRes.data) {
                const mapped = commentReactionsRes.data.reduce((acc: any, r: any) => ({ ...acc, [r.comment_id]: r.reaction_type }), {});
                setUserCommentReactions(mapped);
            }

            if (savedRes.data) {
                setSavedPosts(savedRes.data.map((s: any) => s.post_id));
            }
        };
        init();
        import('@mojs/core').then((module) => { setMojs(module.default || module); });
    }, []);

    const formatCount = (n: number) => {
        if (!n) return '0';
        if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'm';
        if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
        return n.toString();
    };

    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);

            try {
                // 1. Fetch posts (limited to 40 for speed)
                let query = supabase
                    .from('posts')
                    .select(`*, profiles:author_id (*), channels:channel_id (*)`)
                    .order('created_at', { ascending: false })
                    .limit(40);

                if (searchTerm) {
                    if (searchTerm.startsWith('#')) {
                        const tag = searchTerm.substring(1).toLowerCase();
                        query = query.contains('tags', [tag]);
                    } else {
                        query = query.or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`);
                    }
                }

                const { data: postsData } = await query;

                if (postsData && postsData.length > 0) {
                    setPosts(postsData);

                    // 2. Fetch comments for ONLY these posts in parallel
                    const postIds = postsData.map(p => p.id);
                    const { data: fetchedComments, error: commentsError } = await supabase
                        .from('comments')
                        .select('*, profiles:author_id (*)')
                        .in('post_id', postIds)
                        .order('created_at', { ascending: true });

                    if (commentsError) {
                        console.error("Error fetching comments details:", {
                            message: commentsError.message,
                            code: commentsError.code
                        });
                    }

                    if (fetchedComments) {
                        const mappedComments: Record<string, any[]> = {};
                        fetchedComments.forEach(c => {
                            if (!mappedComments[c.post_id]) mappedComments[c.post_id] = [];
                            mappedComments[c.post_id].push(c);
                        });
                        setCommentsData(mappedComments);
                    }
                } else {
                    setPosts([]);
                }

                setLoading(false);

                // 3. Fetch recommended channels (Bowls for you)
                const { data: recChannels } = await supabase
                    .from('channels')
                    .select('*')
                    .limit(5)
                    .order('followers_count', { ascending: false });

                if (recChannels) {
                    setRecommendedChannels(recChannels);
                }

                // 4. Calculate Trending Topics from last 100 posts
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
                                if (normalized) {
                                    counts[normalized] = (counts[normalized] || 0) + 1;
                                }
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
            } catch (err: any) {
                if (err.name === 'AbortError') return;
                console.error("Error loading community data:", err);
            }
        };
        loadInitialData();
    }, [searchTerm]);


    const currentId = activeIdentity || {
        id: 'candidate',
        type: 'profile',
        username: currentUserProfile?.username || 'user',
        name: currentUserProfile?.full_name || 'Guest',
        full_name: currentUserProfile?.full_name || 'Guest',
        avatar: currentUserProfile?.avatar_url || null,
        isChannel: false,
        is_verified: currentUserProfile?.is_verified || false
    };

    // --- HANDLERS ---
    const handlePostImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Size Limit: 3MB
        if (file.size > 3 * 1024 * 1024) {
            addToast("Post şəkli üçün maksimum 3 MB icazə verilir.", "error");
            return;
        }

        try {
            setUploadingImage(true);
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('Upload failed');
            const { url } = await response.json();
            setPostImages(prev => [...prev, url]);
        } catch (error) {
            console.error('Image upload error:', error);
            addToast('Şəkil yüklənərkən xəta baş verdi', 'error');
        } finally {
            setUploadingImage(false);
        }
    };

    const handleCreatePost = async () => {
        if (!newPostContent.trim()) return;
        if (!currentUserProfile) {
            addToast("İstifadəçi məlumatları hələ yüklənməyib.", "error");
            return;
        }

        setSubmittingPost(true);
        try {
            // Auto-extract hashtags
            const hashtagRegex = /#(\w+)/g;
            const matches = [...newPostContent.matchAll(hashtagRegex)];
            const tags = matches.map((m: any) => m[1]);

            let postPayload: any = {
                author_id: currentUserProfile.id,
                channel_id: currentId.id !== 'candidate' ? currentId.id : null,
                title: newPostTitle || "Untitled Post",
                content: newPostContent,
                tags: tags,
                likes_count: 0,
                comments_count: 0,
                image_url: postImages.length > 0 ? postImages[0] : null,
                images: postImages
            };

            const performInsert = async (payload: any) => {
                return await supabase
                    .from('posts')
                    .insert([payload])
                    .select()
                    .maybeSingle();
            };

            let { data: insertedPost, error } = await performInsert(postPayload);

            // FALLBACK: If error is about missing columns (image_url/images likely missing in DB)
            if (error && (error.code === 'PGRST204' || error.message.includes('column "image_url"') || error.message.includes('column "images"'))) {
                console.warn("DB columns missing, retrying without images...");
                const fallbackPayload = { ...postPayload };
                delete fallbackPayload.image_url;
                delete fallbackPayload.images;

                // Keep the URLs in the content so they aren't lost if the DB columns don't exist yet
                if (postImages.length > 0) {
                    fallbackPayload.content += "\n\n" + postImages.join("\n");
                }

                const retry = await performInsert(fallbackPayload);
                insertedPost = retry.data;
                error = retry.error;
            }

            if (!error && insertedPost && postPayload.channel_id) {
                await supabase.rpc('increment_channel_posts', { chan_id: postPayload.channel_id });
            }

            if (error) {
                console.error("Post creation error:", error);
                addToast("Xəta baş verdi: " + error.message, "error");
            } else if (!insertedPost) {
                addToast("Post yaradıldı, lakin geri oxuna bilmədi. RLS siyasətlərinizi yoxlayın.", "error");
            } else {
                const fullPostForState = {
                    ...insertedPost,
                    profiles: currentUserProfile,
                    channels: currentId.isChannel ? {
                        id: currentId.id,
                        name: currentId.full_name,
                        username: currentId.username,
                        avatar_url: currentId.avatar,
                        is_verified: currentId.is_verified
                    } : null
                };
                setPosts([fullPostForState, ...posts]);
                setIsCreatePostModalOpen(false);
                setNewPostTitle('');
                setNewPostContent('');
                setPostImages([]);
                addToast("Post paylaşıldı!", "success");
            }
        } catch (err: any) {
            console.error("Unexpected error:", err);
            addToast("Gözlənilməz xəta: " + err.message, "error");
        } finally {
            setSubmittingPost(false);
        }
    };

    const triggerBurst = (x: number, y: number, type: string) => {
        if (!x || !y) return;

        const iconSVGs: Record<string, string> = {
            'Like': `<svg width="32" height="32" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="16" fill="#0CAA41"/><path d="M11 20.5V11.5H13.5V20.5H11ZM14.5 20.5V11.5H15.5L19.5 7.5L21 8.5V10.5L19 13.5H23.5L24.5 15V19L23 20.5H14.5Z" fill="white"/></svg>`,
            'Helpful': `<svg width="32" height="32" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="16" fill="#00AEEF"/><path d="M10 16L13 13L16 16L19 13L22 16M11 19C11 19 13 22 16 22C19 22 21 19 21 19" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>`,
            'Smart': `<svg width="32" height="32" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="16" fill="#00A3FF"/><path d="M16 8L18.5 13.5H24L19.5 17L21 22.5L16 19.5L11 22.5L12.5 17L8 13.5H13.5L16 8Z" fill="white" stroke="black" strokeWidth="1.2"/></svg>`,
            'Uplifting': `<svg width="32" height="32" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="16" fill="#B159FF"/><path d="M16 8L17.5 11L20.5 10L19.5 13L23 14.5L20 16L21.5 19L18.5 18L17 21L15 18.5L12 19.5L13 16.5L10 16L12.5 14L11 11L14 12L16 8Z" fill="white" stroke="black" strokeWidth="1.2"/></svg>`,
            'Funny': `<svg width="32" height="32" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="16" fill="#FF4B91"/><circle cx="16" cy="16" r="7" fill="white" stroke="black" strokeWidth="1.2"/><path d="M13 15C13 15 13.5 14 14.5 14C15.5 14 16 15 16 15M17 15C17 15 17.5 14 18.5 14C19.5 14 20 15 20 15M14 18C14 18 15 20 16.5 20C18 20 19 18 19 18" stroke="black" strokeWidth="1.2" strokeLinecap="round"/></svg>`
        };

        const svgContent = iconSVGs[type] || iconSVGs['Like'];
        const count = 10;

        // Also trigger a mojs shape if available for that "super premium" feel
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

            // Random trajectory
            const angle = (i / count) * Math.PI * 2 + (Math.random() * 0.4 - 0.2);
            const dist = 100 + Math.random() * 80;
            const tx = Math.cos(angle) * dist;
            const ty = Math.sin(angle) * dist;
            const rot = Math.random() * 180 - 90;
            const size = i % 2 === 0 ? 18 : 32;

            el.style.left = `${x}px`;
            el.style.top = `${y}px`;
            el.style.width = `${size}px`;
            el.style.height = `${size}px`;
            el.style.setProperty('--tx', `${tx}px`);
            el.style.setProperty('--ty', `${ty}px`);
            el.style.setProperty('--rot', `${rot}deg`);

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
            // Toggle OFF
            await supabase.from('post_reactions').delete().eq('post_id', postId).eq('user_id', currentUserProfile.id);
            await supabase.rpc('decrement_likes_count', { post_id: postId });
            setUserReactions(prev => { const n = { ...prev }; delete n[postId]; return n; });
            setPosts(posts.map((p: any) => p.id === postId ? { ...p, likes_count: Math.max(0, (p.likes_count || 1) - 1) } : p));
        } else {
            // UPSERT (Replace or New)
            await supabase.from('post_reactions').upsert({ post_id: postId, user_id: currentUserProfile.id, reaction_type: label }, { onConflict: 'post_id,user_id' });
            if (!currentReaction) {
                await supabase.rpc('increment_likes_count', { post_id: postId });
            }
            setUserReactions(prev => ({ ...prev, [postId]: label }));
            if (!currentReaction) {
                setPosts(posts.map((p: any) => p.id === postId ? { ...p, likes_count: (p.likes_count || 0) + 1 } : p));
            }
        }
        setActiveReactionPostId(null);
    };

    const handleUpdatePost = async () => {
        if (!editingPost || !editingPost.content.trim()) return;

        const hashtagRegex = /#(\w+)/g;
        const tags = [...editingPost.content.matchAll(hashtagRegex)].map((m: any) => m[1]);

        const { error } = await supabase
            .from('posts')
            .update({
                title: editingPost.title,
                content: editingPost.content,
                tags: tags.length > 0 ? tags : null
            })
            .eq('id', editingPost.id);

        if (error) {
            addToast("Error: " + error.message, "error");
        } else {
            setPosts(posts.map((p: any) => p.id === editingPost.id ? { ...p, title: editingPost.title, content: editingPost.content, tags: tags.length > 0 ? tags : p.tags } : p));
            setEditingPost(null);
            addToast("Post updated successfully!", "success");
        }
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
            setCommentsData(prev => {
                const updated = [...(prev[postId] || []), data];
                setPosts(prevPosts => prevPosts.map(p => p.id === postId ? {
                    ...p,
                    comments_count: (p.comments_count || 0) + 1
                } : p));
                return { ...prev, [postId]: updated };
            });
            await supabase.rpc('increment_comment_count', { post_id: postId });

            // Sync with DB count
            const { data: postData } = await supabase.from('posts').select('comments_count').eq('id', postId).single();
            if (postData) {
                setPosts(prevPosts => prevPosts.map(p => p.id === postId ? { ...p, comments_count: postData.comments_count } : p));
            }
            addToast("Comment added", "success");
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
                const currentPostComments = commentsData[postId] || [];
                const itemsToRemove = currentPostComments.filter(c => c.id === commentId || c.parent_id === commentId);
                const removeCount = itemsToRemove.length;

                const { error } = await supabase.from('comments').delete().eq('id', commentId);
                if (!error) {
                    setCommentsData(prev => ({
                        ...prev,
                        [postId]: (prev[postId] || []).filter(c => c.id !== commentId && c.parent_id !== commentId)
                    }));
                    setPosts(prevPosts => prevPosts.map(p => p.id === postId ? {
                        ...p,
                        comments_count: Math.max(0, (p.comments_count || 0) - removeCount)
                    } : p));
                    await supabase.rpc('decrement_comment_count', { post_id: postId });

                    // Sync with DB count
                    const { data: postData } = await supabase.from('posts').select('comments_count').eq('id', postId).single();
                    if (postData) {
                        setPosts(prevPosts => prevPosts.map(p => p.id === postId ? { ...p, comments_count: postData.comments_count } : p));
                    }
                    addToast("Comment deleted", "success");
                } else {
                    addToast("Error: " + error.message, "error");
                }
            }
        );
    };

    const handleDeletePost = async (postId: any) => {
        showConfirm(
            "Delete Post",
            "Are you sure you want to delete this post? This action cannot be undone.",
            async () => {
                const postToDelete = posts.find(p => p.id === postId);
                const { error } = await supabase.from('posts').delete().eq('id', postId);
                if (!error) {
                    setPosts(posts.filter(p => p.id !== postId));
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
            // Assuming comment_reports exists or similar structure
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
        } else {
            console.error("Report error:", error);
            addToast("Error submitting report: " + error.message, "error");
        }
        setSubmittingReport(false);
    };


    const handleCommentReaction = async (commentId: string, label: string, postId: any, e: any) => {
        if (!currentUserProfile) return;
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);

        triggerBurst(clientX, clientY, label);

        // 1. Get current local state for optimistic update
        const currentReaction = userCommentReactions[commentId];

        if (currentReaction === label) {
            // REMOVE: Same reaction clicked again
            // Optimistic update
            setUserCommentReactions(prev => {
                const n = { ...prev };
                delete n[commentId];
                return n;
            });
            setCommentsData(prev => ({
                ...prev,
                [postId]: (prev[postId] || []).map(c => c.id === commentId ? { ...c, likes_count: Math.max(0, (c.likes_count || 1) - 1) } : c)
            }));

            // DB sync
            await supabase.from('comment_reactions').delete().eq('comment_id', commentId).eq('user_id', currentUserProfile.id);
            await supabase.rpc('decrement_comment_likes', { com_id: commentId });
        } else if (currentReaction) {
            // SWITCH: Change reaction type, count stays same
            // Optimistic update
            setUserCommentReactions(prev => ({ ...prev, [commentId]: label }));

            // DB sync
            await supabase.from('comment_reactions').delete().eq('comment_id', commentId).eq('user_id', currentUserProfile.id);
            await supabase.from('comment_reactions').insert({
                comment_id: commentId,
                user_id: currentUserProfile.id,
                reaction_type: label
            });
        } else {
            // NEW: Insert first reaction and increment
            // Optimistic update
            setUserCommentReactions(prev => ({ ...prev, [commentId]: label }));
            setCommentsData(prev => ({
                ...prev,
                [postId]: (prev[postId] || []).map(c => c.id === commentId ? { ...c, likes_count: (c.likes_count || 0) + 1 } : c)
            }));

            // DB sync
            await supabase.from('comment_reactions').insert({
                comment_id: commentId,
                user_id: currentUserProfile.id,
                reaction_type: label
            });
            await supabase.rpc('increment_comment_likes', { com_id: commentId });
        }

        // Final sync with DB to ensure absolute accuracy
        setTimeout(async () => {
            const { data: comData } = await supabase.from('comments').select('likes_count').eq('id', commentId).single();
            if (comData) {
                setCommentsData(prev => ({
                    ...prev,
                    [postId]: (prev[postId] || []).map(c => c.id === commentId ? { ...c, likes_count: comData.likes_count } : c)
                }));
            }
        }, 1000);
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

    const handleHeaderMouseEnter = (id: any) => { if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current); setHoveredItemId(id); };
    const handleHeaderMouseLeave = () => { hoverTimeoutRef.current = setTimeout(() => { setHoveredItemId(null); }, 300); };
    const toggleComments = (postId: any) => { setExpandedComments(prev => prev.includes(postId) ? prev.filter(id => id !== postId) : [...prev, postId]); };
    const toggleFullComments = (postId: any) => { setFullyExpandedPosts(prev => prev.includes(postId) ? prev.filter(id => id !== postId) : [...prev, postId]); };
    const handleShare = (postId: any) => { if (typeof window !== 'undefined') { const url = window.location.origin + `/community/post/${postId}`; navigator.clipboard.writeText(url); addToast("Post link copied!", "info"); } };

    // --- MOCK DATA ---
    // Trending Topics and Bowls could also be dynamic, but keeping them static for now as mock data is okay unless specified
    // Dynamic Trending Topics based on current feed
    // Global trendingTopics fetched in useEffect



    const popularBowls = [
        { id: 1, name: "HR Jobs & Advice", icon: "https://img.naukimg.com/logo_images/groups/v1/4607713.gif" },
        { id: 2, name: "Salaries in HR", icon: "https://img.naukimg.com/logo_images/groups/v1/4630125.gif" },
        { id: 3, name: "Human Resources", icon: "https://img.naukimg.com/logo_images/groups/v1/485096.gif" },
    ];

    const recommendedBowls = [
        { id: 4, name: "Jobs in STEM", icon: "https://img.naukimg.com/logo_images/groups/v1/362038.gif", members: "5M" },
        { id: 5, name: "Finance", icon: "https://img.naukimg.com/logo_images/groups/v2/44512.gif", members: "2M" },
    ];

    const proMembers = [
        { id: 1, name: "Adam Grant", role: "Organizational psychologist @Wharton. #1 NYT bestselling author.", avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=150" },
        { id: 2, name: "Erica Rivera", role: "Ex-Google & Indeed recruiter. The Aftermath: Career & Life.", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150" },
        { id: 3, name: "Taylor Hayes", role: "Determined 9-5er with a love for personal finance and equity.", avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=150" },
        { id: 4, name: "James Clear", role: "Author of Atomic Habits. Multi-disciplinary researcher.", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150" }
    ];

    return (
        <>
            {/* MAIN RAIL */}
            <section className="comm-main-rail">
                <div className="comm-feed">
                    {searchTerm && (
                        <div style={{ padding: '8px 4px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: '#64748b', fontSize: '15px' }}>Showing results for</span>
                            <span style={{ color: '#00a264', fontWeight: '700', fontSize: '15px', background: '#e5fff5', padding: '4px 12px', borderRadius: '16px' }}>{searchTerm}</span>
                            <button
                                onClick={() => router.push('/community')}
                                style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#64748b', fontSize: '13px', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline' }}
                            >
                                Clear search
                            </button>
                        </div>
                    )}
                    {loading ? (
                        <div className="skeleton-feed" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {[1, 2, 3].map(i => (
                                <div key={i} className="post-card-v3 skeleton-post" style={{ padding: '24px' }}>
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f1f5f9' }} className="skeleton-pulse"></div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ width: '120px', height: '12px', background: '#f1f5f9', marginBottom: '8px', borderRadius: '4px' }} className="skeleton-pulse"></div>
                                            <div style={{ width: '80px', height: '10px', background: '#f1f5f9', borderRadius: '4px' }} className="skeleton-pulse"></div>
                                        </div>
                                    </div>
                                    <div style={{ width: '100%', height: '16px', background: '#f1f5f9', marginBottom: '12px', borderRadius: '4px' }} className="skeleton-pulse"></div>
                                    <div style={{ width: '60%', height: '16px', background: '#f1f5f9', borderRadius: '4px' }} className="skeleton-pulse"></div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {posts.map((post) => (
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
                                    onEditPost={setEditingPost}
                                    onShare={handleShare}
                                    onToggleComments={toggleComments}
                                    onToggleFullComments={toggleFullComments}
                                    onReportPost={handleReportPost}
                                    onReportComment={handleReportComment}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* RIGHT RAIL */}
            <aside className="comm-right-rail">
                {/* Search Bar - NEW */}
                <div className="rail-card-v3" style={{ padding: '12px', marginBottom: '16px' }}>
                    <div style={{ position: 'relative' }}>
                        <input
                            type="text"
                            placeholder="Search hashtags or keywords..."
                            defaultValue={searchTerm || ''}
                            key={searchTerm}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    const val = e.currentTarget.value.trim();
                                    if (val) {
                                        router.push(`/community?search=${encodeURIComponent(val)}`);
                                    } else {
                                        router.push('/community');
                                    }
                                }
                            }}
                            style={{
                                width: '100%',
                                padding: '10px 12px 10px 38px',
                                borderRadius: '24px',
                                border: '1px solid #e2e8f0',
                                background: '#f8fafc',
                                fontSize: '14px',
                                outline: 'none',
                                color: '#1e293b'
                            }}
                        />
                        <svg style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                        {searchTerm && (
                            <button
                                onClick={() => router.push('/community')}
                                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: '#94a3b8', color: 'white', border: 'none', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '10px' }}
                            >
                                ✕
                            </button>
                        )}
                    </div>
                </div>

                {/* Trending Topics - NEW */}
                <div className="rail-card-v3">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <h4 style={{ margin: 0 }}>Trending Topics 🔥</h4>
                    </div>
                    <div className="trending-list">
                        {trendingTopics.map((topic, i) => (
                            <Link
                                key={i}
                                href={`/community?search=${encodeURIComponent(topic.tag.replace('#', ''))}`}
                                className="trending-item"
                            >
                                <span className="t-name">{topic.tag}</span>
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="rail-card-v3">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <h4 style={{ margin: 0 }}>Bowls for you</h4>
                        <Link href="/community" style={{ fontSize: '12px', color: '#00a264', fontWeight: '700', textDecoration: 'none' }}>Explore all</Link>
                    </div>
                    {recommendedChannels.length > 0 ? recommendedChannels.map((chan: any) => (
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
                    )) : (
                        <div className="skeleton-mini-bowls">
                            {[1, 2].map(i => (
                                <div key={i} style={{ display: 'flex', gap: '12px', marginBottom: '12px', alignItems: 'center' }}>
                                    <div style={{ width: '40px', height: '40px', background: '#f1f5f9', borderRadius: '12px' }} className="skeleton-pulse"></div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ width: '80%', height: '10px', background: '#f1f5f9', marginBottom: '6px' }} className="skeleton-pulse"></div>
                                        <div style={{ width: '40%', height: '8px', background: '#f1f5f9' }} className="skeleton-pulse"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="rail-card-v3 jobs-promo-card">
                    <div className="promo-content">
                        <div className="promo-image">
                            <LottieIcon src="https://lottie.host/98263714-e014-4854-a4c0-3b83d95f57ac/e4adTK82z0.lottie" size={220} />
                        </div>
                        <h3>Find your dream job in seconds</h3>
                        <p>Explore thousands of open roles across global tech hubs.</p>
                        <Link href="/jobs" className="btn-promo-cta">
                            Explore Jobs
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                        </Link>
                    </div>
                </div>

                <div className="rail-card-v3" style={{ background: 'transparent', border: 'none', padding: '0' }}>
                    <footer style={{ fontSize: '11px', color: '#94a3b8', lineHeight: '1.6' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                            <Link href="#" style={{ color: '#64748b', textDecoration: 'none' }}>Help</Link>
                            <Link href="#" style={{ color: '#64748b', textDecoration: 'none' }}>Terms</Link>
                            <Link href="#" style={{ color: '#64748b', textDecoration: 'none' }}>Privacy</Link>
                            <Link href="#" style={{ color: '#64748b', textDecoration: 'none' }}>Cookies</Link>
                        </div>
                        <p>© 2026 Jobin LLC.</p>
                    </footer>
                </div>
            </aside>

            {/* CREATE POST MODAL */}
            {
                isCreatePostModalOpen && (
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

                                <div className="image-upload-wrapper">
                                    {postImages.map((src, idx) => (
                                        <div key={idx} className="image-preview-item">
                                            <img src={src} alt="Preview" />
                                            <button className="btn-remove-img" onClick={() => setPostImages(prev => prev.filter((_, i) => i !== idx))}>×</button>
                                        </div>
                                    ))}
                                    {postImages.length < 1 && (
                                        <div className="btn-add-image" onClick={() => postImageInputRef.current?.click()}>
                                            {uploadingImage ? (
                                                <div className="spinner-small" />
                                            ) : (
                                                <>
                                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                                                    <span>Add Image</span>
                                                </>
                                            )}
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        hidden
                                        ref={postImageInputRef}
                                        accept="image/*"
                                        onChange={handlePostImageUpload}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer-v3">
                                <button className="btn-cancel-post" onClick={() => setIsCreatePostModalOpen(false)}>Cancel</button>
                                <button className="btn-submit-post" onClick={handleCreatePost} disabled={!newPostContent.trim() || submittingPost || uploadingImage}>
                                    {submittingPost ? 'Posting...' : uploadingImage ? 'Uploading...' : 'Post'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* EDIT POST MODAL */}
            {
                editingPost && (
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
                )
            }

            {/* REPORT MODAL */}
            {
                (reportingPost || reportingComment) && (
                    <div className="modal-overlay-v3" onClick={() => { setReportingPost(null); setReportingComment(null); }}>
                        <div className="modal-content-v3 report-modal" onClick={e => e.stopPropagation()}>
                            <div className="modal-header-v3">
                                <h2>Report {reportingPost ? 'Post' : 'Comment'}</h2>
                                <button className="btn-close-modal" onClick={() => { setReportingPost(null); setReportingComment(null); }}>×</button>
                            </div>
                            <div className="modal-body-v3">
                                <p className="report-intro">Why are you reporting this post?</p>
                                <div className="report-options">
                                    {['Inappropriate content', 'Spam', 'Harassment', 'False information', 'Other'].map(reason => (
                                        <label key={reason} className="report-label">
                                            <input
                                                type="radio"
                                                name="reportReason"
                                                value={reason}
                                                checked={reportReason === reason}
                                                onChange={e => setReportReason(e.target.value)}
                                            />
                                            <span>{reason}</span>
                                        </label>
                                    ))}
                                </div>
                                <textarea
                                    className="post-content-textarea"
                                    placeholder="Additional details (optional)..."
                                    value={reportDetails}
                                    onChange={e => setReportDetails(e.target.value)}
                                    style={{ marginTop: '16px' }}
                                ></textarea>
                            </div>
                            <div className="modal-footer-v3">
                                <button className="btn-cancel-post" onClick={() => { setReportingPost(null); setReportingComment(null); }}>Cancel</button>
                                <button
                                    className="btn-submit-post report"
                                    onClick={handleReportSubmit}
                                    disabled={!reportReason || submittingReport}
                                    style={{ background: '#ef4444' }}
                                >
                                    {submittingReport ? 'Reporting...' : 'Submit Report'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* CUSTOM CONFIRM MODAL */}
            {
                confirmModal.isOpen && (
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
                )
            }



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
