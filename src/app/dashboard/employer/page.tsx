import Link from 'next/link';

export default function EmployerDashboard() {
    return (
        <div className="page-wrapper" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <header className="header" style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
                <div className="container flex items-center justify-between" style={{ padding: '1rem 2rem' }}>
                    <div className="logo flex items-center gap-8">
                        <Link href="/" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>
                            Jobin.
                        </Link>
                        <nav className="nav-links flex gap-6" style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                            <Link href="/dashboard/employer" style={{ color: 'var(--primary)', borderBottom: '2px solid var(--primary)', paddingBottom: '0.25rem' }}>Dashboard</Link>
                            <Link href="/dashboard/employer/jobs" className="text-muted">My Postings</Link>
                            <Link href="/dashboard/employer/candidates" className="text-muted">Candidates</Link>
                        </nav>
                    </div>
                    <div className="user-menu flex items-center gap-4">
                        <div className="avatar" style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'white' }}>
                            AC
                        </div>
                    </div>
                </div>
            </header>

            <main className="container" style={{ flex: 1, padding: '3rem 2rem' }}>
                <div className="dashboard-header flex justify-between items-center" style={{ marginBottom: '3rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem' }}>Acme Corp Dashboard</h1>
                        <p className="text-muted">Manage your job openings and review candidates.</p>
                    </div>
                    <button className="btn btn-primary flex gap-2 items-center">
                        <span style={{ fontSize: '1.25rem' }}>+</span> Post a New Job
                    </button>
                </div>

                <div className="grid-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                    <div className="glass-card" style={{ padding: '1.5rem' }}>
                        <h3 className="text-muted" style={{ fontSize: '0.875rem', fontWeight: 500 }}>Active Jobs</h3>
                        <p style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--primary)' }}>4</p>
                    </div>
                    <div className="glass-card" style={{ padding: '1.5rem' }}>
                        <h3 className="text-muted" style={{ fontSize: '0.875rem', fontWeight: 500 }}>Total Applicants</h3>
                        <p style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--primary)' }}>156</p>
                    </div>
                    <div className="glass-card" style={{ padding: '1.5rem' }}>
                        <h3 className="text-muted" style={{ fontSize: '0.875rem', fontWeight: 500 }}>Interviews Scheduled</h3>
                        <p style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--primary)' }}>12</p>
                    </div>
                </div>

                <section className="recent-applications" style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Recent Applicants</h2>
                    <div className="applicants-table glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--background)' }}>
                                    <th style={{ padding: '1rem 1.5rem', fontWeight: 500, color: 'var(--text-muted)' }}>Candidate</th>
                                    <th style={{ padding: '1rem 1.5rem', fontWeight: 500, color: 'var(--text-muted)' }}>Applied For</th>
                                    <th style={{ padding: '1rem 1.5rem', fontWeight: 500, color: 'var(--text-muted)' }}>Date</th>
                                    <th style={{ padding: '1rem 1.5rem', fontWeight: 500, color: 'var(--text-muted)' }}>Status</th>
                                    <th style={{ padding: '1rem 1.5rem', fontWeight: 500, color: 'var(--text-muted)', textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    { name: 'Sarah Jenkins', role: 'Frontend Engineer', date: '2 hours ago', status: 'New', avatar: 'SJ' },
                                    { name: 'Michael Chen', role: 'Senior React Developer', date: '5 hours ago', status: 'In Review', avatar: 'MC' },
                                    { name: 'Emily Rodriguez', role: 'UX Designer', date: '1 day ago', status: 'Interview', avatar: 'ER' },
                                ].map((applicant, idx) => (
                                    <tr key={idx} style={{ borderBottom: idx !== 2 ? '1px solid var(--border)' : 'none', transition: 'var(--transition)' }}>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <div className="flex items-center gap-3">
                                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                                                    {applicant.avatar}
                                                </div>
                                                <span style={{ fontWeight: 500 }}>{applicant.name}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>{applicant.role}</td>
                                        <td style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>{applicant.date}</td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <span style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: 'var(--radius-full)',
                                                fontSize: '0.75rem',
                                                fontWeight: 500,
                                                background: applicant.status === 'New' ? 'var(--accent)' : applicant.status === 'In Review' ? '#E0E7FF' : '#D1FAE5',
                                                color: applicant.status === 'New' ? '#92400E' : applicant.status === 'In Review' ? '#3730A3' : '#065F46'
                                            }}>
                                                {applicant.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                                            <button className="text-primary" style={{ fontWeight: 500, fontSize: '0.875rem' }}>Review CV</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </main>
        </div>
    );
}
