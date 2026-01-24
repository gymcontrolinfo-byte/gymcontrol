
import React, { useState, useEffect } from 'react';
import { getSessions, deleteSession } from '../services/db';
import Modal from '../components/Modal';
import SessionForm from '../components/SessionForm';
import { Plus, Play, Trash2, Calendar, ClipboardList } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Planner = () => {
    const { t } = useTranslation();
    const [sessions, setSessions] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSession, setEditingSession] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        setSessions(getSessions());
    }, []);

    const handleSaved = () => {
        setSessions(getSessions());
        setIsModalOpen(false);
        setEditingSession(null);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingSession(null);
    };

    const handleEdit = (session, e) => {
        e.stopPropagation();
        setEditingSession(session);
        setIsModalOpen(true);
    };

    const handleDelete = (id, e) => {
        e.stopPropagation();
        if (window.confirm(t('planner.deleteSessionConfirm'))) {
            deleteSession(id);
            setSessions(getSessions());
        }
    };

    const handleStartSession = (session) => {
        navigate('/train/' + session.id);
    };

    return (
        <div className="flex-col" style={{ gap: '1.5rem', paddingBottom: '5rem' }}>

            <div className="flex-center" style={{ justifyContent: 'space-between' }}>
                <h2 className="text-gradient" style={{ margin: 0 }}>{t('planner.title')}</h2>
                <button
                    className="btn btn-primary btn-icon"
                    onClick={() => { setEditingSession(null); setIsModalOpen(true); }}
                    style={{ borderRadius: 'var(--radius-full)', width: '40px', height: '40px' }}
                >
                    <Plus size={20} />
                </button>
            </div>

            {sessions.length === 0 ? (
                <div className="glass-card flex-center flex-col" style={{ padding: '3rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                    <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '50%', marginBottom: '1rem' }}>
                        <ClipboardList size={32} />
                    </div>
                    <p>{t('planner.noPlans')}</p>
                    <button className="btn btn-secondary" style={{ marginTop: '1rem' }} onClick={() => { setEditingSession(null); setIsModalOpen(true); }}>{t('planner.createPlan')}</button>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {sessions.map(session => (
                        <div
                            key={session.id}
                            className="glass-card fade-in"
                            style={{ padding: '1.2rem', position: 'relative', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}
                            onClick={() => handleStartSession(session)}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{session.name}</h3>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button onClick={(e) => handleEdit(session, e)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8rem' }}>{t('planner.edit')}</button>
                                    <button onClick={(e) => handleDelete(session.id, e)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                </div>
                            </div>

                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                {session.exercises.length} {t('planner.exercises')}:
                                <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                                    {session.exercises.map(e => e.name).slice(0, 3).join(', ')}
                                    {session.exercises.length > 3 && '...'}
                                </span>
                            </div>

                            <button className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem', gap: '0.5rem' }}>
                                <Play size={16} fill="white" /> {t('planner.startWorkout')}
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingSession ? t('planner.editPlan') : t('planner.newPlan')}>
                <SessionForm onSave={handleSaved} onCancel={handleCloseModal} initialData={editingSession} />
            </Modal>
        </div>
    );
};

export default Planner;
