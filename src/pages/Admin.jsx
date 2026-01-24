import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { addToWhitelist, getWhitelist, removeFromWhitelist, ADMIN_EMAIL } from '../services/db';
import { Navigate } from 'react-router-dom';
import { Trash2, UserPlus, Shield } from 'lucide-react';

const Admin = () => {
    const { currentUser } = useAuth();
    const [whitelist, setWhitelist] = useState([]);
    const [newEmail, setNewEmail] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadWhitelist();
    }, []);

    const loadWhitelist = async () => {
        setLoading(true);
        const list = await getWhitelist();
        setWhitelist(list);
        setLoading(false);
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newEmail.trim()) return;
        await addToWhitelist(newEmail.trim());
        setNewEmail('');
        loadWhitelist();
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to remove this user from the whitelist?')) {
            await removeFromWhitelist(id);
            loadWhitelist();
        }
    };

    // Protection
    if (!currentUser || currentUser.email !== ADMIN_EMAIL) {
        return <Navigate to="/" />;
    }

    return (
        <div style={{ padding: '1rem', maxWidth: '800px', margin: '0 auto' }} className="fade-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ background: 'var(--accent-primary)', padding: '0.8rem', borderRadius: '12px' }}>
                    <Shield size={32} color="white" />
                </div>
                <div>
                    <h1 className="text-gradient">Admin Panel</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Manage User Whitelist</p>
                </div>
            </div>

            {/* Add Form */}
            <div className="glass-card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
                <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <UserPlus size={20} className="text-accent" />
                    Add User
                </h3>
                <form onSubmit={handleAdd} style={{ display: 'flex', gap: '1rem' }}>
                    <input
                        type="email"
                        placeholder="Enter email address"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        className="input-field"
                        style={{ flex: 1 }}
                        required
                    />
                    <button type="submit" className="btn btn-primary">Add</button>
                </form>
            </div>

            {/* List */}
            <div className="glass-card" style={{ padding: '0' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
                    <h3 style={{ margin: 0 }}>Whitelisted Users ({whitelist.length})</h3>
                </div>
                {loading ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
                ) : whitelist.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No allowed users yet.</div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {whitelist.map(user => (
                            <div key={user.id} style={{
                                padding: '1rem 1.5rem',
                                borderBottom: '1px solid var(--glass-border)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <span style={{ fontWeight: 500 }}>{user.email}</span>
                                <button
                                    onClick={() => handleDelete(user.id)}
                                    style={{
                                        background: 'none', border: 'none',
                                        color: 'var(--accent-danger)', cursor: 'pointer',
                                        padding: '0.5rem'
                                    }}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Admin;
