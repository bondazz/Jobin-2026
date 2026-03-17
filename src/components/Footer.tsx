"use client";

import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="gd-footer-pro">
            <div className="container-padding">
                <div className="footer-top-row">
                    <div className="footer-brand-col">
                        <Link href="/" className="footer-logo">
                            <img src="/jobin-logo.png" alt="Jobin Logo" style={{ height: '30px', width: 'auto' }} />
                        </Link>
                    </div>
                    <div className="footer-nav-grid">
                        <div className="footer-col">
                            <h4>Jobin</h4>
                            <Link href="#">About / Press</Link>
                            <Link href="#">Awards</Link>
                            <Link href="#">Blog</Link>
                            <Link href="#">Research</Link>
                            <Link href="#">Guides</Link>
                        </div>
                        <div className="footer-col">
                            <h4>Employers</h4>
                            <Link href="#">Get a Free Employer Account</Link>
                            <Link href="#">Employer Center</Link>
                            <Link href="#">Post a Job</Link>
                        </div>
                        <div className="footer-col">
                            <h4>Information</h4>
                            <Link href="#">Help / Contact Us</Link>
                            <Link href="#">Guidelines</Link>
                            <Link href="#">Terms of Use</Link>
                            <Link href="#">Privacy & Ad Choices</Link>
                            <Link href="#">Cookie Consent Tool</Link>
                        </div>
                        <div className="footer-col">
                            <h4>Work With Us</h4>
                            <Link href="#">Advertisers</Link>
                            <Link href="#">Careers</Link>
                        </div>
                    </div>
                </div>

                <div className="footer-middle-row">
                    <div className="app-download-sec">
                        <span className="label">Download the App</span>
                        <div className="app-icons">
                            <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M17.523 15.341c-.551 0-1.002-.451-1.002-1.002V9.339c0-.551.451-1.002 1.002-1.002.551 0 1.002.451 1.002 1.002v5.001c-.001.55-.452 1.001-1.002 1.001zM11.977 15.341c-.551 0-1.002-.451-1.002-1.002V6.66c0-.551.451-1.002 1.002-1.002.551 0 1.002.451 1.002 1.002v7.679c-.001.551-.452 1.002-1.002 1.002zM6.431 15.341c-.551 0-1.002-.451-1.002-1.002v-3.334c0-.551.451-1.002 1.002-1.002.551 0 1.002.451 1.002 1.002v3.334c0 .551-.451 1.002-1.002 1.002zM12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z"></path></svg>
                            <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.1 2.48-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.24-1.99 1.1-3.15-1.04.04-2.3.69-3.05 1.56-.67.77-1.26 1.97-1.1 3.1 1.16.09 2.32-.68 3.05-1.51"></path></svg>
                        </div>
                    </div>
                    <div className="social-sec">
                        <div className="social-icons">
                            <span className="s-icon">f</span>
                            <span className="s-icon">𝕏</span>
                            <span className="s-icon">▶</span>
                            <span className="s-icon">📷</span>
                            <span className="s-icon">𝒷</span>
                        </div>
                    </div>
                    <div className="country-sec">
                        <div className="country-selector">
                            United States <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"></path></svg>
                        </div>
                    </div>
                </div>

                <div className="footer-bottom-row">
                    <div className="browse-by">
                        Browse by: <Link href="#">Companies</Link>, <Link href="#">Jobs</Link>, <Link href="#">Locations</Link>, <Link href="#">Communities</Link>, <Link href="#">Recent Posts</Link>
                    </div>
                    <p className="copyright">
                        Copyright © 2008–2026 Jobin LLC. &quot;Jobin,&quot; &quot;Worklife Pro,&quot; &quot;Bowls,&quot; and logo are proprietary trademarks of Jobin LLC.
                    </p>
                </div>
            </div>
        </footer>
    );
}
