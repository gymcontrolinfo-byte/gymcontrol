
import React, { useState, useEffect } from 'react';
import { getHistory, deleteLog } from '../services/db';
import { Calendar, Clock, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import HistoryDetails from '../components/HistoryDetails';
import { useTranslation } from 'react-i18next';

const Stats = () => {
    const { t } = useTranslation();
    const [history, setHistory] = useState([]);
    const [expanded, setExpanded] = useState({});

    useEffect(() => {
        setHistory(getHistory());
    }, []);

    const toggleExpand = (id) => {
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleDelete = (id, e) => {
        e.stopPropagation();
        if (window.confirm(t('stats.deleteLogConfirm'))) {
            deleteLog(id);
            setHistory(getHistory());
        }
    };

    const formatDate = (isoString) => {
        return new Date(isoString).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const formatDuration = (seconds) => {
        const m = Math.floor(seconds / 60);
        return `${m} min`;
    };

    return (
        <div className="flex-col" style={{ gap: '1.5rem', paddingBottom: '5rem' }}>
            <h2 className="text-gradient">{t('stats.title')}</h2>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ color: 'var(--accent-primary)', marginBottom: '0.5rem' }}><Calendar size={24} /></div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{history.length}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{t('stats.workouts')}</div>
                </div>
                <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ color: 'var(--accent-secondary)', marginBottom: '0.5rem' }}><Clock size={24} /></div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                        {history.length > 0 ? Math.round(history.reduce((acc, curr) => acc + (curr.duration || 0), 0) / history.length / 60) : 0} m
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{t('stats.avgDuration')}</div>
                </div>
            </div>

            <h3 style={{ marginTop: '1rem' }}>{t('stats.recentActivity')}</h3>

            {history.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>{t('stats.noLogs')}</div>
            ) : (
                <div className="flex-col" style={{ gap: '1rem' }}>
                    {history.map(log => (
                        <div key={log.id} className="glass-card fade-in" style={{ padding: '1rem' }}>
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
                                        {expanded[log.id] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                    </button>
                                </div>
                            </div>

                            {expanded[log.id] && (
                                <div style={{ marginTop: '1rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
                                    {log.exercises.map(ex => (
                                        <HistoryDetails key={ex.id} exercise={ex} />
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Stats;
