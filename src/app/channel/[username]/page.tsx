"use client";

import React, { useState, useEffect } from 'react';
import { useChannel } from './layout';
import { PostCard } from '@/components/post/PostCard';
import { supabase } from '@/lib/supabase';

export default function PostsPage() {
    const { channel, setPosts, currentUserProfile, activeIdentity, addToast, mojs } = useChannel();
    const [postsData, setPostsData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedComments, setExpandedComments] = useState<any[]>([]);
    const [fullyExpandedPosts, setFullyExpandedPosts] = useState<any[]>([]);
    const [userReactions, setUserReactions] = useState<Record<string, string>>({});
    const [userCommentReactions, setUserCommentReactions] = useState<Record<string, string>>({});
    const [commentsData, setCommentsData] = useState<Record<string, any[]>>({});

    useEffect(() => {
        const load = async () => {
            if (!channel) return;
            setLoading(true);
            const { data } = await supabase.from('posts').select('*, profiles:author_id (*), channels:channel_id (*)').eq('channel_id', channel.id).order('created_at', { ascending: false });
            if (data) {
                setPostsData(data);
                setPosts(data); // Update shared posts count
                const postIds = data.map(p => p.id);
                const { data: commentsRes } = await supabase.from('comments').select('*, profiles:author_id (*), channels:channel_id (*)').in('post_id', postIds);
                if (commentsRes) {
                    const mapped: any = {};
                    commentsRes.forEach(c => { if (!mapped[c.post_id]) mapped[c.post_id] = []; mapped[c.post_id].push(c); });
                    setCommentsData(mapped);
                }
                if (currentUserProfile) {
                    const { data: reactions } = await supabase.from('post_reactions').select('post_id, reaction_type').eq('user_id', currentUserProfile.id).in('post_id', postIds);
                    if (reactions) setUserReactions(reactions.reduce((acc: any, r: any) => ({ ...acc, [r.post_id]: r.reaction_type }), {}));
                }
            }
            setLoading(false);
        };
        load();
    }, [channel?.id, currentUserProfile?.id]);

    const handleReaction = async (postId: any, label: string, e: any) => {
        if (!currentUserProfile) return;
        const current = userReactions[postId];
        if (current === label) {
            await supabase.from('post_reactions').delete().eq('post_id', postId).eq('user_id', currentUserProfile.id);
            await supabase.rpc('decrement_likes_count', { post_id: postId });
            setUserReactions(prev => { const n = { ...prev }; delete n[postId]; return n; });
            setPostsData(p => p.map(x => x.id === postId ? { ...x, likes_count: Math.max(0, x.likes_count - 1) } : x));
        } else {
            await supabase.from('post_reactions').upsert({ post_id: postId, user_id: currentUserProfile.id, reaction_type: label }, { onConflict: 'post_id,user_id' });
            if (!current) await supabase.rpc('increment_likes_count', { post_id: postId });
            setUserReactions(prev => ({ ...prev, [postId]: label }));
            if (!current) setPostsData(p => p.map(x => x.id === postId ? { ...x, likes_count: (x.likes_count || 0) + 1 } : x));
        }
    };

    const handleAddComment = async (postId: any, text: string) => {
        if (!currentUserProfile) return;
        const { data, error } = await supabase.from('comments').insert([{ post_id: postId, author_id: currentUserProfile.id, content: text }]).select('*, profiles:author_id (*)').single();
        if (!error) { setCommentsData(prev => ({ ...prev, [postId]: [...(prev[postId] || []), data] })); setPostsData(prev => prev.map(p => p.id === postId ? { ...p, comments_count: (p.comments_count || 0) + 1 } : p)); }
    };

    if (loading) return null;
    if (postsData.length === 0) return <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>No posts yet.</div>;

    return (
        <>
            {postsData.map(post => (
                <PostCard
                    key={post.id} post={post} currentUserProfile={currentUserProfile}
                    comments={commentsData[post.id] || []} userReaction={userReactions[post.id]}
                    userCommentReactions={userCommentReactions} isExpanded={expandedComments.includes(post.id)}
                    isFullyExpanded={fullyExpandedPosts.includes(post.id)} onReaction={handleReaction}
                    onCommentReaction={() => { }} onAddComment={handleAddComment} onAddReply={() => { }}
                    onDeleteComment={() => { }} onDeletePost={() => { }} onEditPost={() => { }}
                    onShare={() => { }} onToggleComments={(id) => setExpandedComments(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
                    onToggleFullComments={() => { }}
                    disableHoverCard={true}
                />
            ))}
        </>
    );
}
