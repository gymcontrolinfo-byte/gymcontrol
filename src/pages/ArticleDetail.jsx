
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getArticle } from '../services/db';
import { ChevronLeft, Calendar, User, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ArticleDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const data = await getArticle(id);
            setArticle(data);
            setLoading(false);
        };
        load();
    }, [id]);

    if (loading) return <div className="flex-center" style={{ height: '50vh', color: 'var(--text-muted)' }}>Loading...</div>;

    if (!article) return (
        <div className="flex-center flex-col" style={{ height: '50vh', gap: '1rem' }}>
            <h2>Article not found</h2>
            <button className="btn btn-secondary" onClick={() => navigate('/tips')}>Go Back</button>
        </div>
    );

    return (
        <div className="fade-in" style={{ paddingBottom: '6rem' }}>
            <button
                onClick={() => navigate(-1)}
                style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    marginBottom: '1rem'
                }}
            >
                <ChevronLeft size={20} /> Back
            </button>

            {article.imageUrl && (
                <div style={{
                    width: '100%',
                    height: '250px',
                    borderRadius: '1.5rem',
                    overflow: 'hidden',
                    marginBottom: '1.5rem',
                    position: 'relative'
                }}>
                    <img
                        src={article.imageUrl}
                        alt={article.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        width: '100%',
                        height: '50%',
                        background: 'linear-gradient(to top, var(--bg-primary), transparent)'
                    }} />
                </div>
            )}

            <div style={{ padding: '0 0.5rem' }}>
                <div style={{ color: 'var(--accent-primary)', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                    {article.subtitle}
                </div>
                <h1 style={{ fontSize: '2rem', lineHeight: 1.2, marginBottom: '1rem' }}>{article.title}</h1>

                <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '2rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Calendar size={14} /> {new Date(article.createdAt).toLocaleDateString()}
                    </span>
                    {article.author && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <User size={14} /> {article.author}
                        </span>
                    )}
                </div>

                <div
                    className="article-content"
                    style={{ lineHeight: 1.6, color: 'var(--text-secondary)', fontSize: '1.05rem' }}
                    dangerouslySetInnerHTML={{ __html: article.content }}
                />
            </div>
        </div>
    );
};

export default ArticleDetail;
