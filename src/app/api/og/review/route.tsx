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

        // Fetch channel info
        const { data: channel } = await supabase
            .from('channels')
            .select('id, name, average_rating, reviews_count')
            .eq('username', username)
            .maybeSingle();

        if (!channel) return new Response('Channel not found', { status: 404 });

        // Fetch reviews for this channel to find the specific one by slug
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

        const contentPreview = (review.content || '').length > 200
            ? (review.content || '').substring(0, 200) + '...'
            : (review.content || '');

        return new ImageResponse(
            (
                <div style={{
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#F3F4F6', // Professional gray background
                    fontFamily: 'sans-serif',
                }}>
                    {/* Main Review Card */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        width: '1000px',
                        height: '520px',
                        backgroundColor: 'white',
                        borderRadius: '32px',
                        padding: '60px',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.05)',
                        position: 'relative',
                    }}>
                        {/* Header: User & Stars */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px', width: '100%' }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <div style={{
                                    width: '72px',
                                    height: '72px',
                                    borderRadius: '36px',
                                    backgroundColor: '#00B67A',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontSize: '32px',
                                    fontWeight: '800',
                                    marginRight: '20px'
                                }}>
                                    {(review.profiles?.full_name?.[0] || 'U').toUpperCase()}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '28px', fontWeight: '800', color: '#111827' }}>
                                        {review.profiles?.full_name || review.profiles?.username}
                                    </span>
                                    <span style={{ fontSize: '18px', color: '#00B67A', fontWeight: '600' }}>✓ Verified Reviewer</span>
                                </div>
                            </div>

                            {/* Stars Section */}
                            <div style={{ display: 'flex' }}>
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <svg key={s} viewBox="0 0 24 24" fill={s <= review.rating ? "#00B67A" : "#E5E7EB"} width="42" height="42" style={{ marginLeft: '4px' }}>
                                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                    </svg>
                                ))}
                            </div>
                        </div>

                        {/* Review Content */}
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                            <div style={{
                                fontSize: '44px',
                                fontWeight: '900',
                                color: '#111827',
                                marginBottom: '20px',
                                lineHeight: '1.1',
                                letterSpacing: '-0.02em'
                            }}>
                                {review.title}
                            </div>
                            <div style={{
                                fontSize: '26px',
                                color: '#4B5563',
                                lineHeight: '1.5',
                                fontStyle: 'italic'
                            }}>
                                "{contentPreview}"
                            </div>
                        </div>

                        {/* Footer Section */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-end',
                            marginTop: '30px',
                            paddingTop: '30px',
                            borderTop: '2px solid #F3F4F6'
                        }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '16px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Reviewing on Jobin</span>
                                <span style={{ fontSize: '28px', fontWeight: '800', color: '#111827' }}>{channel.name}</span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <div style={{
                                    width: '44px',
                                    height: '44px',
                                    backgroundColor: '#00B67A',
                                    borderRadius: '10px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginRight: '14px'
                                }}>
                                    <span style={{ color: 'white', fontWeight: '900', fontSize: '26px' }}>J</span>
                                </div>
                                <span style={{ fontSize: '38px', fontWeight: '900', color: '#111827', letterSpacing: '-0.03em' }}>Jobin.az</span>
                            </div>
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
