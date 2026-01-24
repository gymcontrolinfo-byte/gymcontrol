import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
    // Default to 'dark' or check localStorage
    const [theme, setTheme] = useState(() => {
        const savedTheme = localStorage.getItem('gym-app-theme');
        return savedTheme || 'dark';
    });

    useEffect(() => {
        // Update local storage and document attribute
        localStorage.setItem('gym-app-theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
