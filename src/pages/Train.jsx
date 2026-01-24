
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSessions, saveLog, getExercises } from '../services/db';
import { v4 as uuidv4 } from 'uuid';
import { Timer, CheckCircle, ArrowLeft, Play, Save, Link, Repeat, Search, X } from 'lucide-react';

const Train = () => {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const [session, setSession] = useState(null);
    const [logs, setLogs] = useState({}); // { exerciseIdx: { setIdx: { reps, weight, done } } }
    const [elapsed, setElapsed] = useState(0);
    const [startTime, setStartTime] = useState(null);
    const [isActive, setIsActive] = useState(true);
    const [allExercises, setAllExercises] = useState([]);
    const [previewVideoId, setPreviewVideoId] = useState(null);

    // Swap State
    const [swapModalOpen, setSwapModalOpen] = useState(false);
    const [swapIndex, setSwapIndex] = useState(null);
    const [swapSearch, setSwapSearch] = useState('');

    useEffect(() => {
        setAllExercises(getExercises());
        const allSessions = getSessions();
        const s = allSessions.find(s => s.id === sessionId);
        if (s) {
            setSession(s);
            // Initialize logs structure
            const initialLogs = {};
            s.exercises.forEach((ex, exIdx) => {
                initialLogs[exIdx] = {};
                for (let i = 0; i < ex.sets; i++) {
                    initialLogs[exIdx][i] = {
                        reps: ex.reps,
                        weight: ex.weight,
                        done: false
                    };
                }
            });
            setLogs(initialLogs);
        } else {
            alert('Session not found');
            navigate('/plan');
        }
    }, [sessionId, navigate]);

    useEffect(() => {
        if (isActive && !startTime) {
            setStartTime(Date.now());
        }

        let interval = null;
        if (isActive) {
            interval = setInterval(() => {
                if (startTime) {
                    setElapsed(Math.floor((Date.now() - startTime) / 1000));
                }
            }, 1000);
        } else if (!isActive && interval) {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [isActive, startTime]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const handleLogChange = (exIdx, setIdx, field, value) => {
        setLogs(prev => ({
            ...prev,
            [exIdx]: {
                ...prev[exIdx],
                [setIdx]: {
                    ...prev[exIdx][setIdx],
                    [field]: field === 'done' ? value : (value === '' ? '' : Number(value))
                }
            }
        }));
    };

    const toggleSetDone = (exIdx, setIdx) => {
        handleLogChange(exIdx, setIdx, 'done', !logs[exIdx][setIdx].done);
    };

    const handleFinish = () => {
        if (!window.confirm('Finish workout and save?')) return;

        const workoutLog = {
            id: uuidv4(),
            sessionId: session.id,
            sessionName: session.name,
            date: new Date().toISOString(),
            duration: elapsed,
            exercises: session.exercises.map((ex, exIdx) => ({
                id: ex.exerciseId,
                name: ex.name,
                sets: Object.values(logs[exIdx]) // Store what was logged
            }))
        };

        saveLog(workoutLog);
        navigate('/');
    };

    const getVideoId = (ex) => {
        // First check if videoId is in the session exercise object (newer sessions)
        if (ex.videoId) return ex.videoId;
        // Fallback: look up in allExercises
        const found = allExercises.find(e => e.id === ex.exerciseId);
        return found ? found.videoId : null;
    };

    const handleSwapClick = (idx) => {
        setSwapIndex(idx);
        setSwapModalOpen(true);
        setSwapSearch('');
    };

    const handleReplaceExercise = (newEx) => {
        if (swapIndex === null) return;

        // Create new session exercise object
        const oldEx = session.exercises[swapIndex];
        const newSessionEx = {
            ...oldEx,
            exerciseId: newEx.id,
            name: newEx.name,
            videoId: newEx.videoId,
            thumbnail: newEx.thumbnail,
            // Keep sets/reps/weight targets from old exercise or reset? 
            // Better to keep targets if similar, but maybe reset logs?
            // User request: "relation between two exercises... variant"
        };

        const newExercises = [...session.exercises];
        newExercises[swapIndex] = newSessionEx;

        setSession(prev => ({ ...prev, exercises: newExercises }));

        // Reset logs for this index
        setLogs(prev => {
            const newLogs = { ...prev };
            // Initialize fresh logs for this index
            newLogs[swapIndex] = {};
            for (let i = 0; i < newSessionEx.sets; i++) {
                newLogs[swapIndex][i] = {
                    reps: newSessionEx.reps, // Use targets from session object
                    weight: newSessionEx.weight,
                    done: false
                };
            }
            return newLogs;
        });

        setSwapModalOpen(false);
        setSwapIndex(null);
    };

    // Prepare variants for current swap
    const currentSwapExercise = swapIndex !== null ? session.exercises[swapIndex] : null;
    const currentSwapOriginal = currentSwapExercise ? allExercises.find(e => e.id === currentSwapExercise.exerciseId) : null;

    const relevantVariants = currentSwapOriginal?.variants || [];
    const variantExercises = relevantVariants.map(vId => allExercises.find(e => e.id === vId)).filter(Boolean);

    const filteredSwapOptions = allExercises.filter(ex =>
        ex.name.toLowerCase().includes(swapSearch.toLowerCase()) &&
        ex.id !== currentSwapExercise?.exerciseId
    ).slice(0, 50); // Cap results

    if (!session) return <div>Loading...</div>;

    return (
        <div className="flex-col" style={{ gap: '1rem', paddingBottom: '6rem' }}>

            {/* Header / Timer */}
            <div className="glass-header" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 -1rem', width: 'calc(100% + 2rem)' }}>
                <button onClick={() => navigate('/plan')} style={{ background: 'none', border: 'none', color: 'white' }}><ArrowLeft /></button>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Time Elapsed</span>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'monospace', color: 'var(--accent-primary)' }}>
                        {formatTime(elapsed)}
                    </div>
                </div>
                <button onClick={handleFinish} className="btn-primary" style={{ padding: '0.5rem', borderRadius: '50%' }}><Save size={20} /></button>
            </div>

            <h2 className="text-gradient" style={{ textAlign: 'center', marginBottom: '1rem' }}>{session.name}</h2>

            {(() => {
                const elements = [];
                for (let i = 0; i < session.exercises.length; i++) {
                    const ex = session.exercises[i];

                    // Check if this exercise is part of a Superset
                    if (ex.supersetId) {
                        const supersetGroup = [ex];
                        let j = i + 1;
                        while (j < session.exercises.length && session.exercises[j].supersetId === ex.supersetId) {
                            supersetGroup.push(session.exercises[j]);
                            j++;
                        }

                        // Render Superset Block
                        const maxSets = Math.max(...supersetGroup.map(e => e.sets));

                        elements.push(
                            <div key={`superset-${i}`} className="glass-card fade-in" style={{ padding: '0', overflow: 'hidden', borderLeft: '3px solid var(--accent-primary)', background: 'rgba(139, 92, 246, 0.05)' }}>
                                <div style={{ padding: '0.5rem 1rem', background: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-primary)', fontSize: '0.8rem', fontWeight: 600 }}>
                                    <Link size={14} /> SUPERSET / BISERIES
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                                    {/* Header Row for the Grid */}
                                    <div style={{ padding: '0.5rem 1rem', display: 'grid', gridTemplateColumns: 'minmax(100px, 1.5fr) 1fr 1fr 40px', gap: '0.5rem', fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center', background: 'rgba(0,0,0,0.2)' }}>
                                        <div style={{ textAlign: 'left' }}>EXERCISE</div>
                                        <div>KG</div>
                                        <div>REPS</div>
                                        <div>✓</div>
                                    </div>

                                    {Array.from({ length: maxSets }).map((_, setIdx) => (
                                        <div key={setIdx} style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', marginBottom: '0.5rem', fontWeight: 600, opacity: 0.8 }}>Round {setIdx + 1}</div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                                {supersetGroup.map((subEx, sIdx) => {
                                                    // Ensure this exercise has this set
                                                    if (setIdx >= subEx.sets) return null;

                                                    const globalIdx = i + sIdx;
                                                    const vidId = getVideoId(subEx);
                                                    const setLog = logs[globalIdx]?.[setIdx] || {};
                                                    const isDone = setLog.done;

                                                    return (
                                                        <div key={subEx.id} style={{
                                                            display: 'grid',
                                                            gridTemplateColumns: 'minmax(100px, 1.5fr) 1fr 1fr 40px',
                                                            gap: '0.5rem',
                                                            alignItems: 'center',
                                                            opacity: isDone ? 0.5 : 1,
                                                            transition: 'all 0.3s ease'
                                                        }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                                                                <span style={{ fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={subEx.name}>{subEx.name}</span>
                                                                {vidId && (
                                                                    <button
                                                                        onClick={() => setPreviewVideoId(vidId)}
                                                                        style={{ flexShrink: 0, background: 'none', border: 'none', color: 'var(--text-muted)', padding: 0, cursor: 'pointer' }}
                                                                    >
                                                                        <Play size={12} />
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={() => handleSwapClick(i)}
                                                                    style={{ flexShrink: 0, background: 'none', border: 'none', color: 'var(--text-muted)', padding: 0, cursor: 'pointer', marginLeft: '0.2rem' }}
                                                                    title="Swap Exercise"
                                                                >
                                                                    <Repeat size={12} />
                                                                </button>
                                                            </div>
                                                            <input
                                                                type="number"
                                                                value={setLog.weight}
                                                                onChange={(e) => handleLogChange(globalIdx, setIdx, 'weight', e.target.value)}
                                                                className="glass-input"
                                                                style={{
                                                                    width: '100%', padding: '0.5rem', textAlign: 'center',
                                                                    background: isDone ? 'transparent' : 'var(--bg-secondary)',
                                                                    border: '1px solid var(--glass-border)', borderRadius: '4px', color: 'white'
                                                                }}
                                                            />
                                                            <input
                                                                type="number"
                                                                value={setLog.reps}
                                                                onChange={(e) => handleLogChange(globalIdx, setIdx, 'reps', e.target.value)}
                                                                style={{
                                                                    width: '100%', padding: '0.5rem', textAlign: 'center',
                                                                    background: isDone ? 'transparent' : 'var(--bg-secondary)',
                                                                    border: '1px solid var(--glass-border)', borderRadius: '4px', color: 'white'
                                                                }}
                                                            />
                                                            <button
                                                                onClick={() => toggleSetDone(globalIdx, setIdx)}
                                                                style={{
                                                                    width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                    background: isDone ? 'rgba(34, 197, 94, 0.2)' : 'var(--bg-secondary)',
                                                                    border: isDone ? '1px solid var(--accent-success)' : 'none', borderRadius: '4px', cursor: 'pointer',
                                                                    color: isDone ? 'var(--accent-success)' : 'var(--text-muted)'
                                                                }}
                                                            >
                                                                <CheckCircle size={18} />
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );

                        i = j - 1; // Update Main Loop Index
                    } else {
                        // Render Normal Exercise
                        const vidId = getVideoId(ex);
                        elements.push(
                            <div key={i} className="glass-card fade-in" style={{ padding: '1rem', overflow: 'hidden' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{ex.name}</h3>
                                        {vidId && (
                                            <button
                                                onClick={() => setPreviewVideoId(vidId)}
                                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                                title="Watch Video"
                                            >
                                                <Play size={18} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleSwapClick(i)}
                                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                            title="Swap Exercise"
                                        >
                                            <Repeat size={18} />
                                        </button>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '30px 1fr 1fr 40px', gap: '0.5rem', fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                                        <div>SET</div>
                                        <div>KG</div>
                                        <div>REPS</div>
                                        <div>✓</div>
                                    </div>

                                    {Array.from({ length: ex.sets }).map((_, setIdx) => {
                                        const setLog = logs[i]?.[setIdx] || {};
                                        const isDone = setLog.done;

                                        return (
                                            <div
                                                key={setIdx}
                                                style={{
                                                    display: 'grid', gridTemplateColumns: '30px 1fr 1fr 40px', gap: '0.5rem',
                                                    alignItems: 'center',
                                                    transition: 'all 0.3s ease',
                                                    backgroundColor: isDone ? 'rgba(34, 197, 94, 0.1)' : 'transparent',
                                                    borderRadius: '8px',
                                                    padding: '0.5rem 0',
                                                    marginTop: '0.2rem',
                                                    border: isDone ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid transparent'
                                                }}
                                            >
                                                <div style={{ textAlign: 'center', fontWeight: 600, color: 'var(--text-secondary)' }}>{setIdx + 1}</div>
                                                <input
                                                    type="number"
                                                    value={setLog.weight}
                                                    onChange={(e) => handleLogChange(i, setIdx, 'weight', e.target.value)}
                                                    className="glass-input"
                                                    style={{
                                                        width: '100%', padding: '0.5rem', textAlign: 'center',
                                                        background: isDone ? 'transparent' : 'var(--bg-secondary)',
                                                        border: '1px solid var(--glass-border)', borderRadius: '4px', color: 'white'
                                                    }}
                                                />
                                                <input
                                                    type="number"
                                                    value={setLog.reps}
                                                    onChange={(e) => handleLogChange(i, setIdx, 'reps', e.target.value)}
                                                    style={{
                                                        width: '100%', padding: '0.5rem', textAlign: 'center',
                                                        background: isDone ? 'transparent' : 'var(--bg-secondary)',
                                                        border: '1px solid var(--glass-border)', borderRadius: '4px', color: 'white'
                                                    }}
                                                />
                                                <button
                                                    onClick={() => toggleSetDone(i, setIdx)}
                                                    style={{
                                                        width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        background: isDone ? 'rgba(34, 197, 94, 0.2)' : 'var(--bg-secondary)',
                                                        border: isDone ? '1px solid var(--accent-success)' : 'none', borderRadius: '4px', cursor: 'pointer',
                                                        color: isDone ? 'var(--accent-success)' : 'var(--text-muted)'
                                                    }}
                                                >
                                                    <CheckCircle size={18} />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div >
                        );
                    }
                }
                return elements;
            })()}

            <button onClick={handleFinish} className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '1rem' }}>
                Finish Workout
            </button>

            {/* Video Modal */}
            {
                previewVideoId && (
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
                            Close
                        </button>
                    </div>
                )}

            {/* Swap Modal */}
            {swapModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.9)', zIndex: 60,
                    padding: '2rem',
                    display: 'flex', flexDirection: 'column', alignItems: 'center'
                }} onClick={() => setSwapModalOpen(false)}>
                    <div style={{
                        width: '100%', maxWidth: '500px',
                        background: 'var(--bg-secondary)',
                        borderRadius: '12px',
                        border: '1px solid var(--glass-border)',
                        display: 'flex', flexDirection: 'column',
                        maxHeight: '80vh',
                        overflow: 'hidden'
                    }} onClick={e => e.stopPropagation()}>

                        <div style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Swap Exercise</h3>
                            <button onClick={() => setSwapModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)' }}><X size={20} /></button>
                        </div>

                        <div style={{ padding: '1rem', overflowY: 'auto' }}>
                            {/* Suggested Variants */}
                            {variantExercises.length > 0 && !swapSearch && (
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', marginBottom: '0.5rem', display: 'block', fontWeight: 'bold' }}>SUGGESTED VARIANTS</label>
                                    <div style={{ display: 'grid', gap: '0.5rem' }}>
                                        {variantExercises.map(ex => (
                                            <div
                                                key={ex.id}
                                                onClick={() => handleReplaceExercise(ex)}
                                                className="glass-card"
                                                style={{ padding: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid var(--accent-primary)' }}
                                            >
                                                {ex.thumbnail && <img src={ex.thumbnail} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: '4px' }} />}
                                                <div>
                                                    <div style={{ fontWeight: 600 }}>{ex.name}</div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{ex.muscle}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Search All */}
                            <div>
                                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'block' }}>SEARCH ALL</label>
                                <div style={{ position: 'relative', marginBottom: '1rem' }}>
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder="Search exercises..."
                                        value={swapSearch}
                                        onChange={e => setSwapSearch(e.target.value)}
                                        className="glass-input"
                                        style={{ width: '100%', padding: '0.8rem 0.8rem 0.8rem 2.5rem' }}
                                    />
                                    <Search size={16} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                </div>

                                <div style={{ display: 'grid', gap: '0.5rem' }}>
                                    {filteredSwapOptions.map(ex => (
                                        <div
                                            key={ex.id}
                                            onClick={() => handleReplaceExercise(ex)}
                                            style={{
                                                padding: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem',
                                                borderBottom: '1px solid var(--glass-border)'
                                            }}
                                        >
                                            {ex.thumbnail && <img src={ex.thumbnail} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: '4px' }} />}
                                            <div>
                                                <div style={{ fontWeight: 600 }}>{ex.name}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{ex.muscle}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Train;
