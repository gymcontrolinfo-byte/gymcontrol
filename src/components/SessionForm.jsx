import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { getExercises, saveSession, getMuscles } from '../services/db';
import { Plus, Trash2, Save, Search, Filter, Play, Link, Unlink, MessageSquareText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';

import ExerciseDetail from './ExerciseDetail';

const MUSCLE_ORDER = ['Chest', 'Back', 'Legs', 'Shoulders', 'Biceps', 'Triceps', 'Core', 'Full Body'];

const SessionForm = ({ onSave, onCancel, initialData }) => {
    const { t } = useTranslation();
    const [name, setName] = useState('');
    const [selectedExercises, setSelectedExercises] = useState([]); // { exerciseId, sets, reps, weight, videoId, thumbnail }
    const [availableExercises, setAvailableExercises] = useState([]);
    const [muscles, setMuscles] = useState([]);
    const [isAdding, setIsAdding] = useState(false);
    const [search, setSearch] = useState('');
    const [muscleFilter, setMuscleFilter] = useState('');
    const [subMuscleFilter, setSubMuscleFilter] = useState('');
    const [selectedForGroup, setSelectedForGroup] = useState([]); // Array of indices selected for grouping

    // Video Preview State
    const [previewVideoId, setPreviewVideoId] = useState(null);

    useEffect(() => {
        setAvailableExercises(getExercises());

        const rawMuscles = Object.keys(getMuscles());
        const sortedMuscles = rawMuscles.sort((a, b) => {
            const idxA = MUSCLE_ORDER.indexOf(a);
            const idxB = MUSCLE_ORDER.indexOf(b);
            if (idxA === -1 && idxB === -1) return a.localeCompare(b);
            if (idxA === -1) return 1;
            if (idxB === -1) return -1;
            return idxA - idxB;
        });
        setMuscles(sortedMuscles);
    }, []);

    useEffect(() => {
        if (initialData) {
            setName(initialData.name);
            // Ensure we have thumbnails for selected exercises in case they were not in the saved session data (older data)
            // Ideally we re-fetch metadata from availableExercises but existing data should be fine.
            // We need to map available exercises to get thumbnails/videoIds if missing.
            const allEx = getExercises();
            const populated = initialData.exercises.map(item => {
                const ex = allEx.find(e => e.id === item.exerciseId);
                return {
                    ...item,
                    thumbnail: item.thumbnail || ex?.thumbnail,
                    videoId: item.videoId || ex?.videoId
                };
            });
            setSelectedExercises(populated);
        }
    }, [initialData]);

    const handleAddExercise = (ex) => {
        setSelectedExercises([
            ...selectedExercises,
            {
                exerciseId: ex.id,
                name: ex.name, // denormalized for display
                sets: 3,
                reps: 10,
                weight: 0,
                rest: 60,
                thumbnail: ex.thumbnail,
                videoId: ex.videoId
            }
        ]);
        setIsAdding(false);
        setSearch('');
        setMuscleFilter('');
        setSubMuscleFilter('');
    };

    const handleRemoveExercise = (idx) => {
        const newEx = [...selectedExercises];
        newEx.splice(idx, 1);
        setSelectedExercises(newEx);
    };

    const handleUpdateDetails = (idx, field, value) => {
        const newEx = [...selectedExercises];
        newEx[idx][field] = value;
        setSelectedExercises(newEx);
    };

    const toggleSelection = (idx) => {
        if (selectedForGroup.includes(idx)) {
            setSelectedForGroup(selectedForGroup.filter(i => i !== idx));
        } else {
            setSelectedForGroup([...selectedForGroup, idx]);
        }
    };

    const handleCreateSuperset = () => {
        if (selectedForGroup.length < 2) return;
        const newEx = [...selectedExercises];
        const newSupersetId = uuidv4();

        selectedForGroup.forEach(idx => {
            newEx[idx].supersetId = newSupersetId;
        });

        setSelectedExercises(newEx);
        setSelectedForGroup([]);
    };

    const handleUngroup = (supersetId) => {
        const newEx = selectedExercises.map(ex => {
            if (ex.supersetId === supersetId) {
                const { supersetId, ...rest } = ex;
                return rest;
            }
            return ex;
        });
        setSelectedExercises(newEx);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim()) return alert(t('planner.errorName'));
        if (selectedExercises.length === 0) return alert(t('planner.errorExercise'));

        const session = {
            id: initialData ? initialData.id : uuidv4(), // Preserve ID if editing
            name,


            exercises: selectedExercises,
            createdAt: initialData ? initialData.createdAt : new Date().toISOString()
        };
        saveSession(session);
        onSave(session);
    };

    const filteredAvailable = availableExercises.filter(ex => {
        const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase());
        const matchesMuscle = muscleFilter ? ex.muscle === muscleFilter : true;
        const matchesSubMuscle = subMuscleFilter ? ex.subMuscle === subMuscleFilter : true;
        return matchesSearch && matchesMuscle && matchesSubMuscle;
    });

    const handlePreview = (e, exercise) => {
        e.stopPropagation(); // Prevent adding the exercise when clicking play
        // If it's a selected exercise (light object), try to find full object in availableExercises for better details
        const fullExercise = availableExercises.find(ex => ex.id === exercise.exerciseId || ex.id === exercise.id) || exercise;
        setPreviewVideoId(fullExercise);
    };

    const allMuscles = getMuscles();
    const subOptions = muscleFilter ? (allMuscles[muscleFilter] || []) : [];

    return (
        <form onSubmit={handleSubmit} className="flex-col" style={{ gap: '1rem', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

            <div className="flex-col" style={{ gap: '0.5rem' }}>
                <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t('planner.sessionName')}</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Chest Day A"
                    style={{
                        width: '100%',
                        padding: '0.8rem',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: 'var(--radius-md)',
                        color: 'white',
                        outline: 'none'
                    }}
                />
            </div>



            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: '200px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{t('planner.exercisesCount', { count: selectedExercises.length })}</h4>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {selectedForGroup.length >= 2 && (
                            <button
                                type="button"
                                onClick={handleCreateSuperset}
                                className="btn btn-primary"
                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: 'var(--accent-primary)' }}
                            >
                                <Link size={14} /> {t('planner.group')}
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => setIsAdding(true)}
                            className="btn btn-secondary"
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                        >
                            <Plus size={14} /> {t('planner.addExercise')}
                        </button>
                    </div>
                </div>

                {(() => {
                    const elements = [];
                    for (let i = 0; i < selectedExercises.length; i++) {
                        const item = selectedExercises[i];

                        // Check if part of a Superset
                        if (item.supersetId) {
                            const supersetGroup = [item];
                            let j = i + 1;
                            while (j < selectedExercises.length && selectedExercises[j].supersetId === item.supersetId) {
                                supersetGroup.push(selectedExercises[j]);
                                j++;
                            }

                            // Get Rounds (sets) from the first item (all should be synced)
                            const rounds = supersetGroup[0].sets;

                            elements.push(
                                <div key={`group-${i}`} className="glass-card fade-in" style={{ padding: '0', overflow: 'hidden', borderLeft: '4px solid var(--accent-primary)', background: 'rgba(139, 92, 246, 0.05)', marginBottom: '1rem' }}>
                                    {/* Superset Header */}
                                    <div style={{
                                        padding: '0.5rem 1rem',
                                        background: 'rgba(139, 92, 246, 0.15)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        borderBottom: '1px solid rgba(139, 92, 246, 0.2)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-primary)', fontSize: '0.9rem', fontWeight: 700 }}>
                                            <Link size={16} /> SUPERSET / BISERIES
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{t('planner.rounds')}:</span>
                                            <input
                                                type="number"
                                                value={rounds}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    // Update sets for ALL exercises in this superset
                                                    const newEx = [...selectedExercises];
                                                    // Loop through the specific indices of this group
                                                    for (let k = i; k < j; k++) {
                                                        newEx[k].sets = val === '' ? '' : Number(val);
                                                    }
                                                    setSelectedExercises(newEx);
                                                }}
                                                style={{
                                                    width: '50px',
                                                    padding: '0.2rem',
                                                    textAlign: 'center',
                                                    background: 'var(--bg-primary)',
                                                    border: '1px solid var(--accent-primary)',
                                                    borderRadius: '4px',
                                                    color: 'white',
                                                    fontWeight: 'bold'
                                                }}
                                            />
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>Rest (s):</span>
                                            <input
                                                type="number"
                                                value={supersetGroup[0].rest || 60}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    const newEx = [...selectedExercises];
                                                    for (let k = i; k < j; k++) {
                                                        newEx[k].rest = val === '' ? '' : Number(val);
                                                    }
                                                    setSelectedExercises(newEx);
                                                }}
                                                style={{
                                                    width: '50px',
                                                    padding: '0.2rem',
                                                    textAlign: 'center',
                                                    background: 'var(--bg-primary)',
                                                    border: '1px solid var(--accent-primary)',
                                                    borderRadius: '4px',
                                                    color: 'white',
                                                    fontWeight: 'bold'
                                                }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleUngroup(item.supersetId)}
                                                style={{ marginLeft: '0.5rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                                                title="Ungroup"
                                            >
                                                <Unlink size={14} /> {t('planner.ungroup')}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Exercises in Group */}
                                    <div style={{ padding: '0.5rem' }}>
                                        {supersetGroup.map((subEx, sIdx) => {
                                            const globalIdx = i + sIdx;
                                            return (
                                                <div key={globalIdx} style={{
                                                    padding: '0.8rem',
                                                    borderBottom: sIdx < supersetGroup.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                                                    position: 'relative'
                                                }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            {/* Checkbox intentionally disabled/hidden for grouped items in this view or kept for other logic? Keeping it simple for now, can't group already grouped items easily without bugs */}
                                                            {subEx.thumbnail && (
                                                                <div
                                                                    onClick={(e) => handlePreview(e, subEx)}
                                                                    style={{ position: 'relative', width: 40, height: 22, cursor: 'pointer' }}
                                                                >
                                                                    <img src={subEx.thumbnail} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }} alt="" />
                                                                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)' }}>
                                                                        <Play size={10} fill="white" color="white" />
                                                                    </div>
                                                                </div>
                                                            )}
                                                            <div className="flex-col">
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                                    <span style={{ fontWeight: 600, color: 'white' }}>{subEx.name}</span>
                                                                    {availableExercises.find(e => e.id === subEx.exerciseId)?.notes && (
                                                                        <div title={availableExercises.find(e => e.id === subEx.exerciseId).notes} style={{ color: 'var(--accent-primary)', cursor: 'help' }}>
                                                                            <MessageSquareText size={12} />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <button type="button" onClick={() => handleRemoveExercise(globalIdx)} style={{ background: 'none', border: 'none', color: 'var(--accent-danger)', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                                    </div>

                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                                        <div className="flex-col" style={{ minWidth: 0 }}>
                                                            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t('planner.reps')}</label>
                                                            <input type="number" value={subEx.reps} onChange={(e) => handleUpdateDetails(globalIdx, 'reps', e.target.value === '' ? '' : Number(e.target.value))} style={{ background: 'var(--bg-primary)', border: 'none', color: 'white', padding: '0.3rem', borderRadius: '4px', width: '100%' }} />
                                                        </div>
                                                        <div className="flex-col" style={{ minWidth: 0 }}>
                                                            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t('planner.kg')}</label>
                                                            <input type="number" value={subEx.weight} onChange={(e) => handleUpdateDetails(globalIdx, 'weight', e.target.value === '' ? '' : Number(e.target.value))} style={{ background: 'var(--bg-primary)', border: 'none', color: 'white', padding: '0.3rem', borderRadius: '4px', width: '100%' }} />
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );

                            i = j - 1; // Skip the processed group
                        } else {
                            // Render Normal Exercise
                            elements.push(
                                <div key={i} className="glass-card fade-in" style={{
                                    padding: '0.8rem',
                                    border: '1px solid var(--glass-border)',
                                    marginBottom: '1rem',
                                    position: 'relative'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <input
                                                type="checkbox"
                                                checked={selectedForGroup.includes(i)}
                                                onChange={() => toggleSelection(i)}
                                                style={{ width: '16px', height: '16px', accentColor: 'var(--accent-primary)' }}
                                            />
                                            {item.thumbnail && (
                                                <div
                                                    onClick={(e) => handlePreview(e, item)}
                                                    style={{ position: 'relative', width: 40, height: 22, cursor: 'pointer' }}
                                                >
                                                    <img src={item.thumbnail} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }} alt="" />
                                                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)' }}>
                                                        <Play size={10} fill="white" color="white" />
                                                    </div>
                                                </div>
                                            )}
                                            <div className="flex-col">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                    <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{item.name}</span>
                                                    {availableExercises.find(e => e.id === item.exerciseId)?.notes && (
                                                        <div title={availableExercises.find(e => e.id === item.exerciseId).notes} style={{ color: 'var(--accent-primary)', cursor: 'help' }}>
                                                            <MessageSquareText size={12} />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button type="button" onClick={() => handleRemoveExercise(i)} style={{ background: 'none', border: 'none', color: 'var(--accent-danger)', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.5rem' }}>
                                        <div className="flex-col" style={{ minWidth: 0 }}>
                                            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t('planner.sets')}</label>
                                            <input type="number" value={item.sets} onChange={(e) => handleUpdateDetails(i, 'sets', e.target.value === '' ? '' : Number(e.target.value))} style={{ background: 'var(--bg-primary)', border: 'none', color: 'white', padding: '0.3rem', borderRadius: '4px', width: '100%' }} />
                                        </div>
                                        <div className="flex-col" style={{ minWidth: 0 }}>
                                            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t('planner.reps')}</label>
                                            <input type="number" value={item.reps} onChange={(e) => handleUpdateDetails(i, 'reps', e.target.value === '' ? '' : Number(e.target.value))} style={{ background: 'var(--bg-primary)', border: 'none', color: 'white', padding: '0.3rem', borderRadius: '4px', width: '100%' }} />
                                        </div>
                                        <div className="flex-col" style={{ minWidth: 0 }}>
                                            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t('planner.kg')}</label>
                                            <input type="number" value={item.weight} onChange={(e) => handleUpdateDetails(i, 'weight', e.target.value === '' ? '' : Number(e.target.value))} style={{ background: 'var(--bg-primary)', border: 'none', color: 'white', padding: '0.3rem', borderRadius: '4px', width: '100%' }} />
                                        </div>
                                        <div className="flex-col" style={{ minWidth: 0 }}>
                                            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Rest (s)</label>
                                            <input type="number" value={item.rest || 60} onChange={(e) => handleUpdateDetails(i, 'rest', e.target.value === '' ? '' : Number(e.target.value))} style={{ background: 'var(--bg-primary)', border: 'none', color: 'white', padding: '0.3rem', borderRadius: '4px', width: '100%' }} />
                                        </div>
                                    </div>
                                </div>
                            );
                        }
                    }
                    return elements;
                })()}
            </div>

            {/* Exercise Selector Overlay */}
            {isAdding && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'var(--bg-secondary)',
                    zIndex: 20,
                    padding: '1rem',
                    display: 'flex', flexDirection: 'column', gap: '1rem'
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <div style={{ position: 'relative', flex: 1 }}>
                                <input
                                    autoFocus
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder={t('library.searchPlaceholder')}
                                    style={{ width: '100%', padding: '0.5rem', paddingLeft: '2rem', borderRadius: '4px', border: '1px solid var(--glass-border)', background: 'var(--bg-primary)', color: 'white' }}
                                />
                                <Search size={14} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            </div>
                            <button type="button" onClick={() => setIsAdding(false)} className="btn btn-secondary">{t('common.cancel')}</button>
                        </div>

                        {/* Muscle Filter Scroll */}
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', paddingBottom: '0.5rem', maxHeight: '80px', overflowY: 'auto' }}>
                            <button
                                type="button"
                                onClick={() => { setMuscleFilter(''); setSubMuscleFilter(''); }}
                                style={{
                                    padding: '0.3rem 0.8rem',
                                    borderRadius: '20px',
                                    border: '1px solid var(--glass-border)',
                                    background: muscleFilter === '' ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)',
                                    color: 'white',
                                    fontSize: '0.8rem',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                {t('planner.all')}
                            </button>
                            {muscles.map(m => (
                                <button
                                    key={m}
                                    type="button"
                                    onClick={() => { setMuscleFilter(m); setSubMuscleFilter(''); }}
                                    style={{
                                        padding: '0.3rem 0.8rem',
                                        borderRadius: '20px',
                                        border: '1px solid var(--glass-border)',
                                        background: muscleFilter === m ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)',
                                        color: 'white',
                                        fontSize: '0.8rem',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>

                        {/* Sub-Muscle Filter Scroll (Conditional) */}
                        {subOptions.length > 0 && (
                            <div className="fade-in" style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', scrollbarWidth: 'none', marginLeft: '0.5rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setSubMuscleFilter('')}
                                    style={{
                                        padding: '0.2rem 0.6rem',
                                        borderRadius: '16px',
                                        border: '1px solid var(--glass-border)',
                                        background: subMuscleFilter === '' ? 'var(--accent-secondary)' : 'rgba(255,255,255,0.05)',
                                        color: 'white',
                                        fontSize: '0.75rem',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    All {muscleFilter}
                                </button>
                                {subOptions.map(sub => (
                                    <button
                                        key={sub}
                                        type="button"
                                        onClick={() => setSubMuscleFilter(sub)}
                                        style={{
                                            padding: '0.2rem 0.6rem',
                                            borderRadius: '16px',
                                            border: '1px solid var(--glass-border)',
                                            background: subMuscleFilter === sub ? 'var(--accent-secondary)' : 'rgba(255,255,255,0.05)',
                                            color: 'white',
                                            fontSize: '0.75rem',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        {sub}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {filteredAvailable.map(ex => (
                            <div
                                key={ex.id}
                                style={{
                                    padding: '0.8rem',
                                    borderBottom: '1px solid var(--glass-border)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.8rem',
                                    background: 'rgba(255,255,255,0.02)'
                                }}
                            >
                                <div style={{ position: 'relative', width: 50, height: 28 }} onClick={(e) => handlePreview(e, ex)}>
                                    <img src={ex.thumbnail} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }} alt="" />
                                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)' }}>
                                        <Play size={12} fill="white" color="white" />
                                    </div>
                                </div>
                                <div
                                    style={{ flex: 1 }}
                                    onClick={() => handleAddExercise(ex)}
                                >
                                    <div style={{ fontSize: '0.9rem' }}>{ex.name}</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{ex.muscle}</div>
                                </div>
                                <Plus size={16} color="var(--accent-primary)" onClick={() => handleAddExercise(ex)} />
                            </div>
                        ))}
                        {filteredAvailable.length === 0 && (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                {t('library.noExercises')}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', marginTop: 'auto', paddingTop: '1rem' }}>
                <button type="button" onClick={onCancel} className="btn btn-secondary" style={{ flex: 1 }}>{t('common.cancel')}</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                    <Save size={18} /> {initialData ? t('common.save') : t('common.save')}
                    {/* Simplified for now, or add specific keys for Update vs Save Plan */}
                </button>
            </div>

            {/* Exercise Detail Modal */}
            <Modal isOpen={!!previewVideoId} onClose={() => setPreviewVideoId(null)} title={previewVideoId?.name || 'Exercise Detail'}>
                {previewVideoId && (
                    <ExerciseDetail
                        exercise={previewVideoId}
                        onClose={() => setPreviewVideoId(null)}
                    />
                )}
            </Modal>
        </form>
    );
};

export default SessionForm;
