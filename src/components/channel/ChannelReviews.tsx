"use client";

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { formatRelativeTime } from '@/utils/postHelpers';
import { StarIcon } from '@/components/common/StarIcon';
import { TrustpilotStars } from '@/components/common/TrustpilotStars';
import { TrustpilotStarSelector } from './TrustpilotStarSelector';
import { VerifiedBadge } from '@/components/common/VerifiedBadge';

interface Props {
    channelId: string;
    currentUserProfile: any;
    activeIdentity: any;
    initialReviews?: any[];
    initialStats?: { average: number; total: number };
    username?: string;
}

const generateSlug = (text: string) => {
    return text
        .toLowerCase()
        .replace(/[^\w ]+/g, '') // Remove non-alphanumeric/spaces
        .replace(/ +/g, '-')     // Spaces to dashes
        .substring(0, 60);       // Limit length
};

const getRatingColor = (rating: number) => {
    const r = Math.round(rating);
    if (r <= 1) return "#FF3722"; // Red
    if (r === 2) return "#FF8622"; // Orange
    if (r === 3) return "#FFCE00"; // Yellow
    if (r === 4) return "#73CF11"; // Light Green
    return "#00a264"; // Premium Green
};

export const ChannelReviews: React.FC<Props> = ({
    channelId,
    currentUserProfile,
    activeIdentity,
    initialReviews = [],
    initialStats = { average: 0, total: 0 },
    username
}) => {
    const [reviews, setReviews] = useState<any[]>(initialReviews);
    const [loading, setLoading] = useState(initialReviews.length === 0);
    const [submitting, setSubmitting] = useState(false);
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [userReview, setUserReview] = useState<any>(null);
    const [stats, setStats] = useState(initialStats);
    const formRef = useRef<HTMLDivElement>(null);

    const fetchReviews = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('channel_reviews')
            .select('*, profiles:author_id (*)')
            .eq('channel_id', channelId)
            .order('created_at', { ascending: false });

        if (!error && data) {
            setReviews(data);
            const total = data.length;
            const avg = total > 0 ? data.reduce((acc, r) => acc + r.rating, 0) / total : 0;
            setStats({ average: avg, total });

            // Note: We no longer auto-set userReview for editing here to allow multiple reviews & explicit edit click
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchReviews();
    }, [channelId]);

    const handleSubmit = async () => {
        if (!currentUserProfile || rating === 0) return;
        if (activeIdentity?.type !== 'profile') {
            alert("Only personal profiles can leave reviews.");
            return;
        }

        // Check rate limit: 3 reviews per channel per day
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const myReviewsToday = reviews.filter(r =>
            r.author_id === currentUserProfile.id &&
            new Date(r.created_at) >= today
        );

        if (!editingId && myReviewsToday.length >= 3) {
            alert("You've reached the limit of 3 reviews per day for this channel.");
            return;
        }

        setSubmitting(true);
        try {
            const reviewData: any = {
                channel_id: channelId,
                author_id: currentUserProfile.id,
                rating,
                title,
                content,
                updated_at: new Date().toISOString()
            };

            if (editingId) {
                reviewData.id = editingId;
            }

            const { error } = await supabase
                .from('channel_reviews')
                .upsert(reviewData);

            if (error) {
                console.error("Supabase Error:", error);
                alert(`Failed to submit review: ${error.message}`);
            } else {
                await fetchReviews();
                // Reset form
                setRating(0);
                setTitle("");
                setContent("");
                setEditingId(null);
            }
        } catch (err) {
            console.error("Submission Error:", err);
            alert("An unexpected error occurred while submitting.");
        } finally {
            setSubmitting(false);
        }
    };

    const startEdit = (review: any) => {
        setEditingId(review.id);
        setRating(review.rating);
        setTitle(review.title || "");
        setContent(review.content || "");
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this review?")) return;

        setSubmitting(true);
        try {
            const { error } = await supabase
                .from('channel_reviews')
                .delete()
                .eq('id', id);

            if (error) {
                alert("Failed to delete review.");
            } else {
                await fetchReviews();
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-8"></div>;

    const canReview = currentUserProfile && activeIdentity?.type === 'profile';

    return (
        <div className="channel-reviews-container">
            {/* Premium Stats Summary - Trustpilot Style */}
            <div className="tp-stats-container">
                <div className="tp-stats-main">
                    <div className="tp-stats-left">
                        <p className="tp-score-large">{stats.average.toFixed(1)}</p>
                        <h3 className="tp-score-title">
                            {stats.average >= 4.5 ? 'Excellent' :
                                stats.average >= 3.5 ? 'Great' :
                                    stats.average >= 2.5 ? 'Average' :
                                        stats.average >= 1.5 ? 'Poor' : 'Bad'}
                        </h3>
                        <div className="tp-score-stars">
                            <TrustpilotStars rating={stats.average} size={140} />
                        </div>
                        <p className="tp-score-count">
                            {stats.total >= 1000 ? `${(stats.total / 1000).toFixed(1)}K` : stats.total} reviews
                        </p>
                    </div>

                    <div className="tp-stats-right">
                        {[5, 4, 3, 2, 1].map(star => {
                            const count = reviews.filter(r => r.rating === star).length;
                            const percent = stats.total > 0 ? (count / stats.total) * 100 : 0;
                            return (
                                <div key={star} className="tp-row">
                                    <span className="tp-row-label">{star}-star</span>
                                    <div className="tp-row-bar-container">
                                        <div
                                            className="tp-row-bar-fill"
                                            style={{
                                                width: `${percent}%`,
                                                backgroundColor: getRatingColor(star)
                                            }}
                                        ></div>
                                    </div>
                                    <span className="tp-row-percent">{Math.round(percent)}%</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <hr className="tp-stats-divider" />
                <button className="tp-stats-info-btn" type="button">
                    How is the TrustScore calculated?
                </button>
            </div>

            {/* Submission Form */}
            <div className="review-form-card" ref={formRef}>
                {canReview ? (
                    <>
                        <h3 className="form-title">{editingId ? 'Update your review' : 'Rate this channel'}</h3>
                        <TrustpilotStarSelector
                            value={rating}
                            onChange={(val) => setRating(val)}
                        />
                        <input
                            className="review-title-input"
                            placeholder="Give your review a title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                        <textarea
                            className="review-textarea"
                            placeholder="Share your experience with this channel..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                        />
                        <div className="form-actions">
                            {editingId && (
                                <button
                                    className="btn-delete-review"
                                    onClick={() => {
                                        setEditingId(null);
                                        setRating(0);
                                        setTitle("");
                                        setContent("");
                                    }}
                                >
                                    Cancel
                                </button>
                            )}
                            <button
                                className="btn-submit-review"
                                onClick={handleSubmit}
                                disabled={submitting || rating === 0}
                            >
                                {submitting ? 'Submitting...' : (editingId ? 'Update Review' : 'Post Review')}
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="login-prompt-card">
                        {!currentUserProfile ? (
                            <p>Please <Link href="/login" className="text-primary font-bold">login</Link> to leave a review.</p>
                        ) : (
                            <p>Switch to your <b>personal profile</b> to leave a review.</p>
                        )}
                    </div>
                )}
            </div>

            {/* Reviews List */}
            <div className="reviews-list">
                {reviews.length === 0 ? (
                    <div className="empty-reviews">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5">
                            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                        </svg>
                        <p>No reviews yet. Be the first to share your thoughts!</p>
                    </div>
                ) : (
                    reviews.map(review => (
                        <div key={review.id} className="review-card">
                            <div className="review-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <Link
                                    href={`/profile/${review.profiles?.username}`}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: '12px',
                                        textDecoration: 'none',
                                        color: '#1e293b',
                                        border: 'none'
                                    }}
                                >
                                    <div style={{
                                        width: '44px',
                                        height: '44px',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: '#FDE2E4',
                                        color: '#E07A5F',
                                        backgroundImage: review.profiles?.avatar_url ? `url(${review.profiles.avatar_url})` : 'none',
                                        backgroundSize: 'cover',
                                        fontWeight: 800,
                                        fontSize: '15px',
                                        flexShrink: 0,
                                        textDecoration: 'none !important'
                                    }}>
                                        {!review.profiles?.avatar_url && (review.profiles?.full_name || review.profiles?.username || '?').substring(0, 1).toUpperCase()}
                                    </div>
                                    <span style={{
                                        fontWeight: 700,
                                        fontSize: '16px',
                                        color: '#1e293b',
                                        letterSpacing: '-0.02em',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        textDecoration: 'none'
                                    }}>
                                        {review.profiles?.full_name || review.profiles?.username}
                                        {review.profiles?.is_verified && <VerifiedBadge size={14} />}
                                    </span>
                                </Link>
                                <div className="review-header-right">
                                    <span className="review-date">
                                        {new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                    {currentUserProfile?.id === review.author_id && (
                                        <button className="btn-edit-review" onClick={() => startEdit(review)} title="Edit review">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="review-rating-display">
                                <TrustpilotStars rating={review.rating} size={100} />
                            </div>

                            {review.title && (
                                <Link
                                    href={`/channel/${username}/reviews/${generateSlug(review.title)}`}
                                    style={{ textDecoration: 'none' }}
                                >
                                    <h4 className="review-item-title">
                                        {review.title.length > 60 ? review.title.substring(0, 60) + '...' : review.title}
                                    </h4>
                                </Link>
                            )}

                            {review.content && (
                                <p className="review-content">{review.content}</p>
                            )}

                            <div className="review-footer">
                                <button className="btn-share-review">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" /></svg>
                                    Share
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <style jsx>{`
                .channel-reviews-container {
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                    padding: 24px 0;
                }
                .tp-stats-container {
                    background: #fff;
                    border: 1px solid #f1f5f9;
                    border-radius: 4px;
                    padding: 24px;
                    margin-bottom: 32px;
                }
                .tp-stats-main {
                    display: grid;
                    grid-template-columns: 240px 1fr;
                    gap: 48px;
                    align-items: center;
                }
                @media (max-width: 768px) {
                    .tp-stats-main { grid-template-columns: 1fr; gap: 32px; }
                }
                .tp-stats-left {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                }
                .tp-score-large {
                    font-size: 40px;
                    font-weight: 700;
                    margin: 0;
                    line-height: 1.1;
                    color: #1e293b;
                }
                .tp-score-title {
                    font-size: 20px;
                    font-weight: 700;
                    margin: 4px 0 12px 0;
                    color: #1e293b;
                }
                .tp-score-stars {
                    display: flex;
                    gap: 3px;
                    margin-bottom: 12px;
                }
                .tp-score-count {
                    font-size: 15px;
                    color: #64748b;
                    margin: 0;
                }
                .tp-stats-right {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                .tp-row {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }
                .tp-row-label {
                    font-size: 14px;
                    color: #1e293b;
                    width: 50px;
                    flex-shrink: 0;
                    font-weight: 500;
                }
                .tp-row-bar-container {
                    flex: 1;
                    height: 8px;
                    background: #f1f5f9;
                    border-radius: 2px;
                    overflow: hidden;
                }
                .tp-row-bar-fill {
                    height: 100%;
                    transition: width 0.8s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .tp-row-percent {
                    font-size: 14px;
                    color: #64748b;
                    width: 40px;
                    text-align: right;
                    font-weight: 500;
                }
                .tp-stats-divider {
                    border: 0;
                    border-top: 1px solid #f1f5f9;
                    margin: 24px 0 16px 0;
                }
                .tp-stats-info-btn {
                    width: 100%;
                    background: none;
                    border: none;
                    padding: 8px;
                    cursor: pointer;
                    text-align: center;
                    font-size: 14px;
                    color: #64748b;
                    text-decoration: underline;
                    font-weight: 500;
                }
                .tp-stats-info-btn:hover {
                    color: #1e293b;
                }
                .review-form-card {
                    background: #fff;
                    border: 1px solid rgba(226, 232, 240, 0.8);
                    border-radius: 24px;
                    padding: 24px;
                    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
                }
                .form-title {
                    font-size: 18px;
                    font-weight: 800;
                    color: #1e293b;
                    margin-bottom: 16px;
                }
                .star-selector-wrapper {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    margin-bottom: 24px;
                }
                .star-selector-group {
                    display: flex;
                    gap: 4px;
                }
                .star-radio-container {
                    position: relative;
                }
                .star-radio-input {
                    position: absolute;
                    opacity: 0;
                    width: 0;
                    height: 0;
                }
                .star-radio-label {
                    display: block;
                    cursor: pointer;
                }
                .star-radio-input:focus-visible + .star-radio-label {
                    outline: 2px solid #00a264;
                    outline-offset: 4px;
                    border-radius: 6px;
                }
                .rating-text-feedback {
                    min-width: 100px;
                }
                .rating-label-hint {
                    font-weight: 800;
                    font-size: 18px;
                    animation: fadeIn 0.2s ease-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateX(-5px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                .review-textarea {
                    width: 100%;
                    min-height: 100px;
                    padding: 16px;
                    border: 1.5px solid #f1f5f9;
                    border-radius: 16px;
                    font-size: 15px;
                    resize: vertical;
                    transition: border-color 0.2s;
                    margin-bottom: 16px;
                    outline: none;
                }
                .review-textarea:focus {
                    border-color: #00a264;
                }
                .form-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                }
                .btn-submit-review {
                    background: #00a264;
                    color: white;
                    padding: 10px 24px;
                    border-radius: 24px;
                    font-weight: 700;
                    font-size: 14px;
                    transition: all 0.2s;
                }
                .btn-submit-review:hover:not(:disabled) {
                    background: #008f58;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0, 162, 100, 0.2);
                }
                .btn-submit-review:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
                .btn-delete-review {
                    color: #ef4444;
                    font-weight: 700;
                    font-size: 14px;
                    padding: 10px 16px;
                }
                .login-prompt-card {
                    background: #f8fafc;
                    border: 1.5px dashed #e2e8f0;
                    border-radius: 20px;
                    padding: 20px;
                    text-align: center;
                    color: #64748b;
                }
                .reviews-list {
                    display: flex;
                    flex-direction: column;
                    border: 1px solid #f1f5f9;
                    border-radius: 12px;
                    overflow: hidden;
                    background: #fff;
                }
                .review-card {
                    background: #fff;
                    padding: 24px;
                    border-bottom: 1px solid #f1f5f9;
                    transition: background-color 0.2s ease;
                    font-family: inherit;
                }
                .review-card:last-child {
                    border-bottom: none;
                }
                .review-card:hover {
                    background-color: #f8fafc;
                }
                .review-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 16px;
                }
                .brand-author-wrapper, 
                .brand-author-wrapper:hover, 
                .brand-author-wrapper:active, 
                .brand-author-wrapper:visited,
                .brand-author-wrapper:focus {
                    display: flex !important;
                    flex-direction: row !important;
                    align-items: center !important;
                    gap: 12px !important;
                    text-decoration: none !important;
                    border: none !important;
                    outline: none !important;
                    color: #1e293b !important;
                }
                .brand-avatar-img {
                    width: 44px !important;
                    height: 44px !important;
                    border-radius: 50% !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    background-color: #f1f5f9 !important;
                    overflow: hidden !important;
                    flex-shrink: 0 !important;
                    text-decoration: none !important;
                    border: none !important;
                }
                .brand-author-name {
                    font-size: 16px !important;
                    font-weight: 700 !important;
                    color: #1e293b !important;
                    letter-spacing: -0.01em !important;
                    display: flex !important;
                    align-items: center !important;
                    gap: 6px !important;
                    text-decoration: none !important;
                    border: none !important;
                    line-height: normal !important;
                }
                .brand-author-name:hover {
                    text-decoration: none !important;
                }
                .review-header-right {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .review-date {
                    font-size: 14px;
                    color: #94a3b8;
                    font-weight: 400;
                }
                .btn-edit-review {
                    background: none;
                    border: none;
                    color: #94a3b8;
                    cursor: pointer;
                    padding: 4px;
                    border-radius: 4px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }
                .btn-edit-review:hover {
                    background: #f1f5f9;
                    color: #1e293b;
                }
                .review-rating-display {
                    display: flex;
                    gap: 3px;
                    margin-bottom: 20px;
                }
                .review-item-title {
                    font-size: 18px;
                    font-weight: 800;
                    color: #1e293b;
                    margin: 0 0 10px 0;
                    letter-spacing: -0.02em;
                    line-height: 1.3;
                }
                .review-content {
                    font-size: 15px;
                    line-height: 1.6;
                    color: #475569;
                    margin: 0 0 16px 0;
                    white-space: pre-wrap;
                    letter-spacing: -0.01em;
                }
                .review-footer {
                    display: flex;
                    gap: 16px;
                }
                .btn-share-review {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    background: none;
                    border: none;
                    padding: 4px 0;
                    color: #64748b;
                    font-size: 13.5px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: color 0.1s;
                }
                .btn-share-review:hover {
                    color: #1e293b;
                    text-decoration: underline;
                }
                .review-title-input {
                    width: 100%;
                    padding: 14px 16px;
                    border: 1.5px solid #f1f5f9;
                    border-radius: 12px;
                    font-size: 15px;
                    font-weight: 600;
                    margin-bottom: 12px;
                    outline: none;
                    transition: border-color 0.2s;
                }
                .review-title-input:focus {
                    border-color: #00a264;
                }
                .empty-reviews {
                    text-align: center;
                    padding: 60px 20px;
                    color: #94a3b8;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 12px;
                }
            `}</style>
        </div>
    );
};
