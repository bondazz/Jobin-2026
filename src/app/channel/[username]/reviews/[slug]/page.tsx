import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import ReviewClient from './ReviewClient';

interface Props {
    params: Promise<{ username: string; slug: string }>;
}

async function getReviewData(username: string, slug: string) {
    const { data: channel } = await supabase
        .from('channels')
        .select('id, name, username, average_rating, reviews_count, avatar_url')
        .eq('username', username)
        .single();

    if (!channel) return null;

    const { data: reviews } = await supabase
        .from('channel_reviews')
        .select('*, profiles:author_id (*)')
        .eq('channel_id', channel.id);

    const review = reviews?.find((r: any) => {
        const reviewSlug = (r.title || '')
            .toLowerCase()
            .replace(/[^\w ]+/g, '')
            .replace(/ +/g, '-');
        return reviewSlug === slug;
    });

    return { review, channel };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { username, slug } = await params;
    const data = await getReviewData(username, slug);
    if (!data?.review) return { title: 'Review Not Found' };

    const { review, channel } = data;
    const title = `${review.title} - ${channel.name} Review | Jobin`;
    const description = review.content.substring(0, 160) + '...';
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://jobin.az';
    const ogImage = `${siteUrl}/api/og/review?username=${username}&slug=${slug}`;

    return {
        title,
        description,
        alternates: {
            canonical: `${siteUrl}/channel/${username}/reviews/${slug}`,
        },
        openGraph: {
            title,
            description,
            url: `${siteUrl}/channel/${username}/reviews/${slug}`,
            siteName: 'Jobin',
            images: [{ url: ogImage, width: 1200, height: 630 }],
            type: 'article',
            publishedTime: review.created_at,
            authors: [review.profiles?.full_name || username],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [ogImage],
        },
    };
}

export default async function Page({ params }: Props) {
    const { username, slug } = await params;
    const data = await getReviewData(username, slug);

    if (!data?.review) {
        return (
            <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
                Review not found.
            </div>
        );
    }

    const { review, channel } = data;

    // Structured Data (JSON-LD) for Google Review Snippet
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Review",
        "headline": review.title,
        "description": review.content.substring(0, 200),
        "datePublished": review.created_at,
        "author": {
            "@type": "Person",
            "name": review.profiles?.full_name || review.profiles?.username || 'User'
        },
        "reviewRating": {
            "@type": "Rating",
            "ratingValue": review.rating,
            "bestRating": "5",
            "worstRating": "1"
        },
        "itemReviewed": {
            "@type": "Organization",
            "name": channel.name,
            "image": (channel as any).avatar_url,
            "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": channel.average_rating || 0,
                "reviewCount": channel.reviews_count || 0
            }
        },
        "publisher": {
            "@type": "Organization",
            "name": "Jobin",
            "logo": {
                "@type": "ImageObject",
                "url": `${process.env.NEXT_PUBLIC_SITE_URL}/logo.png`
            }
        }
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <ReviewClient initialReview={review} />
        </>
    );
}
