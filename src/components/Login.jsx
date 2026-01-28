
import React, { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, Mail, Lock, LogIn, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { checkWhitelist } from '../services/db';

export default function Login() {
    const emailRef = useRef();
    const passwordRef = useRef();
    const { login, signup, resetPassword, loginWithGoogle, logout } = useAuth();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSignup, setIsSignup] = useState(false);
    const [isReset, setIsReset] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [pendingApproval, setPendingApproval] = useState(false);
    const navigate = useNavigate();
    const { t } = useTranslation();

    async function handleSubmit(e) {
        e.preventDefault();

        try {
            setError('');
            setLoading(true);

            if (isReset) {
                await resetPassword(emailRef.current.value);
                setError(t('auth.checkEmail'));
                setLoading(false);
                return;
            }

            if (isSignup) {
                await signup(emailRef.current.value, passwordRef.current.value);
            } else {
                await login(emailRef.current.value, passwordRef.current.value);
            }

            // Common Check for both Login and Signup
            // User is now logged in, so we can read the whitelist
            const email = emailRef.current.value.trim();
            const { allowed, role, error: dbError } = await checkWhitelist(email);

            if (!allowed) {
                if (dbError) {
                    await logout();
                    throw new Error("Database Error: Check Firestore Rules (See Console)");
                }
                if (role === 'pending') {
                    setPendingApproval(true);
                    setLoading(false);
                    return;
                }
                await logout();
                throw new Error(t('auth.accessDenied'));
            }

            navigate('/');
        } catch (err) {
            console.error(err);
            // Sign out if we ended up in a weird state
            if (auth.currentUser) await logout();

            let msg = err.message;
            if (msg.includes('auth/invalid-credential') || msg.includes('auth/wrong-password') || msg.includes('auth/user-not-found')) msg = t('auth.invalidCredential');
            else if (msg.includes('auth/email-already-in-use')) msg = t('auth.emailInUse');
            else if (msg.includes('auth/weak-password')) msg = t('auth.weakPassword');
            else if (msg.includes('auth/too-many-requests')) msg = t('auth.tooManyRequests');
            else if (isSignup) msg = t('auth.failedSignup');
            else msg = t('auth.failedLogin');

            setError(msg);
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

                    {pendingApproval ? (
                        <div className="flex-col flex-center fade-in">
                            <h2 className="text-gradient" style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem', textAlign: 'center' }}>
                                Approval Needed
                            </h2>
                            <div className="bg-yellow-500/20 border border-yellow-500/50 text-yellow-200 p-4 rounded-xl mb-6 flex flex-col items-center gap-3 text-center">
                                <AlertCircle className="w-8 h-8 flex-shrink-0" />
                                <span className="text-sm">
                                    Your account has been created and is <b>pending approval</b>.
                                    <br /><br />
                                    Please contact an administrator to activate your access.
                                </span>
                            </div>
                            <button
                                onClick={() => {
                                    logout();
                                    setPendingApproval(false);
                                    setIsSignup(false);
                                }}
                                className="btn btn-secondary"
                                style={{ width: '100%' }}
                            >
                                <LogIn size={20} style={{ transform: 'rotate(180deg)' }} />
                                Sign Out
                            </button>
                        </div>
                    ) : (
                        <>
                            <h2 className="text-gradient" style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                                {isReset ? t('auth.resetPassword') : (isSignup ? t('auth.createAccount') : t('auth.welcomeBack'))}
                            </h2>
                            <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
                                {isReset
                                    ? t('auth.enterEmailRecovery')
                                    : (isSignup ? t('auth.startJourney') : t('auth.continueProgress'))}
                            </p>

                            {error && (
                                <div className={`bg-${error.includes('Check your email') ? 'green' : 'red'}-500/20 border border-${error.includes('Check your email') ? 'green' : 'red'}-500/50 text-${error.includes('Check your email') ? 'green' : 'red'}-200 p-3 rounded-xl mb-6 flex items-center gap-3`} style={{ marginTop: '1rem' }}>
                                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                    <span className="text-sm">{error}</span>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="flex-col fade-in" style={{ gap: '1rem', animationDelay: '0.1s', marginTop: '1rem' }}>
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

                                {!isReset && (
                                    <div className="input-group">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            ref={passwordRef}
                                            required
                                            placeholder={t('auth.passwordPlaceholder')}
                                            className="input-field"
                                        />
                                        <Lock className="input-icon" size={20} />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            style={{
                                                position: 'absolute',
                                                right: '1rem',
                                                background: 'none',
                                                border: 'none',
                                                color: 'var(--text-muted)',
                                                cursor: 'pointer',
                                                padding: 0,
                                                display: 'flex',
                                                alignItems: 'center'
                                            }}
                                        >
                                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                )}

                                {!isReset && !isSignup && (
                                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                        <button
                                            type="button"
                                            onClick={() => { setError(''); setIsReset(true); }}
                                            style={{ color: 'var(--accent-secondary)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', opacity: 0.8 }}
                                        >
                                            {t('auth.forgotPassword')}
                                        </button>
                                    </div>
                                )}

                                <button
                                    disabled={loading}
                                    className="btn btn-primary"
                                    style={{ width: '100%', marginTop: '0.5rem' }}
                                >
                                    {loading ? t('auth.loading') : (
                                        <>
                                            <LogIn size={20} />
                                            {isReset ? t('auth.sendResetLink') : (isSignup ? t('auth.signUp') : t('auth.signIn'))}
                                        </>
                                    )}
                                </button>
                            </form>

                            <div style={{ marginTop: '1rem' }}></div>

                            <p style={{ marginTop: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                {isReset ? (
                                    <button
                                        onClick={() => { setError(''); setIsReset(false); }}
                                        style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                                    >
                                        {t('auth.backToLogin')}
                                    </button>
                                ) : (
                                    <>
                                        {isSignup ? t('auth.alreadyAccount') : t('auth.noAccount')}{" "}
                                        <button
                                            onClick={() => { setError(''); setIsSignup(!isSignup); }}
                                            style={{ color: 'var(--accent-secondary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                                        >
                                            {isSignup ? t('auth.signIn') : t('auth.signUp')}
                                        </button>
                                    </>
                                )}
                            </p>
                        </>
                    )}
                </div>
            </div>

            <a href="/privacy" style={{ marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem', textDecoration: 'none', opacity: 0.8, display: 'block', textAlign: 'center' }}>
                Privacy Policy
            </a>
        </div>
    );
}

