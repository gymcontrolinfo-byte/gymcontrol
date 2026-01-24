
import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { getExercises, saveSession, getMuscles } from '../services/db';
import { Plus, Trash2, Save, Search, Filter, Play, Link, Unlink } from 'lucide-react';
// import Modal from './Modal'; // Import generic Modal if needed, or inline a simple video modal

const SessionForm = ({ onSave, onCancel, initialData }) => {
    const [name, setName] = useState('');
    const [selectedExercises, setSelectedExercises] = useState([]); // { exerciseId, sets, reps, weight, videoId, thumbnail }
    const [availableExercises, setAvailableExercises] = useState([]);
    const [muscles, setMuscles] = useState([]);
    const [isAdding, setIsAdding] = useState(false);
    const [search, setSearch] = useState('');
    const [muscleFilter, setMuscleFilter] = useState('');
    const [selectedForGroup, setSelectedForGroup] = useState([]); // Array of indices selected for grouping

    // Video Preview State
    const [previewVideoId, setPreviewVideoId] = useState(null);

    useEffect(() => {
        setAvailableExercises(getExercises());
        setMuscles(Object.keys(getMuscles()));
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
                thumbnail: ex.thumbnail,
                videoId: ex.videoId
            }
        ]);
        setIsAdding(false);
        setSearch('');
        setMuscleFilter('');
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
        if (!name.trim()) return alert('Session Name Required');
        if (selectedExercises.length === 0) return alert('Add at least one exercise');

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
        return matchesSearch && matchesMuscle;
    });

    const handlePreview = (e, videoId) => {
        e.stopPropagation(); // Prevent adding the exercise when clicking play
        setPreviewVideoId(videoId);
    };

    return (
        <form onSubmit={handleSubmit} className="flex-col" style={{ gap: '1rem', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

            <div className="flex-col" style={{ gap: '0.5rem' }}>
                <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Session Name</label>
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
                    <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Exercises ({selectedExercises.length})</h4>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {selectedForGroup.length >= 2 && (
                            <button
                                type="button"
                                onClick={handleCreateSuperset}
                                className="btn btn-primary"
                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: 'var(--accent-primary)' }}
                            >
                                <Link size={14} /> Group
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => setIsAdding(true)}
                            className="btn btn-secondary"
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                        >
                            <Plus size={14} /> Add Exercise
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
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Rounds:</span>
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
                                            <button
                                                type="button"
                                                onClick={() => handleUngroup(item.supersetId)}
                                                style={{ marginLeft: '0.5rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                                                title="Ungroup"
                                            >
                                                <Unlink size={14} /> Ungroup
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
                                                                    onClick={() => setPreviewVideoId(subEx.videoId)}
                                                                    style={{ position: 'relative', width: 40, height: 22, cursor: 'pointer' }}
                                                                >
                                                                    <img src={subEx.thumbnail} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }} alt="" />
                                                                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)' }}>
                                                                        <Play size={10} fill="white" color="white" />
                                                                    </div>
                                                                </div>
                                                            )}
                                                            <div className="flex-col">
                                                                <span style={{ fontWeight: 600, color: 'white' }}>{subEx.name}</span>
                                                            </div>
                                                        </div>
                                                        <button type="button" onClick={() => handleRemoveExercise(globalIdx)} style={{ background: 'none', border: 'none', color: 'var(--accent-danger)', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                                    </div>

                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                                        <div className="flex-col" style={{ minWidth: 0 }}>
                                                            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Reps</label>
                                                            <input type="number" value={subEx.reps} onChange={(e) => handleUpdateDetails(globalIdx, 'reps', e.target.value === '' ? '' : Number(e.target.value))} style={{ background: 'var(--bg-primary)', border: 'none', color: 'white', padding: '0.3rem', borderRadius: '4px', width: '100%' }} />
                                                        </div>
                                                        <div className="flex-col" style={{ minWidth: 0 }}>
                                                            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Kg</label>
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
                                                    onClick={() => setPreviewVideoId(item.videoId)}
                                                    style={{ position: 'relative', width: 40, height: 22, cursor: 'pointer' }}
                                                >
                                                    <img src={item.thumbnail} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }} alt="" />
                                                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)' }}>
                                                        <Play size={10} fill="white" color="white" />
                                                    </div>
                                                </div>
                                            )}
                                            <div className="flex-col">
                                                <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{item.name}</span>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button type="button" onClick={() => handleRemoveExercise(i)} style={{ background: 'none', border: 'none', color: 'var(--accent-danger)', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                                        <div className="flex-col" style={{ minWidth: 0 }}>
                                            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Sets</label>
                                            <input type="number" value={item.sets} onChange={(e) => handleUpdateDetails(i, 'sets', e.target.value === '' ? '' : Number(e.target.value))} style={{ background: 'var(--bg-primary)', border: 'none', color: 'white', padding: '0.3rem', borderRadius: '4px', width: '100%' }} />
                                        </div>
                                        <div className="flex-col" style={{ minWidth: 0 }}>
                                            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Reps</label>
                                            <input type="number" value={item.reps} onChange={(e) => handleUpdateDetails(i, 'reps', e.target.value === '' ? '' : Number(e.target.value))} style={{ background: 'var(--bg-primary)', border: 'none', color: 'white', padding: '0.3rem', borderRadius: '4px', width: '100%' }} />
                                        </div>
                                        <div className="flex-col" style={{ minWidth: 0 }}>
                                            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Kg</label>
                                            <input type="number" value={item.weight} onChange={(e) => handleUpdateDetails(i, 'weight', e.target.value === '' ? '' : Number(e.target.value))} style={{ background: 'var(--bg-primary)', border: 'none', color: 'white', padding: '0.3rem', borderRadius: '4px', width: '100%' }} />
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
                                    placeholder="Search..."
                                    style={{ width: '100%', padding: '0.5rem', paddingLeft: '2rem', borderRadius: '4px', border: '1px solid var(--glass-border)', background: 'var(--bg-primary)', color: 'white' }}
                                />
                                <Search size={14} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            </div>
                            <button type="button" onClick={() => setIsAdding(false)} className="btn btn-secondary">Cancel</button>
                        </div>

                        {/* Muscle Filter Scroll */}
                        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', scrollbarWidth: 'none' }}>
                            <button
                                type="button"
                                onClick={() => setMuscleFilter('')}
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
                                All
                            </button>
                            {muscles.map(m => (
                                <button
                                    key={m}
                                    type="button"
                                    onClick={() => setMuscleFilter(m)}
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
                                <div style={{ position: 'relative', width: 50, height: 28 }} onClick={(e) => handlePreview(e, ex.videoId)}>
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
                                No exercises found.
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', marginTop: 'auto', paddingTop: '1rem' }}>
                <button type="button" onClick={onCancel} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                    <Save size={18} /> {initialData ? 'Update Plan' : 'Save Plan'}
                </button>
            </div>

            {/* Video Preview Modal */}
            {previewVideoId && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.9)', zIndex: 50,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                }} onClick={() => setPreviewVideoId(null)}>
                    <div style={{ width: '90%', maxWidth: '500px', aspectRatio: '16/9', background: 'black' }} onClick={e => e.stopPropagation()}>
                        <iframe
                            width="100%"
                            height="100%"
                            src={`https://www.youtube.com/embed/${previewVideoId}?autoplay=1`}
                            title="Preview"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    </div>
                    <button style={{ marginTop: '1rem', color: 'white', background: 'transparent', border: '1px solid white', padding: '0.5rem 1rem', borderRadius: '4px' }} onClick={() => setPreviewVideoId(null)}>
                        Close Preview
                    </button>
                </div>
            )}
        </form>
    );
};

export default SessionForm;
