import { ImageResponse } from 'next/og';
import { createClient } from '@supabase/supabase-js';

// Switching to Nodejs for maximum stability in heavy tasks
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const username = searchParams.get('username');
        const slug = searchParams.get('slug');

        if (!username || !slug) {
            return new Response('Missing parameters', { status: 400 });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hprjpwfvfviagckihfvv.supabase.co';
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'no-key';
        const supabase = createClient(supabaseUrl, supabaseAnonKey);

        // Fetch channel
        const { data: channel, error: chError } = await supabase
            .from('channels')
            .select('id, name, average_rating, reviews_count')
            .eq('username', username)
            .maybeSingle();

        if (!channel || chError) {
            return new Response(`Channel not found: ${username}`, { status: 404 });
        }

        // Fetch reviews specifically by channel_id
        const { data: reviews, error: revError } = await supabase
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

        if (!review || revError) {
            return new Response(`Review not found for slug: ${slug}`, { status: 404 });
        }

        const trustGreen = "#00B67A";
        const content = review.content || '';
        const displayContent = content.length > 250 ? content.substring(0, 250) + '...' : content;
        const authorName = review.profiles?.full_name || review.profiles?.username || 'User';

        return new ImageResponse(
            (
                <div style={{
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: '#ffffff',
                    padding: '80px',
                    fontFamily: 'sans-serif',
                }}>
                    {/* Review Title & Content */}
                    <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '40px' }}>
                        <div style={{ fontSize: '46px', fontWeight: 'bold', color: '#1a1a1a', marginBottom: '20px', display: 'flex' }}>
                            “{review.title}”
                        </div>
                        <div style={{ fontSize: '30px', color: '#4a4a4a', lineHeight: '1.4', display: 'flex' }}>
                            {displayContent}
                        </div>
                    </div>

                    {/* Stars Grid */}
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '60px' }}>
                        <div style={{ display: 'flex' }}>
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} style={{
                                    backgroundColor: i <= review.rating ? trustGreen : '#D1D5DB',
                                    width: '44px',
                                    height: '44px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginRight: '6px'
                                }}>
                                    <svg width="30" height="30" viewBox="0 0 24 24" fill="white">
                                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                    </svg>
                                </div>
                            ))}
                        </div>
                        <div style={{ fontSize: '28px', color: '#1a1a1a', marginLeft: '20px', display: 'flex' }}>
                            by {authorName}
                        </div>
                    </div>

                    {/* Bottom Footer Border */}
                    <div style={{ width: '100%', height: '1px', backgroundColor: '#e5e7eb', marginTop: 'auto', marginBottom: '30px' }} />

                    {/* Footer Info */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <div style={{ fontSize: '24px', color: '#6b7280', display: 'flex' }}>
                            Rated {channel.average_rating?.toFixed(1)} / 5 | {channel.reviews_count} reviews
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <div style={{ width: '36px', height: '36px', backgroundColor: trustGreen, borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '10px' }}>
                                <span style={{ color: 'white', fontWeight: 'bold', fontSize: '24px' }}>J</span>
                            </div>
                            <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#111827' }}>Jobin.az</span>
                        </div>
                    </div>
                </div>
            ),
            {
                width: 1200,
                height: 630,
            }
        );
    } catch (err: any) {
        console.error('OG Image generation error:', err);
        return new Response(`OG Generation Failed: ${err.message}`, { status: 500 });
    }
}
