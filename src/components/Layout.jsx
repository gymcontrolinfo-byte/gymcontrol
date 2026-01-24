
import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Dumbbell, Calendar, LayoutDashboard, Settings, Lightbulb, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ADMIN_EMAIL } from '../services/db';
import { useTranslation } from 'react-i18next';
import '../index.css';

const Layout = () => {
    const { t } = useTranslation();
    const { currentUser } = useAuth();

    return (
        <div className="layout">
            {/* Top Bar - Mobile Only / Branding */}
            <header className="glass-header container flex-center" style={{ justifyContent: 'space-between', padding: '1rem' }}>
                <div className="flex-center" style={{ gap: '0.5rem' }}>
                    <div style={{ background: 'var(--accent-primary)', padding: '0.4rem', borderRadius: '0.5rem' }}>
                        <Dumbbell size={24} color="white" />
                    </div>
                    <span className="text-gradient" style={{ fontWeight: 800, fontSize: '1.5rem', letterSpacing: '-1px' }}>{t('common.gymPro')}</span>
                </div>
                <div className="user-avatar" style={{ width: 32, height: 32, background: 'var(--bg-secondary)', borderRadius: '50%', overflow: 'hidden' }}>
                    <NavLink to="/profile" style={{ display: 'block', width: '100%', height: '100%' }}>
                        {/* Placeholder for now, specific logic can be added if needed */}
                        <img src={`https://api.dicebear.com/7.x/initials/svg?seed=User`} alt="User" style={{ width: '100%', height: '100%' }} />
                    </NavLink>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="container" style={{ flex: 1 }}>
                <Outlet />
            </main>

            {/* Bottom Navigation - Mobile First */}
            <nav className="glass-card" style={{
                position: 'fixed',
                bottom: '1rem',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 'calc(100% - 2rem)',
                maxWidth: '400px',
                zIndex: 100,
                display: 'flex',
                justifyContent: 'space-around',
                padding: '0.8rem',
                backdropFilter: 'blur(20px)'
            }}>
                <NavItem to="/" icon={<LayoutDashboard size={24} />} label={t('nav.stats')} />
                <NavItem to="/library" icon={<Dumbbell size={24} />} label={t('nav.exercises')} />
                <NavItem to="/plan" icon={<Calendar size={24} />} label={t('nav.plan')} />
                <NavItem to="/tips" icon={<Lightbulb size={24} />} label={t('nav.tips')} />
            </nav>

            {/* Admin Floating Link */}
            {currentUser?.email === ADMIN_EMAIL && (
                <div style={{ position: 'fixed', bottom: '5rem', right: '1rem', zIndex: 101 }}>
                    <NavLink to="/admin" className="btn btn-primary" style={{
                        padding: '0.6rem 1rem',
                        fontSize: '0.9rem',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        borderRadius: '2rem'
                    }}>
                        <Shield size={18} style={{ marginRight: '0.5rem' }} /> Admin Panel
                    </NavLink>
                </div>
            )}
        </div>
    );
};

const NavItem = ({ to, icon, label }) => (
    <NavLink
        to={to}
        className={({ isActive }) =>
            `flex-col flex-center ${isActive ? 'active' : ''}`
        }
        style={({ isActive }) => ({
            textDecoration: 'none',
            color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
            gap: '0.2rem',
            fontSize: '0.7rem',
            fontWeight: 600,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: isActive ? 'scale(1.1) translateY(-2px)' : 'scale(1)'
        })}
    >
        {icon}
        <span>{label}</span>
    </NavLink>
);

export default Layout;
