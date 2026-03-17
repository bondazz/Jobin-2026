import { ImageResponse } from 'next/og';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hprjpwfvfviagckihfvv.supabase.co';
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'no-key-at-runtime';

        const supabase = createClient(supabaseUrl, supabaseAnonKey);

        const { searchParams } = new URL(request.url);
        const username = searchParams.get('username');
        const slug = searchParams.get('slug');

        if (!username || !slug) return new Response('Missing params', { status: 400 });

        // 1. Fetch channel
        const { data: channel } = await supabase
            .from('channels')
            .select('id, name, average_rating, reviews_count')
            .eq('username', username)
            .maybeSingle();

        if (!channel) return new Response('Channel not found', { status: 404 });

        // 2. Fetch reviews
        const { data: reviews } = await supabase
            .from('channel_reviews')
            .select('*, profiles:author_id (*)')
            .eq('channel_id', channel.id);

        const review = reviews?.find(r => {
            const reviewSlug = (r.title || '')
                .toLowerCase()
                .replace(/[^\w ]+/g, '')
                .replace(/ +/g, '-');
            return reviewSlug === slug;
        });

        if (!review) return new Response('Review not found', { status: 404 });

        const contentPreview = (review.content || '').length > 280
            ? (review.content || '').substring(0, 280) + '...'
            : (review.content || '');

        const trustGreen = "#00B67A";

        return new ImageResponse(
            (
                <div style={{
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: 'white',
                    padding: '80px',
                    fontFamily: 'sans-serif',
                }}>
                    {/* Review Text */}
                    <div style={{
                        display: 'flex',
                        fontSize: '48px',
                        color: '#1a1a1a',
                        fontWeight: '500',
                        lineHeight: '1.2',
                        marginBottom: '60px',
                        flexDirection: 'column',
                    }}>
                        <div style={{ display: 'flex' }}>
                            “{review.title} — {contentPreview}”
                        </div>
                    </div>

                    {/* Stars & Author Section */}
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '80px' }}>
                        <div style={{ display: 'flex' }}>
                            {[1, 2, 3, 4, 5].map((s) => (
                                <div key={s} style={{
                                    backgroundColor: s <= review.rating ? trustGreen : '#e5e7eb',
                                    width: '46px',
                                    height: '46px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginRight: '4px'
                                }}>
                                    <svg viewBox="0 0 24 24" fill="white" width="32" height="32">
                                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                    </svg>
                                </div>
                            ))}
                        </div>
                        <div style={{ fontSize: '32px', color: '#1a1a1a', marginLeft: '20px' }}>
                            by {review.profiles?.full_name || review.profiles?.username || 'User'}
                        </div>
                    </div>

                    {/* Divider Line */}
                    <div style={{ height: '2px', backgroundColor: '#eeeeee', width: '100%', marginTop: 'auto', marginBottom: '40px' }} />

                    {/* Footer Section */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '28px', color: '#1a1a1a' }}>
                            Rated {channel.average_rating?.toFixed(1) || '0.0'} / 5 | {channel.reviews_count?.toLocaleString() || '0'} reviews
                        </div>

                        {/* Jobin Logo Style Trustpilot */}
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <svg viewBox="0 0 24 24" fill={trustGreen} width="40" height="40" style={{ marginRight: '10px' }}>
                                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                            </svg>
                            <span style={{ fontSize: '38px', fontWeight: 'bold', color: '#1a1a1a', letterSpacing: '-1px' }}>Jobin</span>
                        </div>
                    </div>
                </div>
            ),
            {
                width: 1200,
                height: 630,
            }
        );
    } catch (e: any) {
        return new Response(`Error: ${e.message}`, { status: 500 });
    }
}
