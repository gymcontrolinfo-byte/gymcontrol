
import React, { useState, useEffect } from 'react';
import { getHistory, deleteLog, getSessions, subscribeLatestArticle } from '../services/db';
import { Calendar, Clock, Flame, ChevronRight, PlayCircle, BarChart2, Heart, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/Modal';
import HistoryDetails from '../components/HistoryDetails';

const Stats = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [history, setHistory] = useState([]);
    const [favorites, setFavorites] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const [expandedLog, setExpandedLog] = useState({});
    const [featuredArticle, setFeaturedArticle] = useState(null);

    useEffect(() => {
        const unsub = subscribeLatestArticle((data) => {
            setFeaturedArticle(data);
        });
        return () => unsub();
    }, []);

    useEffect(() => {
        setHistory(getHistory());
        setFavorites(getSessions().filter(s => s.isFavorite));
    }, []);

    const toggleExpand = (id) => {
        setExpandedLog(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleDelete = (id, e) => {
        e.stopPropagation();
        if (window.confirm(t('stats.deleteLogConfirm'))) {
            deleteLog(id);
            setHistory(getHistory());
        }
    };

    const formatDate = (isoString) => {
        return new Date(isoString).toLocaleDateString('es-MX', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const formatDuration = (seconds) => {
        const m = Math.floor(seconds / 60);
        return `${m} min`;
    };

    const totalMinutes = history.length > 0
        ? Math.round(history.reduce((acc, curr) => acc + (curr.duration || 0), 0) / 60)
        : 0;

    // Simulated Calories (approx 5 kcal/min for now)
    const calories = totalMinutes * 5;

    return (
        <div className="flex-col" style={{ gap: '1.5rem', paddingBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-1px' }}>Dashboard</h1>
            </div>

            {/* Steps / Activity Graph Simulation */}
            <div
                className="glass-card"
                style={{ padding: '1.5rem', background: '#1c1c1e', border: 'none', cursor: 'pointer' }}
                onClick={() => setShowHistory(true)}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div className="flex-center" style={{ gap: '0.5rem', color: '#9ca3af' }}>
                        <BarChart2 size={18} /> <span>Activity</span>
                    </div>
                    <ChevronRight size={18} color="#6b7280" />
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '60px', gap: '8px' }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '2rem', fontWeight: 800 }}>{history.length}</div>
                        <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Workouts</div>
                    </div>
                    {/* Fake Chart Bars */}
                    {[40, 60, 30, 80, 50, 90, 45].map((h, i) => (
                        <div key={i} style={{
                            width: '12%',
                            height: `${h}%`,
                            background: i === 5 ? 'var(--accent-highlight)' : '#3f3f46',
                            borderRadius: '4px'
                        }} />
                    ))}
                </div>
            </div>

            {/* Widget Grid */}
            <div className="widget-grid">
                <div className="stat-widget">
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div style={{ color: '#ef4444', display: 'flex', gap: '6px', alignItems: 'center', fontSize: '0.9rem', fontWeight: 600 }}>
                            <Flame size={18} fill="#ef4444" /> Calories
                        </div>
                        <ChevronRight size={16} color="#52525b" />
                    </div>
                    <div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{calories}</div>
                        <div style={{ fontSize: '0.8rem', color: '#71717a' }}>kcal burned</div>
                    </div>
                </div>

                <div className="stat-widget">
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div style={{ color: '#3b82f6', display: 'flex', gap: '6px', alignItems: 'center', fontSize: '0.9rem', fontWeight: 600 }}>
                            <Clock size={18} /> Durations
                        </div>
                        <ChevronRight size={16} color="#52525b" />
                    </div>
                    <div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{totalMinutes}</div>
                        <div style={{ fontSize: '0.8rem', color: '#71717a' }}>minutes total</div>
                    </div>
                </div>
            </div>

            {/* Favorite Workouts */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Favorite Workouts</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', cursor: 'pointer' }} onClick={() => navigate('/plan')}>View All</span>
            </div>

            {favorites.length === 0 ? (
                <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Heart size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                    <p>No favorites yet.<br />Go to Plans to add one!</p>
                </div>
            ) : (
                <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem', scrollSnapType: 'x mandatory' }}>
                    {favorites.map(fav => (
                        <div key={fav.id} className="glass-card"
                            style={{
                                minWidth: '240px',
                                padding: '1.5rem',
                                background: '#1c1c1e',
                                border: 'none',
                                scrollSnapAlign: 'start',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                height: '160px'
                            }}
                            onClick={() => navigate('/train/' + fav.id)}
                        >
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <div style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700 }}>PLAN</div>
                                    <Heart size={16} fill="#ef4444" color="#ef4444" />
                                </div>
                                <h4 style={{ fontSize: '1.2rem', fontWeight: 800, lineHeight: 1.2 }}>{fav.name}</h4>
                                <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '4px' }}>{fav.exercises.length} exercises</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-primary)', fontSize: '0.9rem', fontWeight: 600 }}>
                                <PlayCircle size={20} /> Start Workout
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Latest Article - Dynamic */}
            {featuredArticle && (
                <>
                    <h3 style={{ marginTop: '1rem', fontSize: '1.2rem', fontWeight: 700 }}>Featured Article</h3>
                    <div className="glass-card"
                        style={{
                            padding: '0',
                            overflow: 'hidden',
                            position: 'relative',
                            height: '200px',
                            border: 'none',
                            borderRadius: '1.5rem',
                            cursor: 'pointer'
                        }}
                        onClick={() => navigate(`/article/${featuredArticle.id}`)}
                    >
                        {featuredArticle.imageUrl ? (
                            <img
                                src={featuredArticle.imageUrl}
                                style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }}
                                alt={featuredArticle.title}
                            />
                        ) : (
                            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(45deg, #1c1c1e, #2d2d30)' }}></div>
                        )}

                        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', padding: '1.5rem', background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)' }}>
                            {featuredArticle.subtitle && (
                                <div style={{ display: 'inline-block', padding: '4px 12px', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)', borderRadius: '12px', fontSize: '0.7rem', marginBottom: '8px' }}>
                                    {featuredArticle.subtitle}
                                </div>
                            )}
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '4px', lineHeight: 1.2 }}>{featuredArticle.title}</h2>
                            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: '#d4d4d8', marginTop: '0.5rem' }}>
                                <span className="flex-center" style={{ gap: '4px', opacity: 0.8 }}>Read Now <ChevronRight size={14} /></span>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* History Modal */}
            <Modal isOpen={showHistory} onClose={() => setShowHistory(false)} title="Last Workouts">
                <div className="flex-col" style={{ gap: '1rem', padding: '0.5rem' }}>
                    {history.length === 0 ? (
                        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>{t('stats.noLogs')}</div>
                    ) : (
                        history.map(log => (
                            <div key={log.id} className="glass-card" style={{ padding: '1rem', border: '1px solid var(--glass-border)' }}>
                                <div
                                    onClick={() => toggleExpand(log.id)}
                                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                                >
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '1rem' }}>{log.sessionName || t('stats.defaultName')}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatDate(log.date)} • {formatDuration(log.duration)}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={(e) => handleDelete(log.id, e)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                        <button style={{ background: 'none', border: 'none', color: 'white' }}>
                                            {expandedLog[log.id] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                        </button>
                                    </div>
                                </div>

                                {expandedLog[log.id] && (
                                    <div style={{ marginTop: '1rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
                                        {log.exercises.map(ex => (
                                            <HistoryDetails key={ex.id} exercise={ex} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default Stats;
