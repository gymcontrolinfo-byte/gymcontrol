import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Lock, Eye, FileText, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const PrivacyPolicy = () => {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
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

                {/* Language Toggle */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                    <button
                        onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'es' : 'en')}
                        className="btn-secondary"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}
                    >
                        <Globe size={18} />
                        {i18n.language === 'en' ? 'Español' : 'English'}
                    </button>
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

                    <section id="deletion" style={{ padding: '1rem', background: 'rgba(255, 0, 0, 0.05)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255, 0, 0, 0.1)' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--accent-primary)' }}>
                            <Shield size={20} className="text-red-400" /> {t('privacy.deletion.title')}
                        </h3>
                        <p>{t('privacy.deletion.content')}</p>
                    </section>
                </div>

            </div>
        </div>
    );
};

export default PrivacyPolicy;
