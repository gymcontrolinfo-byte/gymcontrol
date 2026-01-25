import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Lock, Eye, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const PrivacyPolicy = () => {
    const navigate = useNavigate();
    // Fallback translation if not yet added to translation files, 
    // but ideally we should update translation files too. 
    // For now, hardcoding english with some placeholders or structure.
    // Given the prompt didn't ask for i18n explicitly but the app uses it, 
    // I'll stick to hardcoded text for the policy content for now as policies are long 
    // and usually require specific legal text.

    return (
        <div className="flex-col flex-center" style={{ minHeight: '100vh', padding: '1rem', paddingBottom: '5rem' }}>
            <div className="glass-card" style={{ maxWidth: '800px', width: '100%', padding: '2rem' }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
                    <button
                        onClick={() => navigate(-1)}
                        className="btn-icon"
                        style={{ background: 'var(--bg-secondary)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: 'none', color: 'var(--text-primary)' }}
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div style={{ flex: 1 }}>
                        <h1 className="text-gradient" style={{ margin: 0, fontSize: '1.8rem' }}>Privacy Policy</h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>Last Updated: {new Date().toLocaleDateString()}</p>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-col" style={{ gap: '1.5rem', color: 'var(--text-primary)', lineHeight: '1.6' }}>

                    <section>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--accent-primary)' }}>
                            <Shield size={20} /> Introduction
                        </h3>
                        <p>
                            We value your privacy and are committed to protecting your personal data. This privacy policy explains how we collect, use, and share your information when you use our application.
                        </p>
                    </section>

                    <section>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--accent-primary)' }}>
                            <Eye size={20} /> Information We Collect
                        </h3>
                        <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', color: 'var(--text-secondary)' }}>
                            <li><strong>Account Information:</strong> Name, email address, and profile picture (if provided).</li>
                            <li><strong>Usage Data:</strong> Workout logs, exercises created, and app preferences.</li>
                            <li><strong>Device Data:</strong> Model, OS version, and other technical details to improve app performance.</li>
                        </ul>
                    </section>

                    <section>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--accent-primary)' }}>
                            <FileText size={20} /> How We Use Your Data
                        </h3>
                        <p>We use your data to:</p>
                        <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', color: 'var(--text-secondary)' }}>
                            <li>Provide and maintain the application.</li>
                            <li>Track your workout progress and generate statistics.</li>
                            <li>Improve our services and develop new features.</li>
                            <li>Respond to your comments and support requests.</li>
                        </ul>
                    </section>

                    <section>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--accent-primary)' }}>
                            <Lock size={20} /> Data Security
                        </h3>
                        <p>
                            We implement appropriate security measures to protect your personal information. However, no method of transmission over the Internet or electronic storage is 100% secure, so we cannot guarantee absolute security.
                        </p>
                    </section>

                    <section>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--accent-primary)' }}>
                            <ArrowLeft size={20} style={{ transform: 'rotate(180deg)' }} /> Contact Us
                        </h3>
                        <p>
                            If you have any questions about this Privacy Policy, please contact us at gymcontrolinfo@gmail.com.
                        </p>
                    </section>
                </div>

                <div style={{ marginTop: '2rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        This is a generic privacy policy template. Please consult with a legal professional to ensure compliance with local laws and regulations.
                    </p>
                </div>

            </div>
        </div>
    );
};

export default PrivacyPolicy;
