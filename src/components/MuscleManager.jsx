
import React, { useState, useEffect } from 'react';
import { getMuscles, addMuscleGroup, deleteMuscleGroup, addSubMuscle, deleteSubMuscle } from '../services/db';
import { Plus, X, Tag, ChevronDown, ChevronRight, CornerDownRight } from 'lucide-react';

const MuscleManager = ({ onClose }) => {
    const [muscles, setMuscles] = useState({});
    const [newGroup, setNewGroup] = useState('');
    const [newSub, setNewSub] = useState('');
    const [expanded, setExpanded] = useState({});
    const [selectedGroup, setSelectedGroup] = useState(null);

    useEffect(() => {
        setMuscles({ ...getMuscles() });
    }, []);

    const toggleExpand = (group) => {
        setExpanded(prev => ({ ...prev, [group]: !prev[group] }));
        setSelectedGroup(group);
    };

    const handleAddGroup = (e) => {
        e.preventDefault();
        if (newGroup.trim()) {
            addMuscleGroup(newGroup.trim());
            setMuscles({ ...getMuscles() });
            setNewGroup('');
        }
    };

    const handleDeleteGroup = (group) => {
        if (window.confirm(`Delete "${group}" and all its sub-muscles?`)) {
            deleteMuscleGroup(group);
            setMuscles({ ...getMuscles() });
        }
    };

    const handleAddSub = (e) => {
        e.preventDefault();
        if (selectedGroup && newSub.trim()) {
            addSubMuscle(selectedGroup, newSub.trim());
            setMuscles({ ...getMuscles() });
            setNewSub('');
        }
    };

    const handleDeleteSub = (group, sub) => {
        if (window.confirm(`Delete sub-muscle "${sub}"?`)) {
            deleteSubMuscle(group, sub);
            setMuscles({ ...getMuscles() });
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '1rem', gap: '1rem' }}>
            {/* Add Group */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                    type="text"
                    value={newGroup}
                    onChange={(e) => setNewGroup(e.target.value)}
                    placeholder="New Main Group..."
                    style={{
                        flex: 1,
                        padding: '0.8rem',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: 'var(--radius-md)',
                        color: 'white'
                    }}
                />
                <button onClick={handleAddGroup} className="btn-primary" style={{ padding: '0 1rem' }}>
                    <Plus size={20} />
                </button>
            </div>

            {/* List */}
            <div className="flex-col" style={{ gap: '0.5rem', flex: 1, overflowY: 'auto' }}>
                {Object.entries(muscles).map(([group, subs]) => (
                    <div key={group} className="glass-card" style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div
                                onClick={() => toggleExpand(group)}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', flex: 1 }}
                            >
                                {expanded[group] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                <span style={{ fontWeight: 600 }}>{group}</span>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>({subs.length})</span>
                            </div>
                            <button onClick={() => handleDeleteGroup(group)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                <X size={16} />
                            </button>
                        </div>

                        {/* Sub Muscles */}
                        {expanded[group] && (
                            <div className="fade-in" style={{ marginTop: '0.5rem', paddingLeft: '1rem', borderLeft: '2px solid var(--glass-border)' }}>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.8rem' }}>
                                    {subs.map(sub => (
                                        <div key={sub} style={{
                                            background: 'var(--bg-secondary)',
                                            padding: '0.3rem 0.6rem',
                                            borderRadius: '12px',
                                            fontSize: '0.8rem',
                                            display: 'flex', alignItems: 'center', gap: '0.4rem'
                                        }}>
                                            {sub}
                                            <button onClick={() => handleDeleteSub(group, sub)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}>
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input
                                        type="text"
                                        value={selectedGroup === group ? newSub : ''}
                                        onChange={(e) => {
                                            setSelectedGroup(group);
                                            setNewSub(e.target.value);
                                        }}
                                        placeholder={`Add to ${group}...`}
                                        style={{
                                            flex: 1,
                                            padding: '0.5rem',
                                            background: 'var(--bg-secondary)',
                                            border: '1px solid var(--glass-border)',
                                            borderRadius: 'var(--radius-sm)',
                                            color: 'white',
                                            fontSize: '0.9rem'
                                        }}
                                    />
                                    <button onClick={handleAddSub} className="btn-secondary" style={{ padding: '0 0.8rem' }}>
                                        <Plus size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <button onClick={onClose} className="btn btn-secondary" style={{ width: '100%' }}>Done</button>
        </div>
    );
};

export default MuscleManager;
