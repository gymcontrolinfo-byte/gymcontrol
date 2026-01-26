
import React, { useState } from 'react';
import { Calendar, ChevronDown, ChevronRight, Dumbbell, Zap, Info, Flame, Activity } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Tips = () => {
    const { t } = useTranslation();
    const [openSection, setOpenSection] = useState(null);

    const toggle = (section) => {
        setOpenSection(openSection === section ? null : section);
    };

    return (
        <div className="flex-col" style={{ gap: '1.5rem', paddingBottom: '6rem' }}>
            <h2 className="text-gradient">{t('tips.mainTitle')}</h2>

            {/* Weekly Schedules */}
            <Section
                title={t('tips.weekly.title')}
                icon={<Calendar size={24} color="var(--accent-primary)" />}
                isOpen={openSection === 'weekly'}
                onClick={() => toggle('weekly')}
            >
                <div className="flex-col" style={{ gap: '1.5rem' }}>
                    <div className="tip-block">
                        <h4>{t('tips.weekly.ppl.title')}</h4>
                        <p>{t('tips.weekly.ppl.desc')}</p>
                        <ul>
                            <li><strong>{t('tips.weekly.ppl.push')}</strong></li>
                            <li><strong>{t('tips.weekly.ppl.pull')}</strong></li>
                            <li><strong>{t('tips.weekly.ppl.legs')}</strong></li>
                        </ul>
                    </div>
                    <div className="tip-block">
                        <h4>{t('tips.weekly.upperLower.title')}</h4>
                        <p>{t('tips.weekly.upperLower.desc')}</p>
                        <ul>
                            <li><strong>{t('tips.weekly.upperLower.upper')}</strong></li>
                            <li><strong>{t('tips.weekly.upperLower.lower')}</strong></li>
                        </ul>
                    </div>
                    <div className="tip-block">
                        <h4>{t('tips.weekly.fullBody.title')}</h4>
                        <p>{t('tips.weekly.fullBody.desc')}</p>
                        <ul>
                            <li><strong>{t('tips.weekly.fullBody.schedule')}</strong></li>
                        </ul>
                    </div>
                </div>
            </Section>

            {/* Muscle Guide */}
            <Section
                title={t('tips.muscles.title')}
                icon={<Dumbbell size={24} color="var(--accent-secondary)" />}
                isOpen={openSection === 'muscles'}
                onClick={() => toggle('muscles')}
            >
                <div style={{ display: 'grid', gap: '1rem' }}>
                    <MuscleRow muscle={t('tips.muscles.chest')} exercises="Bench Press, Incline DB Press, Cable Flys, Dips" />
                    <MuscleRow muscle={t('tips.muscles.back')} exercises="Pull-ups, Barbell Rows, Lat Pulldowns, Face Pulls" />
                    <MuscleRow muscle={t('tips.muscles.legs')} exercises="Squats, RDLs, Lunges, Leg Extensions, Calf Raises" />
                    <MuscleRow muscle={t('tips.muscles.shoulders')} exercises="Overhead Press, Lateral Raises, Rear Delt Flys" />
                    <MuscleRow muscle={t('tips.muscles.biceps')} exercises="Barbell Curls, Hammer Curls, Preacher Curls" />
                    <MuscleRow muscle={t('tips.muscles.triceps')} exercises="Skullcrushers, Tricep Pushdowns, Overhead Extensions" />
                    <MuscleRow muscle={t('tips.muscles.core')} exercises="Hanging Leg Raises, Planks, Cable Crunches" />
                </div>
            </Section>

            {/* Techniques */}
            <Section
                title={t('tips.techniques.title')}
                icon={<Zap size={24} color="#FFD700" />}
                isOpen={openSection === 'techniques'}
                onClick={() => toggle('techniques')}
            >
                <div className="flex-col" style={{ gap: '1rem' }}>
                    <Technique
                        name={t('tips.techniques.supersets.name')}
                        desc={t('tips.techniques.supersets.desc')}
                    />
                    <Technique
                        name={t('tips.techniques.dropsets.name')}
                        desc={t('tips.techniques.dropsets.desc')}
                    />
                    <Technique
                        name={t('tips.techniques.pyramid.name')}
                        desc={t('tips.techniques.pyramid.desc')}
                    />
                    <Technique
                        name={t('tips.techniques.tut.name')}
                        desc={t('tips.techniques.tut.desc')}
                    />
                </div>
            </Section>

            {/* General */}
            <Section
                title={t('tips.general.title')}
                icon={<Info size={24} color="var(--text-primary)" />}
                isOpen={openSection === 'general'}
                onClick={() => toggle('general')}
            >
                <div className="flex-col" style={{ gap: '1rem' }}>
                    <div style={{ padding: '0.5rem' }}>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <Flame size={18} color="orange" /> {t('tips.general.progressive.title')}
                        </h4>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            {t('tips.general.progressive.desc')}
                        </p>
                    </div>
                    <div style={{ padding: '0.5rem' }}>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <Activity size={18} color="green" /> {t('tips.general.recovery.title')}
                        </h4>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            {t('tips.general.recovery.desc')}
                        </p>
                    </div>
                </div>
            </Section>

        </div>
    );
};

const Section = ({ title, icon, isOpen, onClick, children }) => (
    <div className="glass-card fade-in" style={{ overflow: 'hidden' }}>
        <button
            onClick={onClick}
            style={{
                width: '100%',
                padding: '1.2rem',
                background: 'transparent',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                color: 'var(--text-primary)'
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {icon}
                <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>{title}</span>
            </div>
            {isOpen ? <ChevronDown /> : <ChevronRight />}
        </button>
        {isOpen && (
            <div style={{ padding: '0 1.2rem 1.2rem 1.2rem', borderTop: '1px solid var(--glass-border)', marginTop: '-0.5rem', paddingTop: '1rem' }}>
                <div className="fade-in">
                    {children}
                </div>
            </div>
        )}
    </div>
);

const MuscleRow = ({ muscle, exercises }) => (
    <div style={{ paddingBottom: '0.8rem', borderBottom: '1px solid var(--glass-border)' }}>
        <div style={{ fontWeight: 600, color: 'var(--accent-primary)', marginBottom: '0.2rem' }}>{muscle}</div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{exercises}</div>
    </div>
);

const Technique = ({ name, desc }) => (
    <div style={{ background: 'var(--bg-secondary)', padding: '0.8rem', borderRadius: 'var(--radius-sm)' }}>
        <div style={{ fontWeight: 600, marginBottom: '0.3rem' }}>{name}</div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{desc}</div>
    </div>
);

export default Tips;
