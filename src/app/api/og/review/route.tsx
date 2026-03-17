import { ImageResponse } from 'next/og';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hprjpwfvfviagckihfvv.supabase.co';
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
            return new Response('Supabase credentials missing', { status: 500 });
        }

        const supabase = createClient(supabaseUrl, supabaseAnonKey);

        const { searchParams } = new URL(request.url);
        const username = searchParams.get('username');
        const slug = searchParams.get('slug');

        if (!username || !slug) return new Response('Missing params', { status: 400 });

        // Fetch channel with rating info
        const { data: channel } = await supabase
            .from('channels')
            .select('id, name, average_rating, reviews_count')
            .eq('username', username)
            .single();

        if (!channel) return new Response('Channel not found', { status: 404 });

        // Fetch review
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

        const ratingColor = "#00B67A"; // Trustpilot style green

        return new ImageResponse(
            (
                <div
                    style={{
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        backgroundColor: 'white', // Pure white background for the entire image
                        padding: '80px',
                        fontFamily: 'sans-serif',
                        position: 'relative'
                    }}
                >
                    {/* Content Section */}
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
                        <div style={{
                            fontSize: '42px',
                            fontWeight: '600',
                            color: '#1a1a1a',
                            lineHeight: '1.3',
                            marginBottom: '32px',
                            letterSpacing: '-0.01em'
                        }}>
                            "{review.title} - {review.content.length > 220 ? review.content.substring(0, 220) + '...' : review.content}"
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <div style={{ display: 'flex', gap: '5px' }}>
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <div key={s} style={{
                                        backgroundColor: s <= review.rating ? ratingColor : '#e5e7eb',
                                        width: '40px',
                                        height: '40px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}>
                                        <svg viewBox="0 0 24 24" fill="white" width="30" height="30">
                                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                        </svg>
                                    </div>
                                ))}
                            </div>
                            <div style={{ fontSize: '26px', color: '#1a1a1a', fontWeight: '500', marginLeft: '12px' }}>
                                by {review.profiles?.full_name || review.profiles?.username}
                            </div>
                        </div>
                    </div>

                    {/* Bottom Section (Fixed Height Footer) */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        marginTop: 'auto'
                    }}>
                        <div style={{ height: '2px', backgroundColor: '#f3f4f6', width: '100%', marginBottom: '40px' }} />

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontSize: '22px', color: '#6b7280', fontWeight: '500' }}>
                                Rated {channel.average_rating?.toFixed(1) || '0.0'} / 5 | {channel.reviews_count || 0} reviews
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {/* Jobin Logo */}
                                <div style={{ width: '32px', height: '32px', backgroundColor: '#00b67a', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <span style={{ color: 'white', fontWeight: '900', fontSize: '20px' }}>J</span>
                                </div>
                                <span style={{ fontSize: '30px', fontWeight: '800', color: '#1a1a1a', letterSpacing: '-0.03em' }}>Jobin</span>
                            </div>
                        </div>
                    </div>
                </div>
            ),
            {
                width: 1200,
                height: 630, // Using standard 630 (close to 627) for stability
            }
        );
    } catch (e: any) {
        return new Response(`Error: ${e.message}`, { status: 500 });
    }
}
