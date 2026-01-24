import React, { useState, useEffect, useRef } from 'react';
import { getYoutubeId, getThumbnail, getVideoTitle } from '../services/youtube';
import { v4 as uuidv4 } from 'uuid';
import { saveExercise, getMuscles } from '../services/db';
import { Youtube, Save, Loader, Smile } from 'lucide-react';

const FITNESS_EMOJIS = ["💪", "🏋️‍♀️", "🏋️‍♂️", "🤸", "🧘", "🏃", "🔥", "⚡", "🛑", "🩸", "🥵", "🦵", "🍑"];

const ExerciseForm = ({ onSave, onCancel, initialUrl = '', initialTitle = '' }) => {
    const [url, setUrl] = useState(initialUrl);
    const [title, setTitle] = useState(initialTitle);
    const [videoId, setVideoId] = useState(getYoutubeId(initialUrl));
    const [error, setError] = useState('');
    const [type, setType] = useState('weight'); // weight, bodyweight, cardio
    const [isLoadingTitle, setIsLoadingTitle] = useState(false);

    // Emoji Picker
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const emojiContainerRef = useRef(null);

    // Muscles
    const [allMuscles, setAllMuscles] = useState({});
    const [muscle, setMuscle] = useState('Chest');
    const [subMuscle, setSubMuscle] = useState('');

    useEffect(() => {
        const muscles = getMuscles();
        setAllMuscles(muscles);

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
            setError('Please enter a title');
            return;
        }
        // Removed strict videoID check to allow optional URL

        const newExercise = {
            id: uuidv4(),
            name: title,
            url: url,
            videoId: videoId || null, // Allow null
            thumbnail: videoId ? getThumbnail(videoId) : null, // Handle null thumbnail
            type: type,
            muscle: muscle,
            subMuscle: subMuscle || null,
            createdAt: new Date().toISOString()
        };

        saveExercise(newExercise);
        onSave(newExercise);
    };

    const subOptions = allMuscles[muscle] || [];

    return (
        <form onSubmit={handleSubmit} className="flex-col" style={{ gap: '1rem' }}>
            {/* YouTube URL Input */}
            <div className="flex-col" style={{ gap: '0.5rem' }}>
                <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>YouTube Link</label>
                <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-primary)' }}>
                        <Youtube size={18} />
                    </div>
                    <input
                        type="url"
                        value={url}
                        onChange={handleUrlChange}
                        placeholder="Paste YouTube Share URL..."
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

            {/* Title Input with Emoji Picker */}
            <div className="flex-col" style={{ gap: '0.5rem' }}>
                <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Exercise Name</label>
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
                    <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Target</label>
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
                    <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Type</label>
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
                        <option value="weight">Weight</option>
                        <option value="bodyweight">Bodyweight</option>
                        <option value="cardio">Cardio</option>
                    </select>
                </div>
            </div>

            {/* Sub Muscle Group (Conditional) */}
            {subOptions.length > 0 && (
                <div className="flex-col" style={{ gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Specific Target (Optional)</label>
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
                        <option value="">-- General {muscle} --</option>
                        {subOptions.map(sub => (
                            <option key={sub} value={sub}>{sub}</option>
                        ))}
                    </select>
                </div>
            )}

            {error && <div style={{ color: 'var(--accent-danger)', fontSize: '0.9rem' }}>{error}</div>}

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={onCancel} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                    <Save size={18} /> Save
                </button>
            </div>
        </form>
    );
};

export default ExerciseForm;
