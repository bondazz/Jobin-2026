"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useChannel } from '../../layout';
import { TrustpilotStars } from '@/components/common/TrustpilotStars';
import { VerifiedBadge } from '@/components/common/VerifiedBadge';
import Link from 'next/link';

export default function ReviewClient({ initialReview }: { initialReview: any }) {
    const params = useParams();
    const router = useRouter();
    const pathname = usePathname();
    const { username, slug } = params as { username: string, slug: string };
    const { channel, currentUserProfile, addToast } = useChannel();

    const [review, setReview] = useState<any>(initialReview);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const handleShare = () => {
        const url = typeof window !== 'undefined' ? window.location.href : '';
        navigator.clipboard.writeText(url);
        if (addToast) {
            addToast('Link copied to clipboard!', 'success');
        } else {
            alert('Link copied to clipboard!');
        }
    };

    if (!review) return <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>Review not found.</div>;

    const channelName = channel?.name || username;

    return (
        <div style={{ padding: '0 20px 20px 20px' }}>
            {/* Breadcrumb for SEO and Navigation */}
            <nav aria-label="Breadcrumb" style={{ marginBottom: '20px', marginTop: '12px' }}>
                <ol
                    itemScope
                    itemType="https://schema.org/BreadcrumbList"
                    style={{
                        display: 'flex',
                        listStyle: 'none',
                        padding: 0,
                        margin: 0,
                        fontSize: '11.5px',
                        fontWeight: '600',
                        color: '#94a3b8',
                        alignItems: 'center',
                        gap: '6px'
                    }}
                >
                    <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg>
                        <Link itemProp="item" href="/community" style={{ color: 'inherit', textDecoration: 'none' }}>
                            <span itemProp="name">Community</span>
                        </Link>
                        <meta itemProp="position" content="1" />
                    </li>
                    <li style={{ opacity: 0.4, display: 'flex' }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M9 18l6-6-6-6" /></svg>
                    </li>
                    <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                        <Link itemProp="item" href={`/channel/${username}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                            <span itemProp="name">{channelName}</span>
                        </Link>
                        <meta itemProp="position" content="2" />
                    </li>
                    <li style={{ opacity: 0.4, display: 'flex' }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M9 18l6-6-6-6" /></svg>
                    </li>
                    <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <svg aria-hidden="true" viewBox="0 0 16 16" fill="inherit" style={{ fill: '#00b67a' }} xmlns="http://www.w3.org/2000/svg" width="13px" height="13px" role="img"><path fillRule="evenodd" clipRule="evenodd" d="M9.88 6.225H16l-4.929 3.504-3.047 2.149-4.953 3.504L4.952 9.73 0 6.225h6.119L8 .572l1.881 5.653Zm1.596 4.812L8 11.9l4.929 3.527-1.453-4.392Z"></path></svg>
                        <Link itemProp="item" href={`/channel/${username}/reviews`} style={{ color: 'inherit', textDecoration: 'none' }}>
                            <span itemProp="name">Reviews</span>
                        </Link>
                        <meta itemProp="position" content="3" />
                    </li>
                    <li style={{ opacity: 0.4, display: 'flex' }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M9 18l6-6-6-6" /></svg>
                    </li>
                    <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /></svg>
                        <span itemProp="name" style={{ color: '#64748b', fontWeight: '800' }}>
                            {review.title.length > 20 ? review.title.substring(0, 20) + '...' : review.title}
                        </span>
                        <meta itemProp="position" content="4" />
                    </li>
                </ol>
            </nav>

            <div style={{ marginBottom: '16px' }}>
                <Link
                    href={`/channel/${username}/reviews`}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '13.5px',
                        fontWeight: '700',
                        color: '#00a264',
                        textDecoration: 'none',
                        transition: 'all 0.2s'
                    }}
                    className="back-link-hover"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                    Back to all reviews
                </Link>
            </div>

            <div className="review-card" id="review-card-screenshot" style={{
                background: '#fff',
                borderRadius: '20px',
                padding: '32px',
                border: '1px solid #f1f5f9',
                boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div className="review-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '50%',
                            backgroundImage: review.profiles?.avatar_url ? `url(${review.profiles.avatar_url})` : 'none',
                            backgroundColor: '#FDE2E4',
                            backgroundSize: 'cover',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            color: '#E07A5F',
                            fontSize: '16px'
                        }}>
                            {!review.profiles?.avatar_url && (review.profiles?.full_name || review.profiles?.username || '?').substring(0, 1).toUpperCase()}
                        </div>
                        <div>
                            <div style={{ fontWeight: 800, fontSize: '15.5px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                {review.profiles?.full_name || review.profiles?.username}
                                {review.profiles?.is_verified && <VerifiedBadge size={14} />}
                            </div>
                            <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                                Reviewed on {new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ marginBottom: '18px' }}>
                    <TrustpilotStars rating={review.rating} size={90} />
                </div>

                <h1 style={{ fontSize: '22px', fontWeight: '900', color: '#1e293b', marginBottom: '12px', letterSpacing: '-0.02em', lineHeight: '1.2' }}>
                    {review.title}
                </h1>

                <div style={{ fontSize: '15px', lineHeight: '1.6', color: '#475569', whiteSpace: 'pre-wrap', marginBottom: '24px' }}>
                    {review.content}
                </div>

                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '18px', display: 'flex', gap: '12px' }}>
                    <button
                        onClick={handleShare}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            background: 'transparent', border: '1.5px solid #f1f5f9',
                            padding: '8px 16px', borderRadius: '30px',
                            fontSize: '13px', fontWeight: '700', color: '#64748b', cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                        className="share-btn-simple-hover"
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" /></svg>
                        Share
                    </button>
                </div>
            </div>

            <style jsx>{`
                .back-link-hover:hover {
                    color: #008a54 !important;
                    text-decoration: underline !important;
                }
                .share-btn-simple-hover:hover {
                    background: #f8fafc !important;
                    border-color: #e2e8f0 !important;
                    color: #1e293b !important;
                }
            `}</style>
        </div>
    );
}
