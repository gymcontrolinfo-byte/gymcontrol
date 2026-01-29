
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Tag, Plus, Play, Trash2, Dumbbell, X, Check } from 'lucide-react';
import { getExercises, deleteExercise, subscribe } from '../services/db';
import { useTranslation } from 'react-i18next';

import Modal from '../components/Modal';
import ExerciseForm from '../components/ExerciseForm';
import ExerciseDetail from '../components/ExerciseDetail';
import MuscleManager from '../components/MuscleManager';

const Library = () => {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const [selection, setSelection] = useState(new Set());
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [exercises, setExercises] = useState([]);
    const [filter, setFilter] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isManagerOpen, setIsManagerOpen] = useState(false);
    const [selectedExercise, setSelectedExercise] = useState(null);
    const [sharedUrl, setSharedUrl] = useState('');
    const [sharedTitle, setSharedTitle] = useState('');

    useEffect(() => {
        // Subscribe to DB changes
        const unsubscribe = subscribe((data) => {
            setExercises(data.exercises || []);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const url = searchParams.get('sharedUrl');
        const title = searchParams.get('sharedTitle');
        if (url) {
            setSharedUrl(url);
            if (title) setSharedTitle(title);
            setIsModalOpen(true);
            // Optionally clear params to prevent reopening, but requires navigation context or helper
            // For now, just relying on state.
        }
    }, [searchParams]);

    // ... (keep PWA logic same) ...

    const handleSaved = (newExercise) => {
        setExercises(getExercises());
        setIsModalOpen(false);
        setSharedUrl('');
        setSharedTitle('');
    };

    const handleDelete = (id, e) => {
        if (e) e.stopPropagation();
        if (window.confirm(t('library.deleteConfirm'))) {
            deleteExercise(id);
            setExercises(getExercises());
        }
    };

    const handleBatchDelete = () => {
        if (window.confirm(`${t('common.delete')} ${selection.size} items?`)) { // Ideally add specific translation key
            selection.forEach(id => deleteExercise(id));
            setExercises(getExercises());
            setSelection(new Set());
            setIsSelectionMode(false);
        }
    };

    const toggleSelection = (id) => {
        setSelection(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const handleCardClick = (ex) => {
        if (isSelectionMode) {
            toggleSelection(ex.id);
        } else {
            setSelectedExercise(ex);
        }
    };

    const toggleSelectionMode = () => {
        setIsSelectionMode(prev => {
            if (prev) setSelection(new Set()); // Clear on exit
            return !prev;
        });
    };

    const filtered = exercises.filter(ex => ex.name.toLowerCase().includes(filter.toLowerCase()));

    return (
        <div className="flex-col" style={{ gap: '1.5rem', paddingBottom: '5rem' }}>

            {/* Controls */}
            <div className="flex-center" style={{ gap: '1rem' }}>
                {isSelectionMode ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--bg-secondary)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)' }}>
                        <span style={{ fontWeight: 600 }}>{selection.size} Selected</span>
                        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
                            <button
                                className="btn-icon"
                                onClick={handleBatchDelete}
                                disabled={selection.size === 0}
                                style={{ color: 'var(--accent-danger)' }}
                            >
                                <Trash2 size={24} />
                            </button>
                            <button
                                className="btn-icon"
                                onClick={toggleSelectionMode}
                            >
                                <X size={24} />
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div style={{ position: 'relative', flex: 1 }}>
                            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                placeholder={t('library.searchPlaceholder')}
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.8rem 1rem 0.8rem 2.8rem',
                                    borderRadius: 'var(--radius-full)',
                                    border: '1px solid var(--glass-border)',
                                    background: 'var(--bg-secondary)',
                                    color: 'white',
                                    outline: 'none'
                                }}
                            />
                        </div>
                        <button
                            className="btn btn-secondary btn-icon"
                            onClick={toggleSelectionMode}
                            style={{ borderRadius: 'var(--radius-full)', width: '48px', height: '48px', color: isSelectionMode ? 'var(--accent-primary)' : 'inherit' }}
                            title="Batch Delete"
                        >
                            <Trash2 size={20} style={{ minWidth: '20px', minHeight: '20px' }} />
                        </button>
                        <button
                            className="btn btn-secondary btn-icon"
                            onClick={() => setIsManagerOpen(true)}
                            style={{ borderRadius: 'var(--radius-full)', width: '48px', height: '48px' }}
                            title={t('library.manageMuscles')}
                        >
                            <Tag size={20} style={{ minWidth: '20px', minHeight: '20px' }} />
                        </button>
                        <button
                            className="btn btn-primary btn-icon"
                            onClick={() => setIsModalOpen(true)}
                            style={{ borderRadius: 'var(--radius-full)', width: '48px', height: '48px' }}
                        >
                            <Plus size={24} style={{ minWidth: '24px', minHeight: '24px' }} />
                        </button>
                    </>
                )}
            </div>

            {/* List */}
            {filtered.length === 0 ? (
                <div className="glass-card flex-center flex-col" style={{ padding: '3rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                    <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '50%', marginBottom: '1rem' }}>
                        <Play size={32} />
                    </div>
                    <p>{t('library.noExercises')}</p>
                    <p style={{ fontSize: '0.9rem' }}>{t('library.addFirst')}</p>
                </div>
            ) : (
                <div className="flex-col" style={{ gap: '2rem' }}>
                    {Object.entries(filtered.reduce((acc, ex) => {
                        const group = ex.muscle || t('library.other');
                        if (!acc[group]) acc[group] = [];
                        acc[group].push(ex);
                        return acc;
                    }, {})).sort().map(([group, groupExercises]) => (
                        <div key={group} className="fade-in">
                            <h3 style={{
                                fontSize: '1.2rem',
                                marginBottom: '1rem',
                                color: 'var(--accent-primary)',
                                borderBottom: '1px solid var(--glass-border)',
                                paddingBottom: '0.5rem',
                                textTransform: 'capitalize'
                            }}>
                                {group} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>({groupExercises.length})</span>
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem' }}>
                                {groupExercises.map(ex => (
                                    <div
                                        key={ex.id}
                                        className="glass-card"
                                        style={{
                                            overflow: 'hidden',
                                            position: 'relative',
                                            cursor: 'pointer',
                                            border: isSelectionMode && selection.has(ex.id) ? '2px solid var(--accent-primary)' : '1px solid var(--glass-border)',
                                            transform: isSelectionMode && selection.has(ex.id) ? 'scale(0.98)' : 'scale(1)',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onClick={() => handleCardClick(ex)}
                                    >
                                        <div style={{ position: 'relative', paddingTop: '56.25%', background: '#000' }}>
                                            {ex.thumbnail ? (
                                                <img
                                                    src={ex.thumbnail}
                                                    alt={ex.name}
                                                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }}
                                                />
                                            ) : (
                                                <div style={{
                                                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    background: 'linear-gradient(135deg, var(--bg-secondary), var(--bg-primary))'
                                                }}>
                                                    <Dumbbell size={32} color="var(--text-muted)" />
                                                </div>
                                            )}

                                            {isSelectionMode ? (
                                                <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', width: '24px', height: '24px', borderRadius: '50%', background: selection.has(ex.id) ? 'var(--accent-primary)' : 'rgba(0,0,0,0.5)', border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    {selection.has(ex.id) && <Check size={16} color="white" />}
                                                </div>
                                            ) : (
                                                ex.videoId && (
                                                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(0,0,0,0.5)', borderRadius: '50%', padding: '0.5rem' }}>
                                                        <Play size={20} fill="white" stroke="white" />
                                                    </div>
                                                )
                                            )}
                                        </div>
                                        <div style={{ padding: '0.8rem' }}>
                                            <div style={{ fontWeight: 600, fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ex.name}</div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                                                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{ex.type}</span>
                                                {!isSelectionMode && (
                                                    <button
                                                        onClick={(e) => handleDelete(ex.id, e)}
                                                        style={{ background: 'none', border: 'none', color: 'var(--accent-danger)', cursor: 'pointer', opacity: 0.7 }}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={t('library.newExercise')}>
                <ExerciseForm onSave={handleSaved} onCancel={() => setIsModalOpen(false)} initialUrl={sharedUrl} initialTitle={sharedTitle} />
            </Modal>

            {/* Detail Modal */}
            <Modal isOpen={!!selectedExercise} onClose={() => setSelectedExercise(null)} title={selectedExercise?.name || 'Exercise'}>
                {selectedExercise && (
                    <ExerciseDetail
                        exercise={selectedExercise}
                        onClose={() => setSelectedExercise(null)}
                    />
                )}
            </Modal>

            {/* Muscle Manager Modal */}
            <Modal isOpen={isManagerOpen} onClose={() => setIsManagerOpen(false)} title={t('library.manageMuscles')}>
                <MuscleManager onClose={() => setIsManagerOpen(false)} />
            </Modal>
        </div>
    );
};

export default Library;
