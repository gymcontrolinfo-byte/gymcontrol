import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from 'firebase/auth';
import { User, LogOut, Check, X, Camera, Settings, Moon, Sun, Globe, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { subscribe } from '../services/db';
import { useEffect } from 'react';

const Profile = () => {
    const { currentUser, logout } = useAuth();
    const { t, i18n } = useTranslation();
    const { theme, toggleTheme } = useTheme();

    const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
    const [photoURL, setPhotoURL] = useState(currentUser?.photoURL || '');
    const [age, setAge] = useState('');
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');
    const [sex, setSex] = useState('other');
    const [frequency, setFrequency] = useState('3-4');
    const [injuries, setInjuries] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const unsubscribe = subscribe((data) => {
            if (data.user) {
                if (data.user.displayName) setDisplayName(data.user.displayName);
                if (data.user.photoURL) setPhotoURL(data.user.photoURL);
                if (data.user.age) setAge(data.user.age);
                if (data.user.height) setHeight(data.user.height);
                if (data.user.weight) setWeight(data.user.weight);
                if (data.user.sex) setSex(data.user.sex);
                if (data.user.frequency) setFrequency(data.user.frequency);
                if (data.user.injuries) setInjuries(data.user.injuries);
            }
        });
        return () => unsubscribe();
    }, []);

    const handleUpdate = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setLoading(true);

        try {
            await updateProfile(currentUser, {
                displayName,
            });

            // Save all metadata to Firestore
            const userRef = doc(db, 'users', currentUser.uid);
            await setDoc(userRef, {
                user: {
                    displayName,
                    email: currentUser.email,
                    age,
                    height,
                    weight,
                    sex,
                    frequency,
                    injuries,
                    photoURL // Keep existing photoURL
                }
            }, { merge: true });

            setMessage(t('profile.saveSuccess'));
        } catch (err) {
            setError('Failed to update profile. ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const compressImage = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 500;
                    const MAX_HEIGHT = 500;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', 0.7));
                };
                img.onerror = (error) => reject(error);
            };
            reader.onerror = (error) => reject(error);
        });
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(true);
        setError('');
        try {
            const base64String = await compressImage(file);

            // Save to Firestore
            const userRef = doc(db, 'users', currentUser.uid);
            await setDoc(userRef, {
                user: {
                    photoURL: base64String,
                    email: currentUser.email
                }
            }, { merge: true });

            setPhotoURL(base64String);
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
                        {theme.charAt(0).toUpperCase() + theme.slice(1)}
                    </button>
                </div>

                <div
                    onClick={() => window.location.href = '/privacy'}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.5rem 0', color: 'var(--text-secondary)' }}
                >
                    <Shield size={20} color="var(--text-muted)" />
                    <span>Privacy Policy</span>
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="input-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem', marginLeft: '0.5rem' }}>{t('profile.age')}</label>
                        <input
                            type="number"
                            value={age}
                            onChange={(e) => setAge(e.target.value)}
                            placeholder="25"
                            className="input-field"
                        />
                    </div>
                    <div className="input-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem', marginLeft: '0.5rem' }}>{t('profile.sex.title')}</label>
                        <select
                            value={sex}
                            onChange={(e) => setSex(e.target.value)}
                            className="input-field"
                            style={{ background: 'var(--bg-secondary)', color: 'white' }}
                        >
                            <option value="male">{t('profile.sex.male')}</option>
                            <option value="female">{t('profile.sex.female')}</option>
                            <option value="other">{t('profile.sex.other')}</option>
                        </select>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="input-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem', marginLeft: '0.5rem' }}>{t('profile.height')}</label>
                        <input
                            type="number"
                            value={height}
                            onChange={(e) => setHeight(e.target.value)}
                            placeholder="175"
                            className="input-field"
                        />
                    </div>
                    <div className="input-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem', marginLeft: '0.5rem' }}>{t('profile.weight')}</label>
                        <input
                            type="number"
                            value={weight}
                            onChange={(e) => setWeight(e.target.value)}
                            placeholder="70"
                            className="input-field"
                        />
                    </div>
                </div>

                <div className="input-group">
                    <label style={{ display: 'block', marginBottom: '0.5rem', marginLeft: '0.5rem' }}>{t('profile.frequency.title')}</label>
                    <select
                        value={frequency}
                        onChange={(e) => setFrequency(e.target.value)}
                        className="input-field"
                        style={{ background: 'var(--bg-secondary)', color: 'white' }}
                    >
                        <option value="1-2">{t('profile.frequency.1-2')}</option>
                        <option value="3-4">{t('profile.frequency.3-4')}</option>
                        <option value="5-6">{t('profile.frequency.5-6')}</option>
                        <option value="7">{t('profile.frequency.7')}</option>
                    </select>
                </div>

                <div className="input-group">
                    <label style={{ display: 'block', marginBottom: '0.5rem', marginLeft: '0.5rem' }}>{t('profile.injuries')}</label>
                    <textarea
                        value={injuries}
                        onChange={(e) => setInjuries(e.target.value)}
                        placeholder="e.g. Lower back pain, knee injury..."
                        className="input-field"
                        style={{ minHeight: '80px', paddingTop: '0.8rem' }}
                    />
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
