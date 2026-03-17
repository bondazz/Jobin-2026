"use client";

import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useState } from 'react';

export default function Login() {
    const [showEmailForm, setShowEmailForm] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [loginError, setLoginError] = useState<string | null>(null);

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoggingIn(true);
        setLoginError(null);
        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            window.location.href = '/dashboard/candidate';
        } catch (err: any) {
            setLoginError(err.message || 'Invalid login credentials');
        } finally {
            setIsLoggingIn(false);
        }
    };

    const handleGoogleLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
        if (error) console.error('Error logging in with Google:', error.message);
    };

    return (
        <div className="premium-auth-container-v3">
            <div className="auth-backdrop-v3">
                <div className="auth-glow-orb orb-1"></div>
                <div className="auth-glow-orb orb-2"></div>
            </div>

            <div className="auth-card-v3">
                <div className="auth-logos">
                    <Link href="/">
                        <img src="/jobin-logo.png" alt="Jobin Logo" />
                    </Link>
                </div>
                <h2 className="auth-heading">Welcome Back</h2>
                <p className="auth-subtext">
                    Unlock the future of your career today with <strong>one login</strong> across Jobin.
                </p>

                <div className="auth-buttons-group">
                    <button className="auth-btn-v3 google" onClick={handleGoogleLogin}>
                        <div className="btn-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24">
                                <path fill="#fff" d="M0 12C0 5.373 5.373 0 12 0s12 5.373 12 12-5.373 12-12 12S0 18.627 0 12"></path>
                                <path fill="#4285F4" d="M18.66 12.16q-.001-.746-.127-1.433H11.94v2.708h3.767a3.22 3.22 0 0 1-1.396 2.113v1.756h2.262c1.323-1.218 2.087-3.013 2.087-5.145"></path>
                                <path fill="#34A853" d="M11.94 19c1.89 0 3.475-.627 4.633-1.696l-2.263-1.756c-.626.42-1.428.668-2.37.668-1.823 0-3.366-1.231-3.917-2.886H5.685v1.814A7 7 0 0 0 11.94 19"></path>
                                <path fill="#FBBC05" d="M8.023 13.33c-.14-.42-.22-.869-.22-1.33s.08-.91.22-1.33V8.856H5.685a7 7 0 0 0 0 6.288z"></path>
                                <path fill="#EA4335" d="M11.94 7.784c1.028 0 1.95.353 2.676 1.047l2.008-2.008C15.41 5.693 13.827 5 11.94 5a7 7 0 0 0-6.255 3.856l2.338 1.814c.55-1.655 2.094-2.886 3.917-2.886"></path>
                            </svg>
                        </div>
                        <span>Continue with Google</span>
                    </button>

                    <button className={`auth-btn-v3 email ${showEmailForm ? 'active' : ''}`} onClick={() => setShowEmailForm(!showEmailForm)}>
                        <span>Continue with email</span>
                    </button>

                    <div className={`email-expand-v3 ${showEmailForm ? 'expanded' : ''}`}>
                        <form onSubmit={handleEmailLogin} className="email-form-v3">
                            <div className="input-group-v3">
                                <input
                                    type="email"
                                    placeholder="Email address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="input-group-v3">
                                <input
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            {loginError && <p className="auth-error-v3">{loginError}</p>}
                            <button type="submit" className="btn-submit-v3" disabled={isLoggingIn}>
                                {isLoggingIn ? 'Signing in...' : 'Sign In'}
                            </button>
                            <Link href="/forgot-password" style={{ fontSize: '13px', color: '#00a264', textDecoration: 'none', textAlign: 'center', marginTop: '6px', fontWeight: 'bold' }}>Forgot password?</Link>
                        </form>
                    </div>
                </div>

                <div className="auth-footer-v3">
                    Don't have an account? <Link href="/register">Sign up for free</Link>
                </div>
            </div>
        </div>
    );
}
