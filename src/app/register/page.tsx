"use client";

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function Register() {
    const [accountType, setAccountType] = useState<'candidate' | 'employer'>('candidate');
    const [isLoading, setIsLoading] = useState(false);

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
        if (error) {
            console.error('Error logging in with Google:', error.message);
            setIsLoading(false);
        }
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
                <h2 className="auth-heading">Create Account</h2>
                <p className="auth-subtext">
                    Unlock the future of your career today.
                </p>

                <div className="auth-account-toggle-v3">
                    <button
                        type="button"
                        className={accountType === 'candidate' ? 'active' : ''}
                        onClick={() => setAccountType('candidate')}>
                        Candidate
                    </button>
                    <button
                        type="button"
                        className={accountType === 'employer' ? 'active' : ''}
                        onClick={() => setAccountType('employer')}>
                        Employer
                    </button>
                </div>

                <div className="auth-buttons-group">
                    <div className="auth-field-row-v3">
                        <div className="input-group-v3" style={{ textAlign: 'left' }}>
                            <label className="auth-label-v3">First Name</label>
                            <input type="text" placeholder="John" />
                        </div>
                        <div className="input-group-v3" style={{ textAlign: 'left' }}>
                            <label className="auth-label-v3">Last Name</label>
                            <input type="text" placeholder="Doe" />
                        </div>
                    </div>

                    {accountType === 'employer' && (
                        <div className="input-group-v3" style={{ textAlign: 'left' }}>
                            <label className="auth-label-v3">Company Name</label>
                            <input type="text" placeholder="Acme Corp" />
                        </div>
                    )}

                    <div className="input-group-v3" style={{ textAlign: 'left' }}>
                        <label className="auth-label-v3">Email Address</label>
                        <input type="email" placeholder="name@example.com" />
                    </div>

                    <div className="input-group-v3" style={{ textAlign: 'left' }}>
                        <label className="auth-label-v3">Password</label>
                        <input type="password" placeholder="••••••••" />
                    </div>

                    <button type="button" className="btn-submit-v3" disabled={isLoading} style={{ marginTop: '12px' }}>
                        {isLoading ? 'Please wait...' : 'Create Account'}
                    </button>

                    <div style={{ margin: '8px 0', color: '#94a3b8', fontSize: '13px' }}>or signup with</div>

                    <div className="auth-field-row-v3" style={{ gridTemplateColumns: '1fr' }}>
                        <button type="button" className="auth-btn-v3 google" onClick={handleGoogleLogin}>
                            <div className="btn-icon">
                                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z" /></svg>
                            </div>
                            <span>Continue with GitHub</span>
                        </button>
                    </div>
                </div>

                <div className="auth-footer-v3">
                    Already have an account? <Link href="/login">Sign In</Link>
                </div>
            </div>
        </div>
    );
}
