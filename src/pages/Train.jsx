
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSessions, saveLog, getExercises } from '../services/db';
import { v4 as uuidv4 } from 'uuid';
import { Timer, CheckCircle, ArrowLeft, Play, Save, Link } from 'lucide-react';

const Train = () => {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const [session, setSession] = useState(null);
    const [logs, setLogs] = useState({}); // { exerciseIdx: { setIdx: { reps, weight, done } } }
    const [elapsed, setElapsed] = useState(0);
    const [isActive, setIsActive] = useState(true);
    const [allExercises, setAllExercises] = useState([]);
    const [previewVideoId, setPreviewVideoId] = useState(null);

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
        let interval = null;
        if (isActive) {
            interval = setInterval(() => {
                setElapsed(prev => prev + 1);
            }, 1000);
        } else if (!isActive && interval) {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [isActive]);

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
                    [field]: field === 'done' ? value : Number(value)
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
                                                                    background: isDone ? 'var(--accent-success)' : 'var(--bg-secondary)',
                                                                    border: 'none', borderRadius: '4px', cursor: 'pointer',
                                                                    color: isDone ? 'white' : 'var(--text-muted)'
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
                                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{ex.name}</h3>
                                    {vidId && (
                                        <button
                                            onClick={() => setPreviewVideoId(vidId)}
                                            className="btn btn-secondary"
                                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', display: 'flex', gap: '0.3rem', alignItems: 'center' }}
                                        >
                                            <Play size={14} /> Video
                                        </button>
                                    )}
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
                                                    opacity: isDone ? 0.5 : 1,
                                                    transition: 'all 0.3s ease'
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
                                                        background: isDone ? 'var(--accent-success)' : 'var(--bg-secondary)',
                                                        border: 'none', borderRadius: '4px', cursor: 'pointer',
                                                        color: isDone ? 'white' : 'var(--text-muted)'
                                                    }}
                                                >
                                                    <CheckCircle size={18} />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    }
                }
                return elements;
            })()}

            <button onClick={handleFinish} className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '1rem' }}>
                Finish Workout
            </button>

            {/* Video Modal */}
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
                        Close
                    </button>
                </div>
            )}
        </div>
    );
};

export default Train;
