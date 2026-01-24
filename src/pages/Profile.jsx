import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from 'firebase/auth';
import { User, LogOut, Check, X, Camera, Settings, Moon, Sun, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';

const Profile = () => {
    const { currentUser, logout } = useAuth();
    const { t, i18n } = useTranslation();
    const { theme, toggleTheme } = useTheme();

    const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
    const [photoURL, setPhotoURL] = useState(currentUser?.photoURL || '');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleUpdate = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setLoading(true);

        try {
            await updateProfile(currentUser, {
                displayName,
                photoURL
            });
            setMessage(t('profile.saveSuccess'));
        } catch (err) {
            setError('Failed to update profile. ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(true);
        setError('');
        try {
            // Import dynamically or assume imports are added at top
            // To ensure imports are present, I will update imports in a separate replace block or assume user has them? 
            // Better to include imports in the full file replace if many changes, but let's try to add logic here.
            // Wait, I need to add imports to the top of the file as well.
            // I will use a multi-step approach or just assume I can add imports.
            // Actually, I should use `multi_replace_file_content` to add imports AND this logic.
            // But I'm in `replace_file_content`.
            // I'll proceed with this block and then add imports in another call.

            const { ref, uploadBytes, getDownloadURL } = await import("firebase/storage");
            const { storage } = await import("../firebase");

            const storageRef = ref(storage, `profile_pictures/${currentUser.uid}`);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);

            setPhotoURL(url);
            // Auto-save photo URL invocation
            await updateProfile(currentUser, { photoURL: url });
            setMessage('Profile picture updated!');
        } catch (err) {
            console.error(err);
            setError('Failed to upload image. ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
        } catch (err) {
            setError('Failed to log out');
        }
    };

    const toggleLanguage = () => {
        const newLang = i18n.language === 'en' ? 'es-MX' : 'en';
        i18n.changeLanguage(newLang);
    };

    return (
        <div className="flex-col" style={{ gap: '2rem', paddingBottom: '5rem', maxWidth: '600px', margin: '0 auto' }}>
            <h2 className="text-gradient">{t('profile.title')}</h2>

            <div className="glass-card flex-col flex-center" style={{ padding: '2rem', gap: '1rem' }}>
                <div style={{ position: 'relative', width: '100px', height: '100px', cursor: 'pointer' }} onClick={() => document.getElementById('fileInput').click()}>
                    <div style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        background: 'var(--bg-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '3px solid var(--accent-primary)',
                        position: 'relative'
                    }}>
                        {photoURL ? (
                            <img src={photoURL} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <User size={50} color="var(--text-muted)" />
                        )}
                        <div style={{
                            position: 'absolute', bottom: 0, left: 0, right: 0,
                            background: 'rgba(0,0,0,0.6)', height: '30px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <Camera size={16} color="white" />
                        </div>
                    </div>
                    <input
                        id="fileInput"
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                    />
                </div>
                <div style={{ textAlign: 'center' }}>
                    <h3 style={{ fontSize: '1.2rem' }}>{currentUser?.email}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Member since {new Date(currentUser?.metadata.creationTime).toLocaleDateString()}</p>
                </div>
            </div>

            {/* Settings Section */}
            <div className="glass-card flex-col" style={{ gap: '1rem', padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Settings size={20} /> {t('profile.settings')}
                </h3>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Globe size={20} color="var(--accent-secondary)" />
                        <span>{t('profile.language')}</span>
                    </div>
                    <button
                        onClick={toggleLanguage}
                        className="btn-secondary"
                        style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', width: '80px' }}
                    >
                        {i18n.language.startsWith('es') ? 'ES' : 'EN'}
                    </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {theme === 'dark' ? <Moon size={20} color="var(--accent-primary)" /> : <Sun size={20} color="orange" />}
                        <span>{t('profile.theme')}</span>
                    </div>
                    <button
                        onClick={toggleTheme}
                        className="btn-secondary"
                        style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', width: '80px' }}
                    >
                        {theme === 'dark' ? 'Dark' : 'Light'}
                    </button>
                </div>
            </div>

            <form onSubmit={handleUpdate} className="glass-card flex-col" style={{ gap: '1.5rem', padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>{t('profile.personalInfo')}</h3>

                {message && <div style={{ background: 'rgba(0, 255, 0, 0.1)', color: '#4ade80', padding: '0.8rem', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Check size={18} /> {message}</div>}
                {error && <div style={{ background: 'rgba(255, 0, 0, 0.1)', color: '#f87171', padding: '0.8rem', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><X size={18} /> {error}</div>}

                <div className="input-group">
                    <label style={{ display: 'block', marginBottom: '0.5rem', marginLeft: '0.5rem' }}>{t('profile.name')}</label>
                    <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="John Doe"
                        className="input-field"
                    />
                </div>

                <div className="input-group">
                    <label style={{ display: 'block', marginBottom: '0.5rem', marginLeft: '0.5rem' }}>Photo URL</label>
                    <input
                        type="text"
                        value={photoURL}
                        onChange={(e) => setPhotoURL(e.target.value)}
                        placeholder="https://example.com/photo.jpg"
                        className="input-field"
                        style={{ paddingLeft: '3rem' }}
                    />
                    <Camera className="input-icon" size={20} />
                </div>

                <button disabled={loading} type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
                    {loading ? t('common.loading') : t('common.save')}
                </button>
            </form>

            <button
                onClick={handleLogout}
                className="btn glass-card"
                style={{
                    color: 'var(--accent-danger)',
                    borderColor: 'var(--accent-danger)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '1rem',
                    cursor: 'pointer'
                }}
            >
                <LogOut size={20} />
                Sign Out
            </button>
        </div>
    );
};

export default Profile;
