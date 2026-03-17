"use client";

import Link from 'next/link';
import React, { useState, useRef } from 'react';
import { GlassdoorIcon } from '../common/GlassdoorIcon';
import { LottieIcon } from '../common/LottieIcon';
import { PollComponent } from './PollComponent';
import { UserHoverCard } from './UserHoverCard';
import {
    formatRelativeTime,
    buildCommentTree,
    renderTextWithMentions,
    reactionIcons
} from '@/utils/postHelpers';
import { VerifiedBadge } from '../common/VerifiedBadge';


interface PostCardProps {
    post: any;
    currentUserProfile: any;
    comments: any[];
    userReaction?: string;
    userCommentReactions: Record<string, string>;
    isExpanded: boolean;
    isFullyExpanded: boolean;
    onReaction: (postId: string, label: string, e: any) => void;
    onCommentReaction: (commentId: string, label: string, postId: string, e: any) => void;
    onAddComment: (postId: string, text: string) => void;
    onAddReply: (postId: string, parentId: string, text: string) => void;
    onDeleteComment: (postId: string, commentId: string) => void;
    onDeletePost?: (postId: string) => void;
    onEditPost?: (post: any) => void;
    onShare: (postId: string) => void;
    onToggleComments: (postId: string) => void;
    onToggleFullComments: (postId: string) => void;
    onReportPost?: (post: any) => void;
    onReportComment?: (comment: any) => void;
    disableHoverCard?: boolean;
}

export const PostCard = ({
    post,
    currentUserProfile,
    comments,
    userReaction,
    userCommentReactions,
    isExpanded,
    isFullyExpanded,
    onReaction,
    onCommentReaction,
    onAddComment,
    onAddReply,
    onDeleteComment,
    onDeletePost,
    onEditPost,
    onShare,
    onToggleComments,
    onToggleFullComments,
    onReportPost,
    onReportComment,
    disableHoverCard
}: PostCardProps) => {
    const [localHovered, setLocalHovered] = useState(false);
    const [localMenuOpen, setLocalMenuOpen] = useState(false);
    const [activeReactionPostId, setActiveReactionPostId] = useState<string | null>(null);
    const [activeReactionCommentId, setActiveReactionCommentId] = useState<string | null>(null);
    const [replyToCommentId, setReplyToCommentId] = useState<string | null>(null);
    const [isReadMoreExpanded, setIsReadMoreExpanded] = useState(false);
    const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Unified Author Logic: Profile or Channel
    const isChannelPost = !!post.channel_id && post.channels;
    const authorObject = isChannelPost ? post.channels : (post.profiles || {});
    const authorName = isChannelPost ? authorObject.name : (authorObject.full_name || 'Anonymous');
    const authorAvatar = authorObject.avatar_url;
    const authorUsername = authorObject.username;

    // Ownership check: If I am the author of the profile post, or I am the owner of the channel post
    const isMyPost = post.author_id === currentUserProfile?.id || (isChannelPost && authorObject.owner_id === currentUserProfile?.id);

    const handleReactionMouseEnter = () => {
        if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
        setActiveReactionPostId(post.id);
    };

    const handleReactionMouseLeave = () => {
        hideTimeoutRef.current = setTimeout(() => {
            setActiveReactionPostId(null);
        }, 400);
    };

    const renderComment = (com: any, depth = 0) => {
        const isChannelComment = !!com.channel_id && com.channels;
        const comAuthor = isChannelComment ? com.channels : (com.profiles || {});
        const comAuthorName = isChannelComment ? comAuthor.name : (comAuthor.full_name || 'Anonymous');

        const isPoster = com.author_id === post.author_id || (com.channel_id && com.channel_id === post.channel_id);
        const isMyCom = com.author_id === currentUserProfile?.id || (com.channel_id && comAuthor.owner_id === currentUserProfile?.id);
        const canDelete = isMyCom || isMyPost;

        return (
            <div key={com.id} className="comment-block-v4" style={{
                marginLeft: depth > 0 ? '30px' : '0',
                borderLeft: depth > 0 ? '1px solid #e2e8f0' : 'none'
            }}>
                <div className="comment-item-v4">
                    <Link href={isChannelComment ? `/channel/${comAuthor.username}` : `/profile/${comAuthor.username}`} className="avatar-initials-v4" style={{
                        width: depth > 0 ? '20px' : '28px',
                        height: depth > 0 ? '20px' : '28px',
                        backgroundImage: comAuthor.avatar_url ? `url(${comAuthor.avatar_url})` : 'none',
                        backgroundColor: comAuthor.avatar_url ? 'transparent' : (isChannelComment ? '#1e293b' : '#00a264'),
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        textDecoration: 'none',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: depth > 0 ? '8px' : '10px'
                    }}>
                        {!comAuthor.avatar_url && (comAuthorName || 'U').split(' ').map((n: string) => n[0]).join('')}
                    </Link>
                    <div className="comment-content-wrapper-v4">
                        <div className="comment-bubble-v4">
                            <div className="comment-author-info-v4">
                                <Link href={isChannelComment ? `/channel/${comAuthor.username}` : `/profile/${comAuthor.username}`} className="comment-author-name-v4" style={{ textDecoration: 'none' }}>
                                    {comAuthorName}
                                </Link>
                                {comAuthor.is_verified && (
                                    <VerifiedBadge size={12} isGold={isChannelComment} />
                                )}
                                {isPoster && <span className="comment-badge-v4">Author</span>}
                            </div>
                            <div className="comment-text-v4">
                                {renderTextWithMentions(com.content)}
                            </div>

                            {com.likes_count > 0 && (
                                <div className="p-reaction-summary-v4 comment-summary-override">
                                    <div className="p-reaction-icons-group-v4">
                                        {(() => {
                                            const types: string[] = [];
                                            const userReact = userCommentReactions[com.id];
                                            if (userReact) types.push(userReact.toLowerCase());

                                            if (com.likes_count > 1) {
                                                const diversity = ['like', 'smart', 'funny', 'helpful', 'uplifting'];
                                                for (const t of diversity) {
                                                    if (types.length >= 3) break;
                                                    if (!types.includes(t)) types.push(t);
                                                }
                                            } else if (types.length === 0 && com.likes_count > 0) {
                                                types.push('like');
                                            }

                                            return types.slice(0, 3).map((t, idx) => (
                                                <GlassdoorIcon key={idx} type={t} size={12} />
                                            ));
                                        })()}
                                    </div>
                                    <span className="p-reaction-count-v4" style={{ fontSize: '11px', marginLeft: '4px' }}>{com.likes_count}</span>
                                </div>
                            )}
                        </div>
                        <div className="comment-footer-v4">
                            <div className="p-action-wrapper"
                                onMouseEnter={() => { if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current); setActiveReactionCommentId(com.id); }}
                                onMouseLeave={() => { hideTimeoutRef.current = setTimeout(() => setActiveReactionCommentId(null), 150); }}
                            >
                                {activeReactionCommentId === com.id && (
                                    <div className="p-popover-v4 comment-popover-pos">
                                        {reactionIcons.map((r: any) => (
                                            <div key={r.id} className="p-pop-item-v4" onClick={(e) => {
                                                onCommentReaction(com.id, r.label, post.id, e);
                                                setActiveReactionCommentId(null);
                                            }}>
                                                {(r as any).lottie ? <LottieIcon src={(r as any).lottie} size={32} /> : <GlassdoorIcon type={(r as any).id} size={32} />}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <button
                                    className={`c-action-btn-v4 ${userCommentReactions[com.id] ? 'active-' + userCommentReactions[com.id].toLowerCase() : ''}`}
                                    style={userCommentReactions[com.id] ? {
                                        color: (() => {
                                            const colors: Record<string, string> = { 'Like': '#00c17b', 'Helpful': '#00AEEF', 'Smart': '#00A3FF', 'Uplifting': '#B159FF', 'Funny': '#FF4B91' };
                                            return colors[userCommentReactions[com.id]] || '#64748b';
                                        })()
                                    } : {}}
                                    onClick={(e) => {
                                        onCommentReaction(com.id, userCommentReactions[com.id] || 'Like', post.id, e);
                                        setActiveReactionCommentId(null);
                                    }}
                                >
                                    {userCommentReactions[com.id] ? (
                                        <GlassdoorIcon type={userCommentReactions[com.id].toLowerCase()} size={14} />
                                    ) : (
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                                    )}
                                    <span>{userCommentReactions[com.id] || 'Like'}</span>
                                </button>
                            </div>
                            <button className="c-action-btn-v4" onClick={() => setReplyToCommentId(com.id)}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>
                                <span>Reply</span>
                            </button>
                            <span className="c-time-v4">{formatRelativeTime(com.created_at)}</span>
                        </div>
                        {replyToCommentId === com.id && (
                            <div className="reply-input-v4">
                                <input autoFocus type="text" placeholder="Write a reply..." onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        onAddReply(post.id, com.id, (e.target as HTMLInputElement).value);
                                        (e.target as HTMLInputElement).value = '';
                                        setReplyToCommentId(null);
                                    }
                                    if (e.key === 'Escape') setReplyToCommentId(null);
                                }} />
                            </div>
                        )}
                    </div>
                </div>
                {com.replies && com.replies.map((reply: any) => renderComment(reply, depth + 1))}
            </div>
        );
    };

    return (
        <div className="post-card-v4">
            <div className="p-header-v4">
                <div className="p-header-left-v4"
                    onMouseEnter={() => !disableHoverCard && setLocalHovered(true)}
                    onMouseLeave={() => !disableHoverCard && setLocalHovered(false)}
                >
                    <div className="avatar-initials-v4" style={{
                        width: '42px',
                        height: '42px',
                        backgroundImage: authorAvatar ? `url(${authorAvatar})` : 'none',
                        backgroundColor: authorAvatar ? 'transparent' : '#00a264',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}>
                        {!authorAvatar && (authorName || 'U').split(' ').map((n: string) => n[0]).join('')}
                    </div>
                    <div className="p-author-meta-v4">
                        <Link href={isChannelPost ? `/channel/${authorUsername}` : `/profile/${authorUsername}`} className="p-name-v4" style={{ textDecoration: 'none' }}>
                            {authorName}
                        </Link>
                        {authorObject.is_verified && (
                            <VerifiedBadge size={14} style={{ marginLeft: '6px' }} isGold={isChannelPost} />
                        )}

                    </div>
                    {!disableHoverCard && (
                        <UserHoverCard
                            user={{
                                ...authorObject,
                                author: authorName,
                                avatar: authorAvatar,
                                initials: (authorName || 'U').split(' ').map((n: string) => n[0]).join(''),
                                isChannel: isChannelPost
                            }}
                            visible={localHovered}
                            onMouseEnter={() => setLocalHovered(true)}
                            onMouseLeave={() => setLocalHovered(false)}
                        />
                    )}
                </div>
                <div className="p-header-right-v4">
                    <div className="p-time-pill-v4">{formatRelativeTime(post.created_at || post.time)}</div>
                    <div className="p-more-container-v4" ref={menuRef}>
                        <button className="btn-more-v4" onClick={() => setLocalMenuOpen(!localMenuOpen)}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="5" cy="12" r="1.2" /><circle cx="12" cy="12" r="1.2" /><circle cx="19" cy="12" r="1.2" /></svg>
                        </button>
                        {localMenuOpen && (
                            <div className="p-dropdown-v4">
                                {isMyPost ? (
                                    <>
                                        <button className="drop-item-v4" onClick={() => { onEditPost?.(post); setLocalMenuOpen(false); }}>Edit</button>
                                        <button className="drop-item-v4 delete" onClick={() => { onDeletePost?.(post.id); setLocalMenuOpen(false); }}>Delete</button>
                                    </>
                                ) : (
                                    <button className="drop-item-v4 report" onClick={() => { onReportPost?.(post); setLocalMenuOpen(false); }}>Report</button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className={`p-body-v4 ${isReadMoreExpanded ? 'is-expanded' : ''}`}>
                <h2 className="p-title-v4">{post.title}</h2>
                {(() => {
                    const content = post.content || '';
                    const charLimit = 200;
                    const needsTruncation = content.length > charLimit;
                    const displayText = (needsTruncation && !isReadMoreExpanded)
                        ? content.substring(0, charLimit) : content;

                    return (
                        <p className="p-content-v4">
                            {renderTextWithMentions(displayText)}
                            {needsTruncation && !isReadMoreExpanded && (
                                <span className="read-more-btn-v4" onClick={() => setIsReadMoreExpanded(true)}>... Read More</span>
                            )}
                        </p>
                    );
                })()}

                {/* Post Images */}
                {(post.images && post.images.length > 0) ? (
                    <div className={`post-images-grid ${post.images.length === 2 ? 'double' : post.images.length >= 3 ? 'triple' : 'single'}`}>
                        {post.images.slice(0, 3).map((img: string, idx: number) => (
                            <img key={idx} src={img} alt="Post content" className="post-img-v4" />
                        ))}
                    </div>
                ) : post.image_url ? (
                    <img src={post.image_url} alt="Post content" className="post-img-v4" />
                ) : null}
            </div>

            {post.poll && <PollComponent poll={post.poll} />}

            <div className="p-actions-v4">
                <div className="p-actions-left-v4">
                    <div className="p-like-pill-v4"
                        onMouseEnter={handleReactionMouseEnter}
                        onMouseLeave={handleReactionMouseLeave}
                    >
                        {(() => {
                            const activeReaction = userReaction;
                            const reactionStyles: Record<string, { color: string, label: string, iconType: string }> = {
                                'Like': { color: '#00c17b', label: 'Like', iconType: 'like' },
                                'Helpful': { color: '#00AEEF', label: 'Helpful', iconType: 'helpful' },
                                'Smart': { color: '#00A3FF', label: 'Smart', iconType: 'smart' },
                                'Uplifting': { color: '#B159FF', label: 'Uplifting', iconType: 'uplifting' },
                                'Funny': { color: '#FF4B91', label: 'Funny', iconType: 'funny' },
                            };
                            const currentStyle = activeReaction ? reactionStyles[activeReaction] : null;

                            return (
                                <button
                                    className={`btn-like-v4 ${activeReaction ? 'active' : ''}`}
                                    style={currentStyle ? { color: currentStyle.color } : {}}
                                    onClick={(e) => {
                                        onReaction(post.id, 'Like', e);
                                        setActiveReactionPostId(null);
                                    }}
                                >
                                    {activeReaction ? (
                                        <GlassdoorIcon type={currentStyle?.iconType || 'like'} size={20} />
                                    ) : (
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                                    )}
                                    <span style={{ marginLeft: '6px' }}>{activeReaction || 'Like'}</span>
                                </button>
                            );
                        })()}
                        {activeReactionPostId === post.id && (
                            <div className="p-popover-v4">
                                {reactionIcons.map(r => (
                                    <div key={r.id} className="p-pop-item-v4" onClick={(e) => {
                                        onReaction(post.id, r.label, e);
                                        setActiveReactionPostId(null);
                                    }}>
                                        {(r as any).lottie ? <LottieIcon src={(r as any).lottie} size={32} /> : <GlassdoorIcon type={(r as any).id} size={32} />}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <button className="btn-action-v4" onClick={() => onToggleComments(post.id)}>
                        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>
                        <span>{Math.max(post.comments_count || 0, comments.length)} Comments</span>
                    </button>

                    <button className="btn-action-v4 share" onClick={() => onShare(post.id)}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" /></svg>
                        <span>Share</span>
                    </button>
                </div>

                <div className="p-actions-right-v4">
                    {post.likes_count > 0 && (
                        <div className="p-reaction-summary-v4">
                            <div className="p-reaction-icons-group-v4">
                                {(() => {
                                    const types = [];
                                    if (userReaction) types.push(userReaction.toLowerCase());
                                    // Hacky way to show multiple if more than 1 like
                                    if (post.likes_count > 1 && !types.includes('smart')) types.push('smart');
                                    if (types.length === 0) types.push('like');
                                    return types.slice(0, 2).map((t, idx) => (
                                        <GlassdoorIcon key={idx} type={t} size={14} />
                                    ));
                                })()}
                            </div>
                            <span className="p-reaction-count-v4">{post.likes_count}</span>
                        </div>
                    )}
                </div>
            </div>

            {isExpanded && (
                <div className="comment-section-v4 section-animate-in">
                    <div className="comment-input-area-v4">
                        <div className="avatar-initials-v4" style={{
                            width: '24px',
                            height: '24px',
                            backgroundImage: currentUserProfile?.avatar_url ? `url(${currentUserProfile.avatar_url})` : 'none',
                            backgroundColor: '#00a264',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                        }}>
                            {!currentUserProfile?.avatar_url && (currentUserProfile?.full_name || 'U').split(' ').map((n: any) => n[0]).join('')}
                        </div>
                        <input type="text" placeholder="Add a comment..." onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                onAddComment(post.id, (e.target as HTMLInputElement).value);
                                (e.target as HTMLInputElement).value = '';
                            }
                        }} />
                    </div>
                    <div className="comment-list-v4">
                        {(() => {
                            const tree = buildCommentTree(comments);
                            const visibleTree = isFullyExpanded ? tree : tree.slice(0, 3);
                            return visibleTree.map(root => renderComment(root));
                        })()}
                        {comments.filter(c => !c.parent_id).length > 3 && !isFullyExpanded && (
                            <button className="btn-view-all-v4" onClick={() => onToggleFullComments(post.id)}>
                                <span>View all comments</span>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6" /></svg>
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
