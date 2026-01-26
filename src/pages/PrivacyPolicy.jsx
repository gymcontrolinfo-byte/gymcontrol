import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Lock, Eye, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const PrivacyPolicy = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
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
                        <h1 className="text-gradient" style={{ margin: 0, fontSize: '1.8rem' }}>{t('privacy.title')}</h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>{t('privacy.lastUpdated')}: {new Date().toLocaleDateString()}</p>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-col" style={{ gap: '1.5rem', color: 'var(--text-primary)', lineHeight: '1.6' }}>

                    <section>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--accent-primary)' }}>
                            <Shield size={20} /> {t('privacy.intro.title')}
                        </h3>
                        <p>{t('privacy.intro.content')}</p>
                    </section>

                    <section>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--accent-primary)' }}>
                            <Eye size={20} /> {t('privacy.collection.title')}
                        </h3>
                        <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', color: 'var(--text-secondary)' }}>
                            <li><strong>{t('privacy.collection.items.account.title')}:</strong> {t('privacy.collection.items.account.desc')}</li>
                            <li><strong>{t('privacy.collection.items.usage.title')}:</strong> {t('privacy.collection.items.usage.desc')}</li>
                            <li><strong>{t('privacy.collection.items.device.title')}:</strong> {t('privacy.collection.items.device.desc')}</li>
                        </ul>
                    </section>

                    <section>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--accent-primary)' }}>
                            <FileText size={20} /> {t('privacy.usage.title')}
                        </h3>
                        <p>{t('privacy.usage.intro')}</p>
                        <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', color: 'var(--text-secondary)' }}>
                            <li>{t('privacy.usage.items.provide')}</li>
                            <li>{t('privacy.usage.items.track')}</li>
                            <li>{t('privacy.usage.items.improve')}</li>
                            <li>{t('privacy.usage.items.respond')}</li>
                        </ul>
                    </section>

                    <section>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--accent-primary)' }}>
                            <Lock size={20} /> {t('privacy.security.title')}
                        </h3>
                        <p>{t('privacy.security.content')}</p>
                    </section>

                    <section>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--accent-primary)' }}>
                            <ArrowLeft size={20} style={{ transform: 'rotate(180deg)' }} /> {t('privacy.contact.title')}
                        </h3>
                        <p>{t('privacy.contact.content')}</p>
                    </section>
                </div>

                <div style={{ marginTop: '2rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {t('privacy.disclaimer')}
                    </p>
                </div>

            </div>
        </div>
    );
};

export default PrivacyPolicy;
