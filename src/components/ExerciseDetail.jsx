
import React, { useState, useEffect } from 'react';
import { saveExercise } from '../services/db';
import { X, Save, FileText } from 'lucide-react';

const ExerciseDetail = ({ exercise, onClose }) => {
    const [notes, setNotes] = useState(exercise.notes || '');
    const [isSaving, setIsSaving] = useState(false);

    const handleSaveNotes = () => {
        setIsSaving(true);
        const updated = { ...exercise, notes };
        saveExercise(updated);
        // Simulate small delay for feedback
        setTimeout(() => setIsSaving(false), 500);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Video Player or Placeholder */}
            <div style={{ position: 'relative', paddingTop: '56.25%', background: '#000', flexShrink: 0 }}>
                {exercise.videoId ? (
                    <iframe
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                        src={`https://www.youtube.com/embed/${exercise.videoId}?autoplay=1`}
                        title={exercise.name}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    ></iframe>
                ) : (
                    <div style={{
                        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'linear-gradient(135deg, var(--bg-secondary), var(--bg-primary))',
                        color: 'var(--text-muted)'
                    }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>💪</div>
                            <div>No Video Available</div>
                        </div>
                    </div>
                )}
            </div>

            <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                {/* Header */}
                <div>
                    <h2 style={{ fontSize: '1.2rem', margin: 0 }}>{exercise.name}</h2>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <span className="badge" style={{ background: 'var(--accent-secondary)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.7rem' }}>{exercise.muscle}</span>
                        <span className="badge" style={{ background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.7rem' }}>{exercise.type}</span>
                    </div>
                </div>

                {/* Notes Section */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                        <FileText size={16} />
                        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>My Notes</span>
                    </div>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add cue notes here (e.g. 'Seat height 4', 'Elbows in')..."
                        style={{
                            flex: 1,
                            width: '100%',
                            background: 'transparent',
                            border: 'none',
                            color: 'white',
                            resize: 'none',
                            outline: 'none',
                            fontSize: '0.9rem',
                            lineHeight: '1.5'
                        }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                        <button
                            onClick={handleSaveNotes}
                            disabled={isSaving}
                            className="btn btn-primary"
                            style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', opacity: isSaving ? 0.7 : 1 }}
                        >
                            {isSaving ? 'Saved!' : 'Save Notes'}
                        </button>
                    </div>
                </div>
            </div>

            <button
                onClick={onClose}
                style={{
                    marginTop: 'auto', padding: '1rem', background: 'var(--bg-secondary)', border: 'none',
                    color: 'white', borderTop: '1px solid var(--glass-border)', cursor: 'pointer'
                }}
            >
                Close
            </button>
        </div>
    );
};

export default ExerciseDetail;
