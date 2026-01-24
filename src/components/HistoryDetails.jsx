
import React from 'react';

const HistoryDetails = ({ exercise }) => {
    return (
        <div style={{ marginTop: '0.5rem', fontSize: '0.8.5rem' }}>
            <div style={{ fontWeight: 600, color: 'var(--accent-secondary)' }}>{exercise.name}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '30px 1fr 1fr', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.2rem' }}>
                <div>SET</div><div>KG</div><div>REPS</div>
            </div>
            {exercise.sets.map((set, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '30px 1fr 1fr', gap: '0.5rem', fontSize: '0.8rem', opacity: set.done ? 1 : 0.5 }}>
                    <div>{idx + 1}</div>
                    <div>{set.weight}</div>
                    <div>{set.reps}</div>
                </div>
            ))}
        </div>
    );
};

export default HistoryDetails;
