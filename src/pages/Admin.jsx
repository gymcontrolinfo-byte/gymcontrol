import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { addToWhitelist, getWhitelist, removeFromWhitelist, updateUserRole, ADMIN_EMAIL, getArticles, saveArticle, deleteArticle } from '../services/db';
import { Navigate } from 'react-router-dom';
import { Trash2, UserPlus, Shield, UserCog, Check, Image, Layout, Link as LinkIcon, Save, FileText, Plus, X, Edit2 } from 'lucide-react';

const Admin = () => {
    const { currentUser, isAdmin } = useAuth();
    const [whitelist, setWhitelist] = useState([]);
    const [newEmail, setNewEmail] = useState('');
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('users'); // 'users' | 'articles'

    // CMS State
    const [cmsLoading, setCmsLoading] = useState(false);

    // Articles State
    const [articles, setArticles] = useState([]);
    const [editingArticle, setEditingArticle] = useState(null); // null = list mode, object = edit mode
    const [showPreview, setShowPreview] = useState(false);
    const [articleForm, setArticleForm] = useState({
        title: '', subtitle: '', imageUrl: '', content: '', author: 'Admin'
    });

    useEffect(() => {
        loadWhitelist();
    }, []);

    const loadWhitelist = async () => {
        setLoading(true);
        const list = await getWhitelist();
        setWhitelist(list);
        setLoading(false);
    };

    const loadArticles = async () => {
        const list = await getArticles();
        setArticles(list);
    };

    useEffect(() => { loadArticles() }, []);

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

    const toggleRole = async (user) => {
        const newRole = user.role === 'admin' ? 'user' : 'admin';
        await updateUserRole(user.id, newRole);
        loadWhitelist();
    };

    const handleSaveArticle = async (e) => {
        e.preventDefault();
        setCmsLoading(true);
        try {
            await saveArticle({ ...articleForm, id: editingArticle?.id }); // If editing, preserve ID
            alert('Article saved!');
            setEditingArticle(null);
            setArticleForm({ title: '', subtitle: '', imageUrl: '', content: '', author: 'Admin' });
            loadArticles();
        } catch (err) {
            console.error(err);
            alert('Failed to save article.');
        }
        setCmsLoading(false);
    };


    const handleDeleteArticle = async (id) => {
        if (window.confirm('Delete this article?')) {
            await deleteArticle(id);
            loadArticles();
        }
    };

    const startEditArticle = (article) => {
        setEditingArticle(article);
        setArticleForm({
            title: '', subtitle: '', imageUrl: '', content: '', author: 'Admin',
            ...article // Override defaults with article data if exists
        });
    };

    // Protection
    if (!currentUser || !isAdmin) {
        return <Navigate to="/" />;
    }

    return (
        <div style={{ padding: '1rem', maxWidth: '800px', margin: '0 auto' }} className="fade-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ background: 'var(--accent-primary)', padding: '0.8rem', borderRadius: '12px' }}>
                    <Shield size={32} color="white" />
                </div>
                <div>
                    <h1 className="text-gradient">Admin Dashboard</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Manage Users & Content</p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
                <button
                    onClick={() => setActiveTab('users')}
                    style={{
                        background: 'none',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        color: activeTab === 'users' ? 'var(--accent-primary)' : 'var(--text-muted)',
                        fontWeight: activeTab === 'users' ? 600 : 400,
                        borderBottom: activeTab === 'users' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        transition: 'all 0.2s'
                    }}
                >
                    User Management
                </button>
                <button
                    onClick={() => setActiveTab('articles')}
                    style={{
                        background: 'none',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        color: activeTab === 'articles' ? 'var(--accent-primary)' : 'var(--text-muted)',
                        fontWeight: activeTab === 'articles' ? 600 : 400,
                        borderBottom: activeTab === 'articles' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        transition: 'all 0.2s'
                    }}
                >
                    Articles
                </button>
            </div>

            {/* Articles Management */}
            {activeTab === 'articles' && (
                <div className="glass-card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FileText size={20} className="text-accent" /> Articles
                        </h3>
                        {!editingArticle && (
                            <button onClick={() => startEditArticle({})} className="btn btn-sm btn-primary" style={{ gap: '0.4rem' }}>
                                <Plus size={16} /> New Article
                            </button>
                        )}
                    </div>

                    {editingArticle ? (
                        <form onSubmit={handleSaveArticle} className="flex-col fade-in" style={{ gap: '1rem', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <h4 style={{ margin: 0 }}>{editingArticle.id ? 'Edit Article' : 'New Article'}</h4>
                                <button type="button" onClick={() => setEditingArticle(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
                            </div>
                            <input className="input-field" placeholder="Title" value={articleForm.title} onChange={e => setArticleForm({ ...articleForm, title: e.target.value })} required />
                            <input className="input-field" placeholder="Subtitle" value={articleForm.subtitle} onChange={e => setArticleForm({ ...articleForm, subtitle: e.target.value })} />
                            <input className="input-field" placeholder="Image URL" value={articleForm.imageUrl} onChange={e => setArticleForm({ ...articleForm, imageUrl: e.target.value })} />
                            <textarea className="input-field" style={{ minHeight: '150px', fontFamily: 'monospace' }} placeholder="Content (HTML supported)" value={articleForm.content} onChange={e => setArticleForm({ ...articleForm, content: e.target.value })} required />
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <button type="submit" className="btn btn-primary" disabled={cmsLoading}>{cmsLoading ? 'Saving...' : 'Publish Article'}</button>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowPreview(!showPreview)}>{showPreview ? 'Hide Preview' : 'Show Preview'}</button>
                                <button type="button" className="btn btn-secondary" onClick={() => setEditingArticle(null)}>Cancel</button>
                            </div>

                            {showPreview && (
                                <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#000', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                                    <h5 style={{ marginBottom: '1rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>Preview</h5>
                                    {articleForm.imageUrl && (
                                        <img src={articleForm.imageUrl} alt="Cover" style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px', marginBottom: '1rem' }} />
                                    )}
                                    <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>{articleForm.title || 'Article Title'}</h1>
                                    {articleForm.subtitle && <h3 style={{ fontSize: '1.2rem', color: 'var(--accent-primary)', marginBottom: '1rem' }}>{articleForm.subtitle}</h3>}
                                    <div style={{ lineHeight: '1.6', color: '#d4d4d8' }} dangerouslySetInnerHTML={{ __html: articleForm.content }} />
                                </div>
                            )}
                        </form>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {articles.length === 0 ? <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No articles yet.</p> : (
                                articles.map(art => (
                                    <div key={art.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{art.title}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(art.createdAt).toLocaleDateString()}</div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button onClick={() => startEditArticle(art)} className="icon-btn" title="Edit"><Edit2 size={16} /></button>
                                            <button onClick={() => handleDeleteArticle(art.id)} className="icon-btn" style={{ color: 'var(--accent-danger)' }} title="Delete"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'users' && (
                <>
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
                            <h3 style={{ margin: 0 }}>User Management</h3>
                        </div>

                        {loading ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                {/* Pending Section */}
                                {whitelist.filter(u => u.role === 'pending').length > 0 && (
                                    <>
                                        <div style={{ padding: '0.5rem 1.5rem', background: 'rgba(255, 193, 7, 0.1)', color: 'var(--accent-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>
                                            PENDING REQUESTS
                                        </div>
                                        {whitelist.filter(u => u.role === 'pending').map(user => (
                                            <div key={user.id} style={{
                                                padding: '1rem 1.5rem',
                                                borderBottom: '1px solid var(--glass-border)',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                gap: '1rem',
                                                background: 'rgba(255, 193, 7, 0.05)'
                                            }}>
                                                <div className="flex-col">
                                                    <span style={{ fontWeight: 500 }}>{user.email}</span>
                                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Requested access</span>
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button
                                                        onClick={() => updateUserRole(user.id, 'user').then(loadWhitelist)}
                                                        style={{
                                                            background: 'var(--accent-success)',
                                                            border: 'none',
                                                            color: 'white',
                                                            cursor: 'pointer',
                                                            padding: '0.5rem',
                                                            borderRadius: '4px',
                                                            display: 'flex', alignItems: 'center', gap: '0.4rem'
                                                        }}
                                                        title="Approve User"
                                                    >
                                                        <Check size={16} /> Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(user.id)}
                                                        style={{
                                                            background: 'none', border: '1px solid var(--accent-danger)',
                                                            color: 'var(--accent-danger)', cursor: 'pointer',
                                                            padding: '0.4rem', borderRadius: '4px'
                                                        }}
                                                        title="Reject (Delete)"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </>
                                )}

                                {/* Active Section */}
                                <div style={{ padding: '0.5rem 1.5rem', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>
                                    ACTIVE USERS
                                </div>
                                {whitelist.filter(u => u.role !== 'pending').length === 0 ? (
                                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No active users.</div>
                                ) : (
                                    whitelist.filter(u => u.role !== 'pending').map(user => (
                                        <div key={user.id} style={{
                                            padding: '1rem 1.5rem',
                                            borderBottom: '1px solid var(--glass-border)',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            gap: '1rem'
                                        }}>
                                            <div className="flex-col">
                                                <span style={{ fontWeight: 500 }}>{user.email}</span>
                                                <span style={{ fontSize: '0.8rem', color: user.role === 'admin' ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
                                                    {user.role === 'admin' ? 'Admin' : 'User'}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                {user.email !== ADMIN_EMAIL && (
                                                    <button
                                                        onClick={() => toggleRole(user)}
                                                        style={{
                                                            background: user.role === 'admin' ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)',
                                                            border: '1px solid var(--glass-border)',
                                                            color: 'white',
                                                            cursor: 'pointer',
                                                            padding: '0.5rem',
                                                            borderRadius: '4px',
                                                            fontSize: '0.8rem',
                                                            display: 'flex', alignItems: 'center', gap: '0.4rem'
                                                        }}
                                                        title={user.role === 'admin' ? "Demote to User" : "Promote to Admin"}
                                                    >
                                                        <UserCog size={16} />
                                                        {user.role === 'admin' ? 'Admin' : 'Make Admin'}
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(user.id)}
                                                    style={{
                                                        background: 'none', border: 'none',
                                                        color: 'var(--accent-danger)', cursor: 'pointer',
                                                        padding: '0.5rem'
                                                    }}
                                                    title="Remove User"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </>
            )}

        </div >
    );
};

export default Admin;
