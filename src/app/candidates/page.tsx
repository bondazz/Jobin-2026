"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { VerifiedBadge } from '@/components/common/VerifiedBadge';


export default function CandidatesPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [candidates, setCandidates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadCandidates = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('followers_count', { ascending: false });

            if (error) {
                console.error('Error loading candidates:', error);
            } else {
                setCandidates(data || []);
            }
            setLoading(false);
        };
        loadCandidates();
    }, []);

    const filteredCandidates = candidates.filter(c =>
        (c.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.work_info || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.bio || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="candidates-list-wrapper">
            <div className="candidates-hero">
                <div className="hero-blur-1"></div>
                <div className="hero-blur-2"></div>
                <div className="container-nav-wide">
                    <div className="hero-main-flex">
                        <div className="hero-text-side">
                            <h1>Meet the World's Best <span className="text-gradient">Candidates</span></h1>
                            <p>Discover top talent from global tech hubs. Connect, collaborate, and hire elite professionals.</p>

                            <div className="cand-search-container">
                                <div className="cand-search-box">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
                                    <input
                                        type="text"
                                        placeholder="Search by name, role, or skill..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <main className="container-nav-wide cand-grid-main">
                <div className="cand-filters-bar">
                    <div className="filter-group">
                        <button className="filter-btn active">All Talent</button>
                        <button className="filter-btn">Engineering</button>
                        <button className="filter-btn">Design</button>
                        <button className="filter-btn">Recruiting</button>
                    </div>
                    <div className="results-count">
                        Found <b>{filteredCandidates.length}</b> candidates
                    </div>
                </div>

                <div className="candidates-grid">
                    {loading ? (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '100px', fontSize: '18px', color: '#64748b' }}>
                            Discovering best talent...
                        </div>
                    ) : filteredCandidates.map((cand) => (
                        <Link key={cand.id} href={`/profile/${cand.username}`} className="cand-card-link">
                            <div className="cand-card-v3">
                                <div className="cand-card-inner">
                                    <div className="cand-avatar-wrap">
                                        <div className="avatar-frame">
                                            <img src={cand.avatar_url || (cand.username === 'Samir_Miriyev' ? '/profile.png' : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250')} alt={cand.full_name} />
                                        </div>
                                        <div className="cand-verified-badge">
                                            <VerifiedBadge size={18} />
                                        </div>

                                    </div>
                                    <div className="cand-info">
                                        <h3>{cand.full_name}</h3>
                                        <p className="cand-role">{cand.work_info}</p>
                                        <p className="cand-bio">{cand.bio}</p>
                                        <div className="cand-tags">
                                            {(cand.role || 'Professional').split(',').map((tag: string) => <span key={tag} className="cand-tag">{tag.trim()}</span>)}
                                        </div>
                                        <div className="cand-stats-footer">
                                            <div className="c-stat-item"><span>{cand.posts_count || 0}</span> Posts</div>
                                            <div className="c-stat-item"><span>{cand.followers_count >= 1000 ? (cand.followers_count / 1000).toFixed(1) + 'k' : cand.followers_count}</span> Followers</div>
                                            <div className="c-stat-item"><span>{cand.karma || 0}</span> Karma</div>
                                        </div>
                                    </div>
                                    <div className="cand-action-btn">
                                        View Profile
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </main>

            <footer className="cand-footer">
                <div className="container-nav-wide">
                    <p>© 2026 Jobin LLC. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
