"use client";

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * JOBIN - Glassdoor-Inspired High Fidelity Interface
 * This implementation follows the exact structural density and layout 
 * of the provided Glassdoor source, adapted for the Jobin brand.
 */

export default function Home() {
  const [scrolled, setScrolled] = useState(false);

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) console.error('Error logging in with Google:', error.message);
  };
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
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

  const sliderRef = useRef<HTMLDivElement>(null);
  const featuredSliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollSlider = (direction: 'left' | 'right', ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) {
      const scrollAmount = 400;
      ref.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="gd-root">


      {/* HERO SECTION */}
      <section className="hero-banner">
        <div className="hero-images d-lg-block">
          <div className="hero-img-left"></div>
        </div>

        <div className="hero-content">
          <h1 className="hero-title">You deserve a job that loves you back</h1>

          <div className="mobile-hero-image-center d-mobile-only">
            <img src="/hero-right-new.png" alt="Hero Mobile" />
          </div>

          <div className="auth-card-v3">
            <div className="auth-logos">
              <img src="/jobin-logo.png" alt="Jobin Logo" />
            </div>
            <h2 className="auth-heading">One login to help you get hired</h2>
            <p className="auth-subtext">
              Streamline your research and get better job matches across Jobin and our community with <strong>one login</strong>.
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
                </form>
              </div>
            </div>

            <div className="auth-footer-v3">
              <p>Have an existing Jobin account? <Link href="/login">Sign in here</Link></p>
            </div>
          </div>
        </div>

        <div className="hero-images d-lg-block">
          <div className="hero-img-right"></div>
        </div>
      </section>

      {/* TOP COMPANIES SECTION - PREMIUM REFINEMENT */}
      <section className="section-companies">
        <div className="container-padding">
          <div className="section-header-row">
            <h2 className="section-title-premium">Top companies hiring now</h2>
          </div>

          <div className="top-companies-slider-container">
            <button className="slider-nav-btn prev" onClick={() => scrollSlider('left', sliderRef)} aria-label="Previous">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"></path></svg>
            </button>

            <div className="top-companies-slider-mask-left"></div>

            <div className="top-companies-grid-naukri-slider" ref={sliderRef}>
              {[
                { name: 'MNCs', count: '2.3K+', logos: ['https://img.naukimg.com/logo_images/groups/v1/485096.gif', 'https://img.naukimg.com/logo_images/groups/v1/4630125.gif', 'https://img.naukimg.com/logo_images/groups/v1/362038.gif', 'https://img.naukimg.com/logo_images/groups/v1/4607713.gif'] },
                { name: 'Edtech', count: '172', logos: ['https://img.naukimg.com/logo_images/groups/v1/513482.gif', 'https://img.naukimg.com/logo_images/groups/v1/3924732.gif', 'https://img.naukimg.com/logo_images/groups/v1/4951820.gif', 'https://img.naukimg.com/logo_images/groups/v1/3989906.gif'] },
                { name: 'Healthcare', count: '702', logos: ['https://img.naukimg.com/logo_images/groups/v1/2774804.gif', 'https://img.naukimg.com/logo_images/groups/v1/1634250.gif', 'https://img.naukimg.com/logo_images/groups/v1/1784884.gif', 'https://img.naukimg.com/logo_images/groups/v1/4760731.gif'] },
                { name: 'Unicorns', count: '99', logos: ['https://img.naukimg.com/logo_images/groups/v1/481500.gif', 'https://img.naukimg.com/logo_images/groups/v1/1715696.gif', 'https://img.naukimg.com/logo_images/groups/v1/1940648.gif', 'https://img.naukimg.com/logo_images/groups/v1/3989906.gif'] },
                { name: 'Internet', count: '259', logos: ['https://img.naukimg.com/logo_images/groups/v1/2036194.gif', 'https://img.naukimg.com/logo_images/groups/v1/4670381.gif', 'https://img.naukimg.com/logo_images/groups/v1/11809885.gif', 'https://img.naukimg.com/logo_images/groups/v1/3197826.gif'] },
                { name: 'B2C', count: '2.5K+', logos: ['https://img.naukimg.com/logo_images/groups/v1/74684.gif', 'https://img.naukimg.com/logo_images/groups/v1/1527486.gif', 'https://img.naukimg.com/logo_images/groups/v1/4826725.gif', 'https://img.naukimg.com/logo_images/groups/v1/4633107.gif'] },
                { name: 'Manufacturing', count: '1.1K+', logos: ['https://img.naukimg.com/logo_images/groups/v1/335690.gif', 'https://img.naukimg.com/logo_images/groups/v1/4576779.gif', 'https://img.naukimg.com/logo_images/groups/v1/239110.gif', 'https://img.naukimg.com/logo_images/groups/v1/2507810.gif'] },
                { name: 'Fortune 500', count: '114', logos: ['https://img.naukimg.com/logo_images/groups/v1/1482768.gif', 'https://img.naukimg.com/logo_images/groups/v1/235536.gif', 'https://img.naukimg.com/logo_images/groups/v1/12076.gif', 'https://img.naukimg.com/logo_images/groups/v1/4096326.gif'] }
              ].map((cat, i) => (
                <div key={i} className="industry-card-pro-small">
                  <div className="chip-heading-div">
                    <span className="industry-name-small">{cat.name}</span>
                    <img className="arrow-icon-small" src="https://static.naukimg.com/s/7/0/assets/images/src/widgets/naukri-homepage-industry-wdgt/latest/resources/arrow-one-theme.2dc3b797.svg" alt="arrow" />
                  </div>
                  <span className="industry-company-small">{cat.count} hiring</span>
                  <div className="industry-logo-grid-small">
                    {cat.logos.map((logo, j) => (
                      <div key={j} className="logo-box-small">
                        <img src={logo} alt="comp-logo" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="top-companies-slider-mask-right"></div>

            <button className="slider-nav-btn next" onClick={() => scrollSlider('right', sliderRef)} aria-label="Next">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"></path></svg>
            </button>
          </div>

          <div className="section-header-compact mt-64">
            <h2 className="section-title-premium">Featured companies actively hiring</h2>
            <p className="section-subtitle-pro">Top-rated employers looking for talent like you</p>
          </div>

          <div className="featured-companies-slider-container">
            <button className="slider-nav-btn prev" onClick={() => scrollSlider('left', featuredSliderRef)} aria-label="Previous">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"></path></svg>
            </button>

            <div className="top-companies-slider-mask-left"></div>

            <div className="featured-companies-slider-wrap" ref={featuredSliderRef}>
              {[
                { name: 'ICICI Bank', rating: '4.0', reviews: '45.3K+', desc: 'Leading private sector bank in India.', color: 'rgba(176, 42, 48, 0.05)', logo: 'https://img.naukimg.com/logo_images/groups/v2/44512.gif' },
                { name: 'Genpact', rating: '3.6', reviews: '41.4K+', desc: 'Global professional services firm.', color: 'rgba(8, 50, 98, 0.05)', logo: 'https://img.naukimg.com/logo_images/groups/v2/42932.gif' },
                { name: 'Infosys', rating: '3.5', reviews: '47.9K+', desc: 'Global leader in next-gen digital services.', color: 'rgba(0, 124, 195, 0.05)', logo: 'https://img.naukimg.com/logo_images/groups/v2/13832.gif' },
                { name: 'Reliance Retail', rating: '3.9', reviews: '27.1K+', desc: "Building India's largest retail company", color: 'rgba(238, 28, 46, 0.05)', logo: 'https://img.naukimg.com/logo_images/groups/v2/214440.gif' },
                { name: 'Cognizant', rating: '3.6', reviews: '60.4K+', desc: 'Leading ITeS company with global presence.', color: 'rgba(11, 46, 134, 0.05)', logo: 'https://img.naukimg.com/logo_images/groups/v2/4156.gif' },
                { name: 'Capgemini', rating: '3.7', reviews: '52.1K+', desc: 'Global leader in technology services.', color: 'rgba(0, 112, 173, 0.05)', logo: 'https://img.naukimg.com/logo_images/groups/v2/1288.gif' }
              ].map((comp, i) => (
                <div key={i} className="featured-tuple-pro">
                  <div className="tuple-logo-wrap">
                    <img src={comp.logo} alt={comp.name} />
                  </div>
                  <div className="tuple-content-wrap" style={{ backgroundColor: comp.color }}>
                    <h3 className="tuple-title">{comp.name}</h3>
                    <div className="tuple-meta">
                      <span className="tuple-star">★</span>
                      <span className="tuple-rating">{comp.rating}</span>
                      <span className="tuple-reviews">{comp.reviews} reviews</span>
                    </div>
                  </div>
                  <div className="tuple-desc-wrap">
                    <p>{comp.desc}</p>
                  </div>
                  <div className="tuple-cta-wrap">
                    <button className="tuple-view-btn">View jobs</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="top-companies-slider-mask-right"></div>

            <button className="slider-nav-btn next" onClick={() => scrollSlider('right', featuredSliderRef)} aria-label="Next">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"></path></svg>
            </button>
          </div>

          <div className="flex-center mt-48">
            <button className="premium-outline-btn">Explore all companies</button>
          </div>
        </div>
      </section >

      {/* POPULAR ROLES SECTION - OVERLAPPING STYLE */}
      < section className="section-roles" >
        <div className="container-padding">
          <div className="roles-layout-wrapper">
            <div className="roles-accent-belt">
              <div className="roles-left-content">
                <h2 className="roles-title">Discover jobs across popular roles</h2>
                <p className="roles-subtitle">Select a role and we&apos;ll show you relevant jobs for it!</p>
              </div>
            </div>
            <div className="roles-card-overlapping">
              <div className="roles-grid-container">
                <div className="roles-grid">
                  {[
                    { title: 'Full Stack Developer', count: '23.7K+' },
                    { title: 'Mobile / App Developer', count: '3K+' },
                    { title: 'Front End Developer', count: '5.4K+' },
                    { title: 'DevOps Engineer', count: '3.1K+' },
                    { title: 'Engineering Manager', count: '1.6K+' },
                    { title: 'Technical Lead', count: '11.3K+' }
                  ].map((role, i) => (
                    <div key={i} className="role-chip">
                      <div className="role-chip-content">
                        <span className="name">{role.title}</span>
                        <span className="count">{role.count} Jobs &gt;</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="roles-pagination-dots">
                  <div className="dot active"></div>
                  <div className="dot"></div>
                  <div className="dot"></div>
                </div>
                <button className="roles-next-arrow" aria-label="Next slide">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"></path></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section >


      {/* PRE-FOOTER SEO LINKS */}
      < section className="section-pre-footer" >
        <div className="container-padding">
          <div className="pre-footer-intro">
            <h2 className="pre-footer-title">Start your search</h2>
            <p className="pre-footer-desc">Need some inspiration? See what millions of people are looking for on Jobin today.</p>
            <button
              className={`expand-links-btn ${isSearchExpanded ? 'expanded' : ''}`}
              onClick={() => setIsSearchExpanded(!isSearchExpanded)}
              aria-label="Expand more links"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M6 9l6 6 6-6"></path>
              </svg>
            </button>
          </div>

          <div className={`pre-footer-collapsible ${isSearchExpanded ? 'show' : ''}`}>
            <div className="pre-footer-grid">
              <div className="pre-footer-col">
                <h4>Flexible Jobs</h4>
                <ul>
                  <li><Link href="#">Data entry work from home jobs</Link></li>
                  <li><Link href="#">Customer service work from home jobs</Link></li>
                  <li><Link href="#">Copywriter work from home jobs</Link></li>
                  <li><Link href="#">Project manager work from home jobs</Link></li>
                  <li><Link href="#">Accountant work from home jobs</Link></li>
                </ul>
              </div>
              <div className="pre-footer-col">
                <h4>Popular Jobs</h4>
                <ul>
                  <li><Link href="#">Truck Driver</Link></li>
                  <li><Link href="#">Registered Nurse</Link></li>
                  <li><Link href="#">Software Engineer</Link></li>
                  <li><Link href="#">Project Manager</Link></li>
                  <li><Link href="#">Dental Assistant</Link></li>
                </ul>
              </div>
              <div className="pre-footer-col">
                <h4>Jobs by City</h4>
                <ul>
                  <li><Link href="#">New York</Link></li>
                  <li><Link href="#">Houston</Link></li>
                  <li><Link href="#">San Diego</Link></li>
                  <li><Link href="#">Austin</Link></li>
                  <li><Link href="#">Chicago</Link></li>
                </ul>
              </div>
              <div className="pre-footer-col">
                <h4>Popular Companies</h4>
                <ul>
                  <li><Link href="#">Walmart</Link></li>
                  <li><Link href="#">McDonald&apos;s</Link></li>
                  <li><Link href="#">Amazon</Link></li>
                  <li><Link href="#">Apple</Link></li>
                  <li><Link href="#">Microsoft</Link></li>
                </ul>
              </div>
              <div className="pre-footer-col">
                <h4>Popular Bowls™</h4>
                <ul>
                  <li><Link href="#">The Work-Life Bowl</Link></li>
                  <li><Link href="#">Tech</Link></li>
                  <li><Link href="#">Salaries in Tech</Link></li>
                  <li><Link href="#">Jobs in Tech</Link></li>
                  <li><Link href="#">The Water Cooler</Link></li>
                </ul>
              </div>
            </div>

            <div className="pre-footer-cta-box">
              <h2>Your Community is Waiting</h2>
              <button className="btn-sign-up-footer">Sign Up for Free</button>
            </div>
          </div>
        </div>
      </section >



    </div >
  );
}
