
import React, { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, Mail, Lock, LogIn, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { checkWhitelist } from '../services/db';

export default function Login() {
    const emailRef = useRef();
    const passwordRef = useRef();
    const { login, signup, loginWithGoogle, logout } = useAuth();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSignup, setIsSignup] = useState(false);
    const navigate = useNavigate();
    const { t } = useTranslation();

    async function handleSubmit(e) {
        e.preventDefault();

        try {
            setError('');
            setLoading(true);
            if (isSignup) {
                // Enforce Whitelist for Signup (Check if email is pre-approved)
                // Note: user is NOT logged in here, so this check will fail if Firestore rules require Auth.
                // WE SHOULD REMOVE THIS PRE-CHECK if rules require auth, or allow public read (not recommended).
                // BETTER: Signup -> Check -> If fail, delete user/logout.
                // BUT current logic for signup: createUserWithEmailAndPassword logs them in.

                // Let's rely on post-creation check for both.
                await signup(emailRef.current.value, passwordRef.current.value);
            } else {
                await login(emailRef.current.value, passwordRef.current.value);
            }

            // Common Check for both Login and Signup
            // User is now logged in, so we can read the whitelist
            const email = emailRef.current.value.trim();
            const { allowed } = await checkWhitelist(email);

            if (!allowed) {
                await logout();
                throw new Error(t('auth.accessDenied'));
            }

            navigate('/');
        } catch (err) {
            console.error(err);
            // Sign out if we ended up in a weird state
            if (auth.currentUser) await logout();
            setError(err.message || (isSignup ? t('auth.failedSignup') : t('auth.failedLogin')));
        }
        setLoading(false);
    }



    return (
        <div className="flex-center flex-col" style={{ minHeight: '100vh', padding: '1rem' }}>
            <div className="glass-card" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
                <div className="flex-col flex-center fade-in" style={{ marginBottom: '2rem' }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                        borderRadius: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '1rem',
                        boxShadow: 'var(--shadow-glow)'
                    }}>
                        <img src="/favicon.png" alt="Logo" style={{ width: '32px', height: '32px' }} />
                    </div>
                    <h2 className="text-gradient" style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                        {isSignup ? t('auth.createAccount') : t('auth.welcomeBack')}
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
                        {isSignup
                            ? t('auth.startJourney')
                            : t('auth.continueProgress')}
                    </p>
                </div>

                {error && (
                    <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-xl mb-6 flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span className="text-sm">{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex-col fade-in" style={{ gap: '1rem', animationDelay: '0.1s' }}>
                    <div className="input-group">
                        <input
                            type="email"
                            ref={emailRef}
                            required
                            placeholder={t('auth.emailPlaceholder')}
                            className="input-field"
                        />
                        <Mail className="input-icon" size={20} />
                    </div>

                    <div className="input-group">
                        <input
                            type="password"
                            ref={passwordRef}
                            required
                            placeholder={t('auth.passwordPlaceholder')}
                            className="input-field"
                        />
                        <Lock className="input-icon" size={20} />
                    </div>

                    <button
                        disabled={loading}
                        className="btn btn-primary"
                        style={{ width: '100%', marginTop: '0.5rem' }}
                    >
                        {loading ? t('auth.loading') : (
                            <>
                                <LogIn size={20} />
                                {isSignup ? t('auth.signUp') : t('auth.signIn')}
                            </>
                        )}
                    </button>
                </form>

                <div style={{ marginTop: '1rem' }}></div>

                <p style={{ marginTop: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    {isSignup ? t('auth.alreadyAccount') : t('auth.noAccount')}{" "}
                    <button
                        onClick={() => setIsSignup(!isSignup)}
                        style={{ color: 'var(--accent-secondary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                    >
                        {isSignup ? t('auth.signIn') : t('auth.signUp')}
                    </button>
                </p>
            </div>

            <a href="/privacy" style={{ marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem', textDecoration: 'none', opacity: 0.8 }}>
                Privacy Policy
            </a>
        </div>
    );
}
