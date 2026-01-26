import React, { useState, useEffect, useRef } from 'react';
import { getYoutubeId, getThumbnail, getVideoTitle } from '../services/youtube';
import { v4 as uuidv4 } from 'uuid';
import { saveExercise, getMuscles, getExercises } from '../services/db';
import { Youtube, Save, Loader, Smile, Repeat, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const FITNESS_EMOJIS = ["💪", "🏋️‍♀️", "🏋️‍♂️", "🤸", "🧘", "🏃", "🔥", "⚡", "🛑", "🩸", "🥵", "🦵", "🍑"];

const ExerciseForm = ({ onSave, onCancel, existingExercise = null, initialUrl = '', initialTitle = '' }) => {
    const { t } = useTranslation();
    // Determine initial values
    const defaultUrl = existingExercise ? existingExercise.url : initialUrl;
    const defaultTitle = existingExercise ? existingExercise.name : initialTitle;

    const [url, setUrl] = useState(defaultUrl);
    const [title, setTitle] = useState(defaultTitle);
    const [videoId, setVideoId] = useState(getYoutubeId(defaultUrl));
    const [error, setError] = useState('');
    const [type, setType] = useState(existingExercise ? existingExercise.type : 'weight'); // weight, bodyweight, cardio
    const [isLoadingTitle, setIsLoadingTitle] = useState(false);

    // Variants
    const [variants, setVariants] = useState(existingExercise ? (existingExercise.variants || []) : []); // IDs
    const [allExercises, setAllExercises] = useState([]);
    const [variantSearch, setVariantSearch] = useState('');

    // Emoji Picker
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const emojiContainerRef = useRef(null);

    // Muscles
    const [allMuscles, setAllMuscles] = useState({});
    const [muscle, setMuscle] = useState(existingExercise ? existingExercise.muscle : 'Chest');
    const [subMuscle, setSubMuscle] = useState(existingExercise ? (existingExercise.subMuscle || '') : '');

    useEffect(() => {
        const muscles = getMuscles();
        setAllMuscles(muscles);
        setAllExercises(getExercises());

        // Init default if needed
        const groups = Object.keys(muscles);
        if (groups.length > 0 && !muscle) {
            setMuscle(groups[0]);
        }

        // Close emoji picker on outside click
        const handleClickOutside = (event) => {
            if (emojiContainerRef.current && !emojiContainerRef.current.contains(event.target)) {
                setShowEmojiPicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [muscle]); // Dependency on muscle is minor here, main init run

    // Reset sub-muscle when main group changes
    const handleMuscleChange = (e) => {
        setMuscle(e.target.value);
        setSubMuscle(''); // Reset sub on main change
    };

    const handleUrlChange = async (e) => {
        const val = e.target.value;
        setUrl(val);
        const id = getYoutubeId(val);

        if (id) {
            setVideoId(id);
            setError('');

            // Auto-fetch title if empty
            if (!title) {
                setIsLoadingTitle(true);
                const fetchedTitle = await getVideoTitle(val);
                if (fetchedTitle) {
                    setTitle(fetchedTitle);
                }
                setIsLoadingTitle(false);
            }
        } else {
            setVideoId(null);
        }
    };

    const handleEmojiClick = (emoji) => {
        setTitle(prev => prev + (prev ? ' ' : '') + emoji);
        setShowEmojiPicker(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title.trim()) {
            setError(t('exerciseForm.errorTitle'));
            return;
        }
        // Removed strict videoID check to allow optional URL

        const newExercise = {
            id: existingExercise ? existingExercise.id : uuidv4(),
            name: title,
            url: url,
            videoId: videoId || null, // Allow null
            thumbnail: videoId ? getThumbnail(videoId) : null, // Handle null thumbnail
            type: type,
            muscle: muscle,
            subMuscle: subMuscle || null,
            variants: variants,
            createdAt: existingExercise ? existingExercise.createdAt : new Date().toISOString()
        };

        saveExercise(newExercise);
        onSave(newExercise);
    };

    const handleAddVariant = (exId) => {
        if (!variants.includes(exId)) {
            setVariants([...variants, exId]);
        }
        setVariantSearch('');
    };

    const handleRemoveVariant = (exId) => {
        setVariants(variants.filter(id => id !== exId));
    };

    const filteredVariants = allExercises.filter(e =>
        e.id !== (initialUrl ? initialUrl.id : null) && // Don't show self if editing (though we generate ID on save usually, logic might differ but fine for now)
        e.name.toLowerCase().includes(variantSearch.toLowerCase()) &&
        !variants.includes(e.id)
    ).slice(0, 5);

    const subOptions = allMuscles[muscle] || [];

    return (
        <form onSubmit={handleSubmit} className="flex-col" style={{ gap: '1rem' }}>
            {/* YouTube URL Input */}
            <div className="flex-col" style={{ gap: '0.5rem' }}>
                <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t('exerciseForm.youtubeLink')}</label>
                <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-primary)' }}>
                        <Youtube size={18} />
                    </div>
                    <input
                        type="url"
                        value={url}
                        onChange={handleUrlChange}
                        placeholder={t('exerciseForm.pasteUrl')}
                        style={{
                            width: '100%',
                            padding: '0.8rem',
                            paddingLeft: '2.5rem',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: 'var(--radius-md)',
                            color: 'white',
                            outline: 'none'
                        }}
                    />
                </div>
            </div>

            {/* Thumbnail Preview */}
            {videoId && (
                <div className="fade-in" style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--glass-border)', background: 'black' }}>
                    <img
                        src={getThumbnail(videoId)}
                        alt="Preview"
                        style={{ width: '100%', height: 'auto', display: 'block' }}
                    />
                </div>
            )}

            {/* Variants Section */}
            <div className="flex-col" style={{ gap: '0.5rem' }}>
                <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t('exerciseForm.variants')}</label>

                {/* Selected Variants List */}
                {variants.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        {variants.map(vId => {
                            const vEx = allExercises.find(e => e.id === vId);
                            if (!vEx) return null;
                            return (
                                <div key={vId} style={{
                                    background: 'rgba(255,255,255,0.1)',
                                    padding: '0.3rem 0.6rem',
                                    borderRadius: '16px',
                                    fontSize: '0.8rem',
                                    display: 'flex', alignItems: 'center', gap: '0.3rem'
                                }}>
                                    {vEx.name}
                                    <X size={14} style={{ cursor: 'pointer' }} onClick={() => handleRemoveVariant(vId)} />
                                </div>
                            );
                        })}
                    </div>
                )}

                <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-primary)' }}>
                        <Repeat size={18} />
                    </div>
                    <input
                        type="text"
                        value={variantSearch}
                        onChange={(e) => setVariantSearch(e.target.value)}
                        placeholder={t('exerciseForm.searchVariants')}
                        style={{
                            width: '100%',
                            padding: '0.8rem',
                            paddingLeft: '2.5rem',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: 'var(--radius-md)',
                            color: 'white',
                            outline: 'none'
                        }}
                    />
                    {variantSearch && (
                        <div style={{
                            position: 'absolute', top: '100%', left: 0, right: 0,
                            background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)',
                            borderRadius: 'var(--radius-md)', zIndex: 10,
                            marginTop: '0.5rem', maxHeight: '150px', overflowY: 'auto'
                        }}>
                            {filteredVariants.map(ex => (
                                <div
                                    key={ex.id}
                                    onClick={() => handleAddVariant(ex.id)}
                                    style={{ padding: '0.8rem', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                                    className="hover-bg-primary"
                                >
                                    <div style={{ fontSize: '0.9rem' }}>{ex.name}</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{ex.muscle}</div>
                                </div>
                            ))}
                            {filteredVariants.length === 0 && (
                                <div style={{ padding: '0.8rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{t('library.noExercises')}</div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Title Input with Emoji Picker */}
            <div className="flex-col" style={{ gap: '0.5rem' }}>
                <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t('exerciseForm.name')}</label>
                <div style={{ position: 'relative' }} ref={emojiContainerRef}>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Bench Press"
                        style={{
                            width: '100%',
                            padding: '0.8rem',
                            // Add padding right to accommodate loader + smile button
                            paddingRight: isLoadingTitle ? '4.5rem' : '2.8rem',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: 'var(--radius-md)',
                            color: 'white',
                            outline: 'none'
                        }}
                    />

                    <div style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {isLoadingTitle && (
                            <Loader size={16} className="animate-spin text-blue-400" />
                        )}

                        <button
                            type="button"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className="p-1 rounded-full hover:bg-white/10 transition-colors text-gray-400 hover:text-yellow-400"
                        >
                            <Smile size={20} />
                        </button>
                    </div>

                    {/* Emoji Popover */}
                    {showEmojiPicker && (
                        <div className="absolute right-0 top-full mt-2 bg-gray-800 border border-white/10 rounded-xl shadow-xl p-3 z-50 flex flex-wrap gap-2 w-64 animate-in fade-in zoom-in-95 duration-200">
                            {FITNESS_EMOJIS.map(emoji => (
                                <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => handleEmojiClick(emoji)}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors text-xl"
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Target & Type (Reordered) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {/* Target (Muscle) - Moves First */}
                <div className="flex-col" style={{ gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t('exerciseForm.target')}</label>
                    <select
                        value={muscle}
                        onChange={handleMuscleChange}
                        style={{
                            width: '100%',
                            padding: '0.8rem',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: 'var(--radius-md)',
                            color: 'white'
                        }}
                    >
                        {Object.keys(allMuscles).map(m => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>
                </div>

                {/* Type - Moves Second */}
                <div className="flex-col" style={{ gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t('exerciseForm.type')}</label>
                    <select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.8rem',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: 'var(--radius-md)',
                            color: 'white'
                        }}
                    >
                        <option value="weight">{t('exerciseForm.types.weight')}</option>
                        <option value="bodyweight">{t('exerciseForm.types.bodyweight')}</option>
                        <option value="cardio">{t('exerciseForm.types.cardio')}</option>
                    </select>
                </div>
            </div>

            {/* Sub Muscle Group (Conditional) */}
            {subOptions.length > 0 && (
                <div className="flex-col" style={{ gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t('exerciseForm.specificTarget')}</label>
                    <select
                        value={subMuscle}
                        onChange={(e) => setSubMuscle(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.8rem',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: 'var(--radius-md)',
                            color: 'white'
                        }}
                    >
                        <option value="">-- {t('exerciseForm.general')} {muscle} --</option>
                        {subOptions.map(sub => (
                            <option key={sub} value={sub}>{sub}</option>
                        ))}
                    </select>
                </div>
            )}

            {error && <div style={{ color: 'var(--accent-danger)', fontSize: '0.9rem' }}>{error}</div>}

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={onCancel} className="btn btn-secondary" style={{ flex: 1 }}>{t('common.cancel')}</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                    <Save size={18} /> {t('common.save')}
                </button>
            </div>
        </form>
    );
};

export default ExerciseForm;
