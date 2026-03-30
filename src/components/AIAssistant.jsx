import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, Check, ChevronRight, Loader2, Save, X, Info } from 'lucide-react';
import { generateWorkoutPlan, suggestMuscles } from '../services/ai';
import { subscribe, getExercises, saveSession } from '../services/db';
import { v4 as uuidv4 } from 'uuid';

const MUSCLE_GROUPS = [
    { id: 'chest', label: 'ai.chest', internal: 'Chest' },
    { id: 'triceps', label: 'ai.triceps', internal: 'Triceps' },
    { id: 'back', label: 'ai.back', internal: 'Back' },
    { id: 'biceps', label: 'ai.biceps', internal: 'Biceps' },
    { id: 'frontLeg', label: 'ai.frontLeg', internal: 'Legs' },
    { id: 'backLeg', label: 'ai.backLeg', internal: 'Legs' },
    { id: 'leg', label: 'ai.leg', internal: 'Legs' },
    { id: 'shoulder', label: 'ai.shoulder', internal: 'Shoulders' },
    { id: 'forearm', label: 'ai.forearm', internal: 'Forearm' }
];

const AIAssistant = ({ onSave, onCancel }) => {
    const { t, i18n } = useTranslation();
    const [userProfile, setUserProfile] = useState(null);
    const [availableExercises, setAvailableExercises] = useState([]);
    const [selectedMuscles, setSelectedMuscles] = useState([]);
    const [step, setStep] = useState(1); // 1: Profile check/Muscle select, 2: Generating, 3: Review
    const [generatedPlan, setGeneratedPlan] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const unsub = subscribe((data) => {
            setUserProfile(data.user || {});
            setAvailableExercises(data.exercises || []);
        });
        return () => unsub();
    }, []);

    const isProfileComplete = userProfile?.age && userProfile?.height && userProfile?.weight;

    const toggleMuscle = (id) => {
        setSelectedMuscles(prev => 
            prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
        );
    };

    const handleSuggest = async () => {
        setLoading(true);
        try {
            const suggestions = await suggestMuscles(userProfile, i18n.language);
            // Map internal suggestions back to IDs
            const suggestedIds = MUSCLE_GROUPS
                .filter(m => suggestions.includes(m.internal) || suggestions.includes(m.id))
                .map(m => m.id);
            
            if (suggestedIds.length > 0) {
                setSelectedMuscles(suggestedIds);
            } else {
                // Fallback if AI returned something else
                setSelectedMuscles(['leg', 'back']);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async () => {
        if (selectedMuscles.length === 0) {
            // If nothing selected, maybe assume full body or suggest?
            setError('Please select at least one muscle group.');
            return;
        }

        setError('');
        setLoading(true);
        setStep(2);

        try {
            // Map selection to labels/internals for AI context
            const muscleContext = selectedMuscles.map(id => {
                const group = MUSCLE_GROUPS.find(g => g.id === id);
                return group ? group.label.split('.').pop() : id;
            });

            const plan = await generateWorkoutPlan(userProfile, muscleContext, availableExercises, i18n.language);
            
            // Enrich plan with videoIds/thumbnails from availableExercises
            const enrichedExercises = plan.exercises.map(pe => {
                const ex = availableExercises.find(ae => ae.id === pe.exerciseId);
                return {
                    ...pe,
                    thumbnail: ex?.thumbnail,
                    videoId: ex?.videoId
                };
            }).filter(e => e.exerciseId); // Only keep exercises that were actually found

            setGeneratedPlan({ ...plan, exercises: enrichedExercises });
            setStep(3);
        } catch (err) {
            setError('Error generating plan: ' + err.message);
            setStep(1);
        } finally {
            setLoading(false);
        }
    };

    const handleSavePlan = async () => {
        if (!generatedPlan) return;

        const session = {
            id: uuidv4(),
            name: generatedPlan.name + " (AI)",
            exercises: generatedPlan.exercises,
            createdAt: new Date().toISOString()
        };

        await saveSession(session);
        onSave();
    };

    if (!isProfileComplete) {
        return (
            <div className="flex-col flex-center" style={{ padding: '2rem', textAlign: 'center', gap: '1.5rem' }}>
                <div style={{ background: 'rgba(255, 165, 0, 0.1)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid orange' }}>
                    <Info size={40} color="orange" style={{ marginBottom: '1rem' }} />
                    <h3 style={{ marginBottom: '0.5rem' }}>Perfil Incompleto</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Para que el asistente IA cree un plan adecuado, primero completa tus datos en el Perfil:
                        <br/><br/>
                        <strong>Edad, Estatura y Peso</strong>
                    </p>
                </div>
                <button className="btn btn-primary" onClick={onCancel}>Ir a mi Perfil</button>
            </div>
        );
    }

    return (
        <div className="flex-col" style={{ gap: '1.5rem', maxHeight: '80vh', overflowY: 'auto', padding: '0.5rem' }}>
            {step === 1 && (
                <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--accent-primary)' }}>
                        <Sparkles color="var(--accent-primary)" size={24} />
                        <div>
                            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>{t('ai.title')}</h3>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>Basado en tu perfil: {userProfile.age} años, {userProfile.weight}kg</p>
                        </div>
                    </div>

                    <div className="flex-col" style={{ gap: '1rem' }}>
                        <p style={{ fontWeight: 600 }}>{t('ai.askMuscles')}</p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.8rem' }}>
                            {MUSCLE_GROUPS.map(m => (
                                <div
                                    key={m.id}
                                    onClick={() => toggleMuscle(m.id)}
                                    className="glass-card flex-center"
                                    style={{
                                        padding: '0.8rem',
                                        cursor: 'pointer',
                                        border: selectedMuscles.includes(m.id) ? '2px solid var(--accent-primary)' : '1px solid var(--glass-border)',
                                        background: selectedMuscles.includes(m.id) ? 'rgba(139, 92, 246, 0.1)' : 'var(--bg-secondary)',
                                        transition: 'all 0.2s',
                                        gap: '0.5rem'
                                    }}
                                >
                                    {selectedMuscles.includes(m.id) && <Check size={16} color="var(--accent-primary)" />}
                                    <span style={{ fontSize: '0.9rem' }}>{t(m.label)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button 
                            className="btn btn-secondary" 
                            style={{ flex: 1, gap: '0.5rem' }}
                            onClick={handleSuggest}
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="spin" size={18} /> : <Sparkles size={18} />}
                            {t('ai.suggestButton')}
                        </button>
                        <button 
                            className="btn btn-primary" 
                            style={{ flex: 1, gap: '0.5rem' }}
                            onClick={handleGenerate}
                            disabled={loading || selectedMuscles.length === 0}
                        >
                            {t('ai.generateButton')}
                            <ChevronRight size={18} />
                        </button>
                    </div>

                    {error && <p style={{ color: 'var(--accent-danger)', fontSize: '0.8rem', textAlign: 'center' }}>{error}</p>}
                </>
            )}

            {step === 2 && (
                <div className="flex-col flex-center" style={{ padding: '4rem 1rem', textAlign: 'center', gap: '2rem' }}>
                    <div className="relative">
                        <div className="spin" style={{ width: '80px', height: '80px', border: '4px solid var(--accent-primary)', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
                        <Sparkles style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} color="var(--accent-primary)" size={32} />
                    </div>
                    <div className="flex-col" style={{ gap: '0.5rem' }}>
                        <h3 className="text-gradient">Analizando...</h3>
                        <p style={{ color: 'var(--text-secondary)' }}>{t('ai.thinking')}</p>
                    </div>
                </div>
            )}

            {step === 3 && generatedPlan && (
                <div className="flex-col fade-in" style={{ gap: '1.5rem' }}>
                    <div className="glass-card" style={{ padding: '1.5rem', border: '1px solid var(--accent-primary)' }}>
                        <h3 style={{ color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>{generatedPlan.name}</h3>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: 'var(--radius-sm)', fontStyle: 'italic' }}>
                            "{generatedPlan.coachAdvice}"
                        </div>
                    </div>

                    <div className="flex-col" style={{ gap: '0.8rem' }}>
                        <h4 style={{ fontSize: '1rem' }}>{t('planner.exercises')}</h4>
                        {generatedPlan.exercises.map((ex, idx) => (
                            <div key={idx} className="glass-card" style={{ padding: '0.8rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ width: 60, height: 35, background: '#000', borderRadius: '4px', overflow: 'hidden' }}>
                                    {ex.thumbnail ? <img src={ex.thumbnail} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Sparkles size={14} /></div>}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{ex.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ex.sets} sets x {ex.reps} reps • {ex.rest}s rest</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setStep(1)}>
                            <X size={18} /> {t('common.cancel')}
                        </button>
                        <button className="btn btn-primary" style={{ flex: 1, background: 'var(--accent-primary)' }} onClick={handleSavePlan}>
                            <Save size={18} /> {t('ai.saveRoutine')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AIAssistant;
