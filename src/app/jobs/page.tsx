"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function JobsPage() {
    const [selectedJob, setSelectedJob] = useState(0);
    const [showDetailsMobile, setShowDetailsMobile] = useState(false);

    // Prevent body scroll when details are open on mobile
    useEffect(() => {
        if (showDetailsMobile) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [showDetailsMobile]);

    const jobs = [
        {
            id: 0,
            title: "Senior Frontend Engineer (React)",
            company: "TechFlow Solutions",
            location: "Remote / Baku",
            rating: "4.8",
            salary: "$4,000 - $6,000",
            posted: "2d",
            logo: "https://img.naukimg.com/logo_images/groups/v1/4607713.gif",
            description: "We are looking for a Senior Frontend Engineer with deep expertise in React and Next.js to lead our core product development team."
        },
        {
            id: 1,
            title: "Marketing Manager",
            company: "Global Brand Co.",
            location: "Baku, Azerbaijan",
            rating: "4.2",
            salary: "1,500 - 2,500 AZN",
            posted: "5h",
            logo: "https://img.naukimg.com/logo_images/groups/v1/4630125.gif",
            description: "Join our dynamic marketing team to drive brand awareness and digital growth for our international clients."
        },
        {
            id: 2,
            title: "Backend Developer (Node.js)",
            company: "Innovate Digital",
            location: "Baku (Green Area)",
            rating: "4.5",
            salary: "2,000 - 3,500 AZN",
            posted: "1d",
            logo: "https://img.naukimg.com/logo_images/groups/v1/485096.gif",
            description: "Scalable architecture focused backend role. Work on high-performance APIs and microservices."
        },
        {
            id: 3,
            title: "UX/UI Designer",
            company: "Creative Studio",
            location: "Hybrid / Baku",
            rating: "4.9",
            salary: "1,200 - 2,000 AZN",
            posted: "3d",
            logo: "https://img.naukimg.com/logo_images/groups/v1/362038.gif",
            description: "Design pixel-perfect interfaces for our upcoming SaaS platform. Focus on user-centric design principles."
        }
    ];

    return (
        <div className="gd-root bg-light">

            {/* JOB SEARCH BAR */}
            <section className="job-search-section">
                <div className="container-nav-wide">
                    <div className="search-bar-premium">
                        <div className="search-input-group">
                            <span className="search-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                            </span>
                            <input type="text" placeholder="Job Title, Keywords, or Company" className="main-search-input" />
                        </div>
                        <div className="search-divider"></div>
                        <div className="search-input-group">
                            <span className="search-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                            </span>
                            <input type="text" placeholder="Location" defaultValue="Baku" className="main-search-input" />
                        </div>
                        <button className="btn-premium-search">Search Jobs</button>
                    </div>
                </div>
            </section>

            {/* MAIN CONTENT - DUAL PANE */}
            <main className="jobs-container-layout">
                <div className="container-nav-wide h-100">
                    <div className="jobs-split-view">

                        {/* LEFT COLUMN: LIST */}
                        <aside className={`job-list-sidebar ${showDetailsMobile ? 'd-none-mobile' : ''}`}>
                            <div className="list-header">
                                <h2>{jobs.length} Jobs in Baku</h2>
                                <div className="list-filters">
                                    <button className="filter-pill active">Relevant</button>
                                    <button className="filter-pill">Newest</button>
                                </div>
                            </div>

                            <div className="job-cards-scroll">
                                {jobs.map((job) => (
                                    <div
                                        key={job.id}
                                        className={`job-card-mini ${selectedJob === job.id ? 'active' : ''}`}
                                        onClick={() => {
                                            setSelectedJob(job.id);
                                            setShowDetailsMobile(true);
                                        }}
                                    >
                                        <div className="job-card-top">
                                            <div className="comp-logo-mini">
                                                <img src={job.logo} alt={job.company} />
                                            </div>
                                            <div className="job-info-mini">
                                                <span className="comp-name">{job.company} {job.rating} ★</span>
                                                <h3 className="job-title-mini">{job.title}</h3>
                                            </div>
                                            <button className="job-save-icon">♡</button>
                                        </div>
                                        <div className="job-card-bottom">
                                            <span className="job-loc">{job.location}</span>
                                            <div className="job-tags-row">
                                                <span className="job-tag-salary">{job.salary}</span>
                                                <span className="job-tag-time">{job.posted}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </aside>

                        {/* RIGHT COLUMN: DETAILS */}
                        <section className={`job-details-pane ${!showDetailsMobile ? 'd-none-mobile' : ''}`}>
                            <div className="mobile-back-nav d-lg-none">
                                <button onClick={() => setShowDetailsMobile(false)} className="btn-back">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                                    Back to Jobs
                                </button>
                            </div>

                            <div className="details-header-card">
                                <div className="details-top-info">
                                    <img src={jobs[selectedJob].logo} alt="Logo" className="details-logo" />
                                    <div className="details-meta">
                                        <h1 className="details-title">{jobs[selectedJob].title}</h1>
                                        <div className="details-sub">
                                            <Link href="#" className="link">{jobs[selectedJob].company}</Link>
                                            <span className="sep">•</span>
                                            <span className="loc">{jobs[selectedJob].location}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="details-actions">
                                    <button className="btn-premium-apply">Apply Now</button>
                                    <button className="btn-outline-save">Save</button>
                                </div>
                            </div>

                            <div className="details-content-body">
                                <div className="details-nav-tabs">
                                    <button className="tab active">Job</button>
                                    <button className="tab">Company</button>
                                    <button className="tab">Salaries</button>
                                </div>

                                <div className="details-text-scroller">
                                    <h3>Job Overview</h3>
                                    <p>{jobs[selectedJob].description}</p>

                                    <h3>Core Responsibilities</h3>
                                    <ul>
                                        <li>Develop and maintain high-quality React applications using modern best practices.</li>
                                        <li>Collaborate with cross-functional teams including designers, product managers, and backend engineers.</li>
                                        <li>Optimize applications for maximum speed and scalability.</li>
                                        <li>Build reusable components and front-end libraries for future use.</li>
                                    </ul>

                                    <h3>Requirements</h3>
                                    <ul>
                                        <li>Proven work experience as a Frontend Developer or similar role.</li>
                                        <li>Hands-on experience with modern JavaScript frameworks (React / Next.js).</li>
                                        <li>Proficiency in HTML, CSS, and Git.</li>
                                        <li>Problem-solving skills and attention to detail.</li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                    </div>
                </div>
            </main>

        </div>
    );
}
