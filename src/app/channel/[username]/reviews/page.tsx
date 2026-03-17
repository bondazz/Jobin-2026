import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import ReviewsPageClient from './ReviewsPageClient';

const getRatingLabel = (rating: number) => {
    if (rating >= 4.5) return 'Excellent';
    if (rating >= 3.5) return 'Great';
    if (rating >= 2.5) return 'Average';
    if (rating >= 1.5) return 'Poor';
    return 'Bad';
};

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
    const { username: slug } = await params;

    const { data: channel } = await supabase
        .from('channels')
        .select('*')
        .ilike('username', slug)
        .maybeSingle();

    if (!channel) return { title: 'Channel Not Found' };

    const name = channel.name;
    const count = channel.reviews_count || 0;
    const avg = (channel.average_rating || 0).toFixed(1);
    const label = getRatingLabel(Number(avg));
    const siteName = 'Jobin';
    const domain = 'jobin.com';

    const title = `${name} Reviews | Read Customer Service Reviews of ${name}`;
    const description = `What’s your ${name} experience? ${count} people have already shared their thoughts. Add your voice to the community, give your stars, and impact our services!`;
    const ogTitle = `${name} is rated "${label}" with ${avg} / 5 on ${siteName}`;
    const ogDescription = `Is ${name} worth it? Join ${count} voices and share your ${siteName}Score today. Your honest review helps the community. Click to rate and see what others are saying!`;
    const canonical = `https://${domain}/channel/${channel.username}/reviews`;
    const imageUrl = channel.avatar_url || '';

    return {
        title: title,
        description: description,
        alternates: {
            canonical: canonical,
        },
        openGraph: {
            siteName: siteName,
            locale: 'en_US',
            title: ogTitle,
            url: canonical,
            description: ogDescription,
            images: [
                {
                    url: imageUrl,
                    width: 1080,
                    height: 1080,
                    alt: name,
                },
            ],
        },
        twitter: {
            card: 'summary_large_image',
            site: `@${siteName.toLowerCase()}`,
            title: ogTitle,
            description: ogDescription,
            images: [imageUrl],
        },
        other: {
            'og:type': 'website'
        }
    };
}

export default async function ReviewsPage({ params }: { params: Promise<{ username: string }> }) {
    const { username: slug } = await params;

    // SSR Fetching
    const { data: channel } = await supabase
        .from('channels')
        .select('*')
        .ilike('username', slug)
        .maybeSingle();

    if (!channel) return null;

    const { data: reviews } = await supabase
        .from('channel_reviews')
        .select('*, profiles:author_id (*)')
        .eq('channel_id', channel.id)
        .order('created_at', { ascending: false })
        .limit(20);

    const initialReviews = reviews || [];
    const initialStats = {
        average: channel.average_rating || 0,
        total: channel.reviews_count || 0
    };

    return <ReviewsPageClient initialReviews={initialReviews} initialStats={initialStats} />;
}
