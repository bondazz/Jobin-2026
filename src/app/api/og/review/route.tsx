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

        // Fetch reviews
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
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <svg width="112" height="40" viewBox="0 0 316 113" style={{ display: 'flex' }}>
                                    <path d="M0 0 C8.6531892 6.88321868 13.95921044 14.1151792 15.75 25.1875 C16.68071969 34.33957691 13.96961497 43.68078591 8.5625 51.125 C1.72013294 59.07615149 -6.78291348 63.60835792 -17.17578125 64.5390625 C-28.42386157 65.06911669 -37.64144144 63.19540324 -46.625 55.9375 C-53.68288868 49.18839395 -58.40375688 41.4158951 -58.63110352 31.47900391 C-58.59579488 19.66897125 -56.13779471 12.13774816 -47.89453125 3.45703125 C-33.88568668 -8.56533019 -15.64198305 -8.72341362 0 0 Z M-31.77734375 18.65234375 C-35.31988095 22.85204727 -36.63026738 25.48047035 -36.51953125 31.02734375 C-35.95731065 35.53325668 -34.0855781 38.74555603 -30.51953125 41.546875 C-26.07255663 44.13872448 -22.34846052 44.6766015 -17.29296875 43.7890625 C-12.68012077 42.43078604 -10.75593024 40.04758141 -8.375 36 C-6.7085671 30.35264406 -7.24603099 25.84506503 -9.3125 20.375 C-12.07160817 17.25987787 -15.32756785 15.53513024 -19.25 14.1875 C-24.19254093 14.1875 -28.1805364 15.20272033 -31.77734375 18.65234375 Z " fill="#00A163" transform="translate(106.25,8.8125)" />
                                    <path d="M0 0 C39.97142857 0 39.97142857 0 47 6 C52.00290712 11.67897565 52.38375622 15.29656569 52.3671875 22.77734375 C51.84420755 27.36732732 50.41338528 29.01328788 47 32 C47.42152344 32.45890625 47.84304687 32.9178125 48.27734375 33.390625 C48.82519531 34.00421875 49.37304688 34.6178125 49.9375 35.25 C50.48277344 35.85328125 51.02804688 36.4565625 51.58984375 37.078125 C54.93760624 41.64072651 54.53546359 47.58328137 54 53 C52.46273943 59.67778159 49.87873539 63.88188665 44.29296875 67.84375 C30.67610473 74.71017547 14.57471277 71 0 71 C0 47.57 0 24.14 0 0 Z M22 18 C22 20.31 22 22.62 22 25 C26.455 24.505 26.455 24.505 31 24 C31.33 22.68 31.66 21.36 32 20 C28.3558226 17.5705484 26.28758728 17.83820425 22 18 Z M22 46 C22 48.64 22 51.28 22 54 C23.45792884 54.05399736 24.91642712 54.09279177 26.375 54.125 C27.59316406 54.15980469 27.59316406 54.15980469 28.8359375 54.1953125 C31.21342243 54.21370051 31.21342243 54.21370051 33 52 C33 50.68 33 49.36 33 48 C29.12315913 46.80712589 26.08378077 46 22 46 Z " fill="#00A163" transform="translate(129,3)" />
                                    <path d="M0 0 C4.0247819 2.01239095 7.03239349 4.44074308 10.375 7.375 C11.61576474 8.45196196 12.85665405 9.52878043 14.09765625 10.60546875 C14.73590332 11.16153809 15.37415039 11.71760742 16.03173828 12.29052734 C19.27597911 15.10821207 22.54560054 17.89615648 25.8125 20.6875 C31.84581801 25.84581801 31.84581801 25.84581801 33 27 C33.33 18.09 33.66 9.18 34 0 C41.59 0 49.18 0 57 0 C57.16328108 23.67575603 56.5523274 47.33218331 56 71 C54.56523834 70.05442273 53.1319251 69.10664751 51.69921875 68.15795898 C50.90088623 67.63040512 50.10255371 67.10285126 49.2800293 66.55931091 C46.34612401 64.55281453 43.69972316 62.37601277 41 60.0625 C36.09544757 55.8731948 31.11245283 51.9763522 26 48 C25.67 55.59 25.34 63.18 25 71 C16.75 71 8.5 71 0 71 C0 47.57 0 24.14 0 0 Z " fill="#00A163" transform="translate(223,3)" />
                                    <path d="M0 0 C7.92 0 15.84 0 24 0 C24.09069256 9.84956097 24.16394067 19.69884053 24.20724869 29.54872608 C24.22804377 34.12338194 24.256212 38.6977351 24.30175781 43.2722168 C24.3455061 47.69428635 24.36919773 52.11606638 24.37950897 56.5383358 C24.38684871 58.21789794 24.40118034 59.89744584 24.42292023 61.57688332 C24.58517284 74.64137794 23.40114447 86.09948758 14 96 C8.89586046 100.74803678 3.71340992 103.26667258 -3 105 C-3.86625 105.226875 -4.7325 105.45375 -5.625 105.6875 C-8.72501547 106.09539677 -11.87326437 106 -15 106 C-15 98.74 -15 91.48 -15 84 C-10.41015625 83.12109375 -10.41015625 83.12109375 -5.8203125 82.2421875 C-2.7737139 81.27799018 -2.7737139 81.27799018 -1.84365845 78.39523315 C-0.90841857 74.63143815 -0.72032662 71.3123357 -0.68115234 67.43408203 C-0.67110672 66.70168808 -0.6610611 65.96929413 -0.65071106 65.21470642 C-0.62000991 62.81241587 -0.60288069 60.41023609 -0.5859375 58.0078125 C-0.5672153 56.33485978 -0.54764111 54.66191639 -0.5272522 52.98898315 C-0.47603602 48.59966551 -0.4363542 44.21031728 -0.39910889 39.82086182 C-0.35900314 35.33622742 -0.30794084 30.85171908 -0.2578125 26.3671875 C-0.1611777 17.57820497 -0.0777467 8.78916993 0 0 Z " fill="#00A163" transform="translate(18,3)" />
                                    <path d="M0 0 C7.59 0 15.18 0 23 0 C23 23.43 23 46.86 23 71 C15.41 71 7.82 71 0 71 C0 47.57 0 24.14 0 0 Z " fill="#00A263" transform="translate(191,3)" />
                                    <path d="M0 0 C3.84262325 1.67070576 5.4730663 3.1410221 7 7 C7.22213813 11.20581532 6.67253041 14.87911598 4.5 18.5 C0.80006977 20.71995814 -2.71198667 21.19908633 -7 21 C-9.95478038 19.80551431 -11.37655368 18.80157384 -13.3125 16.3125 C-14.34258338 12.84767407 -14.5914722 9.54883321 -14 6 C-10.25014665 0.12522975 -6.78149684 -0.72891329 0 0 Z " fill="#00A163" transform="translate(307,53)" />
                                </svg>
                                <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#00A163', marginLeft: '5px', alignSelf: 'flex-end', marginBottom: '4px' }}>Score</span>
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
    } catch (err: any) {
        console.error('OG Image generation error:', err);
        return new Response(`OG Generation Failed: ${err.message}`, { status: 500 });
    }
}
