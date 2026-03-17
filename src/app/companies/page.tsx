"use client";

import Link from 'next/link';
import { useState } from 'react';

export default function CompaniesPage() {
    const companies = [
        {
            id: 1,
            name: "ICICI Bank",
            rating: "4.0",
            reviews: "45.3K+",
            desc: "A powerhouse in the financial sector, providing comprehensive banking solutions to millions. Known for its digital-first approach and extensive network.",
            logo: "https://img.naukimg.com/logo_images/groups/v2/44512.gif",
            hq: "Mumbai, India",
            size: "10,000+ Employees",
            type: "Private Sector Bank",
            popular: true
        },
        {
            id: 2,
            name: "Genpact",
            rating: "3.6",
            reviews: "41.4K+",
            desc: "Global professional services firm delivering digital transformation. We help our clients rethink the way they work to achieve lasting impact.",
            logo: "https://img.naukimg.com/logo_images/groups/v2/42932.gif",
            hq: "New York, USA",
            size: "100,000+ Employees",
            type: "Public Limited"
        },
        {
            id: 3,
            name: "Infosys",
            rating: "3.5",
            reviews: "47.9K+",
            desc: "A global leader in next-generation digital services and consulting. We enable clients in more than 50 countries to navigate their digital journey.",
            logo: "https://img.naukimg.com/logo_images/groups/v2/13832.gif",
            hq: "Bengaluru, India",
            size: "300,000+ Employees",
            type: "IT Services",
            popular: true
        },
        {
            id: 4,
            name: "Reliance Retail",
            rating: "3.9",
            reviews: "27.1K+",
            desc: "Leading the retail revolution in India. Operating thousands of stores across grocery, electronics, and fashion with world-class efficiency.",
            logo: "https://img.naukimg.com/logo_images/groups/v2/214440.gif",
            hq: "Mumbai, India",
            size: "100,000+ Employees",
            type: "Public Limited"
        },
        {
            id: 5,
            name: "Cognizant",
            rating: "3.6",
            reviews: "60.4K+",
            desc: "Helping modern businesses improve everyday life. We build, manage, and modernize the platforms that drive the global economy.",
            logo: "https://img.naukimg.com/logo_images/groups/v2/4156.gif",
            hq: "Teaneck, USA",
            size: "200,000+ Employees",
            type: "Information Technology"
        },
        {
            id: 6,
            name: "Capgemini",
            rating: "3.7",
            reviews: "52.1K+",
            desc: "Partners with companies to transform and manage their business by harnessing the power of technology to unleash human energy.",
            logo: "https://img.naukimg.com/logo_images/groups/v2/1288.gif",
            hq: "Paris, France",
            size: "250,000+ Employees",
            type: "Consulting & Services"
        }
    ];

    return (
        <div className="gd-root companies-page-v2">

            {/* REFINED PREMIUM HERO */}
            <section className="companies-hero-v2">
                <div className="container-nav-wide">
                    <div className="hero-flex">
                        <div className="hero-text">
                            <span className="badge-premium">Company Discovery</span>
                            <h1>Find your next <span className="text-gradient">Dream Employer</span></h1>
                            <p>Browse through audited reviews, salary insights, and authentic company cultures to find where you truly belong.</p>

                            <div className="search-card-premium">
                                <div className="p-search-group">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
                                    <input type="text" placeholder="Company name, industry, or role" />
                                </div>
                                <div className="p-search-divider"></div>
                                <div className="p-search-group">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                                    <input type="text" placeholder="Location" defaultValue="Baku, Azerbaijan" />
                                </div>
                                <button className="btn-p-search">Find Companies</button>
                            </div>
                        </div>
                        <div className="hero-visual">
                            {/* Abstract decorative elements */}
                            <div className="abstract-shape s1"></div>
                            <div className="abstract-shape s2"></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* STICKY TOP BAR */}
            <div className="companies-sticky-bar">
                <div className="container-nav-wide">
                    <div className="sticky-flex">
                        <div className="sticky-tabs">
                            <Link href="#" className="s-tab active">Overview</Link>
                            <Link href="#" className="s-tab">Compare</Link>
                            <Link href="#" className="s-tab">Top Rated</Link>
                        </div>
                        <div className="sticky-actions">
                            <button className="btn-write-review">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                Write a Review
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN PORTAL AREA */}
            <main className="companies-portal">
                <div className="container-nav-wide">
                    <div className="portal-grid">

                        {/* LEFT: SMART FILTERS */}
                        <aside className="portal-filters">
                            <div className="filter-glass-card">
                                <div className="f-header">
                                    <h3>Smart Filters</h3>
                                    <button className="btn-reset">Reset</button>
                                </div>

                                <div className="f-section">
                                    <label>Industry Vertical</label>
                                    <div className="custom-select-wrapper">
                                        <select>
                                            <option>All Industries</option>
                                            <option>FinTech & Banking</option>
                                            <option>AI & Saas</option>
                                            <option>Creative & Design</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="f-section">
                                    <label>Company Scale</label>
                                    <div className="checkbox-list">
                                        <label className="check-item">
                                            <input type="checkbox" />
                                            <span>Startups (1-50)</span>
                                        </label>
                                        <label className="check-item">
                                            <input type="checkbox" />
                                            <span>Scaleups (51-500)</span>
                                        </label>
                                        <label className="check-item">
                                            <input type="checkbox" />
                                            <span>Enterprise (500+)</span>
                                        </label>
                                    </div>
                                </div>

                                <div className="f-section">
                                    <label>Work Culture</label>
                                    <div className="tag-cloud">
                                        <button className="t-pill">Remote-First</button>
                                        <button className="t-pill">Hybrid</button>
                                        <button className="t-pill">Fast-Paced</button>
                                    </div>
                                </div>
                            </div>
                        </aside>

                        {/* RIGHT: PREMIUM LISTINGS */}
                        <div className="portal-listings">
                            <div className="listings-header">
                                <h2>Found {companies.length} curated companies</h2>
                                <div className="sort-dropdown">
                                    <span>Sort by: <b>Most Popular</b></span>
                                </div>
                            </div>

                            <div className="companies-v2-stack">
                                {companies.map((comp) => (
                                    <div key={comp.id} className="comp-card-premium">
                                        {comp.popular && <div className="popular-badge">Top Employer</div>}

                                        <div className="card-p-top">
                                            <div className="comp-branding">
                                                <div className="logo-outer">
                                                    <img src={comp.logo} alt={comp.name} />
                                                </div>
                                                <div className="name-meta">
                                                    <h3>{comp.name}</h3>
                                                    <div className="rating-pill">
                                                        <span className="r-stars">★★★★★</span>
                                                        <span className="r-val">{comp.rating}</span>
                                                        <span className="r-count">({comp.reviews} reviews)</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button className="btn-follow-v2">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
                                                Follow
                                            </button>
                                        </div>

                                        <p className="comp-bio">{comp.desc}</p>

                                        <div className="comp-stats-grid">
                                            <div className="s-cell">
                                                <div className="s-icon">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                                                </div>
                                                <div className="s-data">
                                                    <span className="l">Headquarters</span>
                                                    <span className="v">{comp.hq}</span>
                                                </div>
                                            </div>
                                            <div className="s-cell">
                                                <div className="s-icon">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 2 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                                                </div>
                                                <div className="s-data">
                                                    <span className="l">Company Size</span>
                                                    <span className="v">{comp.size}</span>
                                                </div>
                                            </div>
                                            <div className="s-cell">
                                                <div className="s-icon">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
                                                </div>
                                                <div className="s-data">
                                                    <span className="l">Ownership</span>
                                                    <span className="v">{comp.type}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="card-p-footer">
                                            <div className="f-nav">
                                                <Link href="#" className="fn-link">View Jobs</Link>
                                                <Link href="#" className="fn-link">Salaries</Link>
                                                <Link href="#" className="fn-link">Benefits</Link>
                                            </div>
                                            <div className="f-cta">
                                                <button className="btn-ghost">View Profile →</button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            </main>

        </div>
    );
}
