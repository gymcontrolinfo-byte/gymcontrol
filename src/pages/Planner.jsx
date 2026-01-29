
import React, { useState, useEffect } from 'react';
import { getSessions, deleteSession, sharePlan, getPendingShares, resolveShare, saveSession, saveExercise, getExercises, toggleSessionFavorite } from '../services/db';
import Modal from '../components/Modal';
import SessionForm from '../components/SessionForm';
import { Plus, Play, Trash2, Calendar, ClipboardList, Share2, Inbox, Check, X, Download, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Planner = () => {
    const { t } = useTranslation();
    const { currentUser } = useAuth();
    const [sessions, setSessions] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSession, setEditingSession] = useState(null);

    // Sharing State
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [planToShare, setPlanToShare] = useState(null);
    const [recipientEmail, setRecipientEmail] = useState('');
    const [isInboxOpen, setIsInboxOpen] = useState(false);
    const [pendingShares, setPendingShares] = useState([]);

    const navigate = useNavigate();

    useEffect(() => {
        setSessions(getSessions());
        loadInbox();
    }, []);

    const loadInbox = async () => {
        if (currentUser?.email) {
            const shares = await getPendingShares(currentUser.email);
            setPendingShares(shares);
        }
    };

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

    // Sharing Handlers
    const openShareModal = (session, e) => {
        e.stopPropagation();
        setPlanToShare(session);
        setRecipientEmail('');
        setIsShareModalOpen(true);
    };

    const handleSendShare = async (e) => {
        e.preventDefault();
        if (!recipientEmail) return;
        try {
            // Collect exercises used in this plan
            const allExercises = getExercises();
            const usedExercises = [];
            planToShare.exercises.forEach(pe => {
                const ex = allExercises.find(e => e.id === pe.exerciseId);
                if (ex) usedExercises.push(ex);
            });

            await sharePlan(currentUser.email, recipientEmail, planToShare, usedExercises);
            alert('Plan sent successfully!');
            setIsShareModalOpen(false);
        } catch (err) {
            alert('Failed to send plan: ' + err.message);
        }
    };

    const handleAcceptShare = async (share) => {
        if (!window.confirm('Accept this plan? It will be added to your library.')) return;
        try {
            // 1. Add Exercises (avoid duplicates if possible, or overwrite? DB saveExercise logic handles upsert)
            // Ideally check if exists, but for now simple upsert is safe enough or we rely on uuid collision unlikeliness
            for (const ex of share.exercises) {
                // Should we generate new IDs? No, keep them linked.
                await saveExercise(ex);
            }

            // 2. Add Session
            // Generate NEW ID for the session so it doesn't conflict if I share back and forth?
            // Actually nice to keep ID if we want "updates", but for now unique copy is safer.
            const newSession = {
                ...share.plan,
                id: crypto.randomUUID(), // New ID for my copy
                name: `${share.plan.name} (Shared)`
            };
            await saveSession(newSession);

            // 3. Resolve
            await resolveShare(share.id);

            // Refresh
            setSessions(getSessions());
            loadInbox();
            alert('Plan added!');
        } catch (err) {
            alert('Error accepting plan: ' + err.message);
        }
    };

    const handleRejectShare = async (share) => {
        if (!window.confirm('Reject and delete this share request?')) return;
        await resolveShare(share.id);
        loadInbox();
    };

    return (
        <div className="flex-col" style={{ gap: '1.5rem', paddingBottom: '5rem' }}>

            <div className="flex-center" style={{ justifyContent: 'space-between' }}>
                <h2 className="text-gradient" style={{ margin: 0 }}>{t('planner.title')}</h2>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        className="btn btn-secondary btn-icon"
                        onClick={() => { loadInbox(); setIsInboxOpen(true); }}
                        style={{ borderRadius: 'var(--radius-full)', width: '40px', height: '40px', position: 'relative' }}
                    >
                        <Inbox size={20} style={{ minWidth: '20px', minHeight: '20px' }} />
                        {pendingShares.length > 0 && (
                            <span style={{ position: 'absolute', top: -5, right: -5, background: 'red', color: 'white', borderRadius: '50%', width: '18px', height: '18px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{pendingShares.length}</span>
                        )}
                    </button>
                    <button
                        className="btn btn-primary btn-icon"
                        onClick={() => { setEditingSession(null); setIsModalOpen(true); }}
                        style={{ borderRadius: 'var(--radius-full)', width: '40px', height: '40px' }}
                    >
                        <Plus size={20} style={{ minWidth: '20px', minHeight: '20px' }} />
                    </button>
                </div>
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
                                    <button onClick={(e) => { e.stopPropagation(); toggleSessionFavorite(session.id); setSessions([...getSessions()]); }} style={{ background: 'none', border: 'none', color: session.isFavorite ? '#ef4444' : 'var(--text-muted)', cursor: 'pointer' }}>
                                        <Heart size={18} fill={session.isFavorite ? "#ef4444" : "none"} />
                                    </button>
                                    <button onClick={(e) => openShareModal(session, e)} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer' }}><Share2 size={16} /></button>
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

            {/* Share Modal */}
            <Modal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} title="Share Plan">
                <form onSubmit={handleSendShare} className="flex-col" style={{ gap: '1rem', padding: '1rem' }}>
                    <p style={{ color: 'var(--text-secondary)' }}>Sharing: <span style={{ color: 'white', fontWeight: 'bold' }}>{planToShare?.name}</span></p>
                    <div className="flex-col">
                        <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Recipient Email</label>
                        <input
                            type="email"
                            required
                            placeholder="friend@example.com"
                            value={recipientEmail}
                            onChange={e => setRecipientEmail(e.target.value)}
                            className="glass-input"
                            style={{ padding: '0.8rem' }}
                        />
                    </div>
                    <button className="btn btn-primary">Send Plan</button>
                </form>
            </Modal>

            {/* Inbox Modal */}
            <Modal isOpen={isInboxOpen} onClose={() => setIsInboxOpen(false)} title="Inbox">
                <div className="flex-col" style={{ gap: '1rem', padding: '0.5rem', maxHeight: '60vh', overflowY: 'auto' }}>
                    {pendingShares.length === 0 ? (
                        <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No pending plans.</p>
                    ) : (
                        pendingShares.map(share => (
                            <div key={share.id} className="glass-card" style={{ padding: '1rem', border: '1px solid var(--accent-primary)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--accent-primary)' }}>From: {share.from}</span>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(share.timestamp).toLocaleDateString()}</span>
                                </div>
                                <h4 style={{ margin: '0 0 0.5rem 0' }}>{share.plan.name}</h4>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                                    {share.plan.exercises.length} Exercises including: {share.plan.exercises.slice(0, 3).map(e => e.name).join(', ')}...
                                </p>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button onClick={() => handleAcceptShare(share)} className="btn btn-primary" style={{ flex: 1, fontSize: '0.9rem', padding: '0.5rem' }}>
                                        <Download size={16} style={{ marginRight: '0.3rem' }} /> Accept
                                    </button>
                                    <button onClick={() => handleRejectShare(share)} className="btn btn-secondary" style={{ width: '40px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default Planner;
