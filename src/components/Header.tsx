"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

const navLinks = [
    { name: "Community", href: "/community" },
    { name: "Jobs", href: "/jobs" },
    { name: "Companies", href: "/companies" },
    { name: "Candidates", href: "/candidates" },
];

export default function Header() {
    const [scrolled, setScrolled] = useState(false);
    const pathname = usePathname();
    const [user, setUser] = useState<any>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [profileSlug, setProfileSlug] = useState<string | null>(null);

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const currentUser = session?.user ?? null;
            setUser(currentUser);

            if (currentUser) {
                // Fetch the latest profile slug from database
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('username')
                    .eq('id', currentUser.id)
                    .maybeSingle();

                if (profile) {
                    setProfileSlug(profile.username);
                } else {
                    // Fallback to metadata or email
                    setProfileSlug(currentUser.user_metadata?.username || currentUser.email?.split('@')[0]);
                }
            }
        };
        fetchUser();

        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            if (currentUser) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('username')
                    .eq('id', currentUser.id)
                    .maybeSingle();

                if (profile) {
                    setProfileSlug(profile.username);
                } else {
                    // Fallback on auth change too
                    setProfileSlug(currentUser.user_metadata?.username || currentUser.email?.split('@')[0]);
                }
            } else {
                setProfileSlug(null);
            }
        });

        return () => authListener.subscription.unsubscribe();
    }, []);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 0);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close mobile menu on route change
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [pathname]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = '/login';
    };

    return (
        <div id="lockedGlobalNav">
            <div id="globalNavContainer" className={`gd-nav ${scrolled ? 'nav-fixed' : ''}`} style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 2000 }}>
                <div className="container-nav-wide">
                    <div className="nav-flex-wrapper">
                        {/* Logo */}
                        <div className="brand-wrapper">
                            <Link href="/" className="gd-logo">
                                <img src="/jobin-logo.png" alt="Jobin Logo" style={{ height: '35px', width: 'auto' }} />
                            </Link>
                        </div>

                        {/* Main Nav (Desktop) */}
                        <div className="nav-menu-container desktop-only">
                            <ul id="ContentNav" className="nav-menu-list">
                                {navLinks.map((link) => (
                                    <li
                                        key={link.href}
                                        className={`menu-li ${pathname === link.href ? 'active' : ''}`}
                                    >
                                        <Link href={link.href}>{link.name}</Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Action Nav */}
                        <div className="utility-nav-wrapper">
                            <button className="utility-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#505863" strokeWidth="2">
                                    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"></path>
                                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                                </svg>
                            </button>
                            <div className="nav-actions desktop-only">
                                {user ? (
                                    <div className="user-nav-action">
                                        <Link href={`/profile/${profileSlug?.replace(/\s+/g, '_')}`} className="user-profile-nav">
                                            <div className="user-avatar-mini" style={{ background: (user.user_metadata?.avatar_url || user.user_metadata?.picture) ? `url(${user.user_metadata.avatar_url || user.user_metadata.picture})` : 'var(--primary)', backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {!(user.user_metadata?.avatar_url || user.user_metadata?.picture) && (user.user_metadata?.full_name?.[0] || user.email?.[0]).toUpperCase()}
                                            </div>
                                            <span className="user-name-short">{user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0]}</span>
                                        </Link>
                                        <button onClick={handleLogout} className="btn-logout-header">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>
                                        </button>
                                    </div>
                                ) : (
                                    <Link href="/login" className="sign-in-btn-branded">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="25" height="24" fill="none" viewBox="0 0 25 24">
                                            <path stroke="currentColor" strokeWidth="1.5" d="M2.998 12h14m0 0-4.5-4.5m4.5 4.5-4.5 4.5"></path>
                                            <path stroke="#fff" strokeWidth="1.5" d="M7.771 8.28V5.75a2 2 0 0 1-2-2h9.48a2 2 0 0 1 2 2v11.995a2 2 0 0 1-2.006 2l-9.479-.026a2 2 0 0 1-1.995-2v-2.104"></path>
                                        </svg>
                                        <span className="sign-in-text">Sign In</span>
                                    </Link>
                                )}
                            </div>
                        </div>

                        {/* Hamburger Button (Mobile Only) */}
                        <button className="mobile-menu-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                            {mobileMenuOpen ? (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
                            ) : (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 12h18M3 6h18M3 18h18" /></svg>
                            )}
                        </button>
                    </div> {/* End nav-flex-wrapper */}
                </div> {/* End container-nav-wide */}

                {/* Mobile Menu Overlay */}
                <div className={`mobile-nav-overlay ${mobileMenuOpen ? 'is-open' : ''}`}>
                    <ul className="mobile-nav-links">
                        {navLinks.map((link) => (
                            <li key={link.href}>
                                <Link href={link.href} className={pathname === link.href ? 'active' : ''}>{link.name}</Link>
                            </li>
                        ))}
                    </ul>

                    <div className="mobile-auth-section">
                        <Link href="/login" className="mobile-login-btn">
                            Sign In
                        </Link>
                        <Link href="/register" className="mobile-reg-link">
                            Create a free account
                        </Link>

                        <div className="mobile-logout-wrapper">
                            <button onClick={handleLogout} className="logout-link" style={{ background: 'none', border: 'none', width: '100%', cursor: 'pointer', padding: '14px 0' }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
