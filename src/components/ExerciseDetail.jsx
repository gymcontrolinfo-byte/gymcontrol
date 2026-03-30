
import React, { useState, useEffect } from 'react';
import { saveExercise } from '../services/db';
import { X, Save, FileText, Pencil, Sparkles, Loader2 } from 'lucide-react';
import ExerciseForm from './ExerciseForm';
import { getExerciseAdvice } from '../services/ai';
import { useTranslation } from 'react-i18next';

const ExerciseDetail = ({ exercise, onClose }) => {
    const { i18n } = useTranslation();
    const [notes, setNotes] = useState(exercise.notes || '');
    const [isSaving, setIsSaving] = useState(false);
    const [isAIActive, setIsAIActive] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentExercise, setCurrentExercise] = useState(exercise);

    useEffect(() => {
        setCurrentExercise(exercise);
        setNotes(exercise.notes || '');
    }, [exercise]);

    const handleSaveNotes = () => {
        setIsSaving(true);
        const updated = { ...currentExercise, notes };
        saveExercise(updated);
        setCurrentExercise(updated);
        // Simulate small delay for feedback
        setTimeout(() => setIsSaving(false), 500);
    };

    const handleAIAdvice = async () => {
        setIsAIActive(true);
        try {
            const advice = await getExerciseAdvice(currentExercise.name, i18n.language);
            const separator = notes.trim() ? '\n\n' : '';
            const newNotes = notes.trim() + separator + advice;
            setNotes(newNotes);
            
            // Auto save when AI advice is added
            const updated = { ...currentExercise, notes: newNotes };
            saveExercise(updated);
            setCurrentExercise(updated);
        } catch (err) {
            console.error(err);
        } finally {
            setIsAIActive(false);
        }
    };

    const handleUpdateExercise = (updatedExercise) => {
        // saveExercise is already called inside ExerciseForm, but we might want to ensure we update local state
        // Actually ExerciseForm calls saveExercise internally and then onSave.
        // We just need to update our local view.
        setCurrentExercise(updatedExercise);
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <div style={{ padding: '1rem', height: '100%', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Edit Exercise</h2>
                    <button onClick={() => setIsEditing(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>
                <ExerciseForm
                    existingExercise={currentExercise}
                    onSave={handleUpdateExercise}
                    onCancel={() => setIsEditing(false)}
                />
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Video Player or Placeholder */}
            <div style={{ position: 'relative', paddingTop: '56.25%', background: '#000', flexShrink: 0 }}>
                {currentExercise.videoId ? (
                    <iframe
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                        src={`https://www.youtube.com/embed/${currentExercise.videoId}?autoplay=1`}
                        title={currentExercise.name}
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h2 style={{ fontSize: '1.2rem', margin: 0, flex: 1 }}>{currentExercise.name}</h2>
                        <button
                            onClick={() => setIsEditing(true)}
                            className="btn-icon"
                            style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', padding: '0.5rem', cursor: 'pointer' }}
                        >
                            <Pencil size={18} />
                        </button>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <span className="badge" style={{ background: 'var(--accent-secondary)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.7rem' }}>{currentExercise.muscle}</span>
                        <span className="badge" style={{ background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.7rem' }}>{currentExercise.type}</span>
                        {currentExercise.subMuscle && (
                            <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.7rem', border: '1px solid var(--glass-border)' }}>{currentExercise.subMuscle}</span>
                        )}
                    </div>
                </div>

                {/* Notes Section */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                            <FileText size={16} />
                            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Notes</span>
                        </div>
                        <button
                            onClick={handleAIAdvice}
                            disabled={isAIActive}
                            className="flex-center"
                            style={{ 
                                background: 'rgba(139, 92, 246, 0.1)', 
                                border: '1px solid rgba(139, 92, 246, 0.3)',
                                color: 'var(--accent-primary)',
                                padding: '0.3rem 0.6rem',
                                borderRadius: '4px',
                                fontSize: '0.7rem',
                                gap: '0.3rem',
                                cursor: 'pointer'
                            }}
                        >
                            {isAIActive ? <Loader2 size={12} className="spin" /> : <Sparkles size={12} />}
                            AI Advice
                        </button>
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
