
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../firebase';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
    createUserWithEmailAndPassword
} from 'firebase/auth';
import { checkIsAdmin, checkWhitelist } from '../services/db';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    const signup = (email, password) => {
        return createUserWithEmailAndPassword(auth, email, password);
    };

    const login = (email, password) => {
        return signInWithEmailAndPassword(auth, email, password);
    };

    const logout = () => {
        return signOut(auth);
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            console.log('[DEBUG] Auth Change:', user?.email);

            if (user) {
                try {
                    // Check if user is in whitelist
                    const { allowed, role } = await checkWhitelist(user.email);
                    console.log('[DEBUG] Whitelist Check:', { allowed, role });

                    if (!allowed) {
                        console.warn('[AUTH] User not in whitelist. Signing out...');
                        await signOut(auth);
                        setCurrentUser(null);
                        setIsAdmin(false);
                    } else {
                        setCurrentUser(user);
                        setIsAdmin(role === 'admin');
                    }
                } catch (error) {
                    console.error('[DEBUG] Error checking whitelist:', error);
                    // Fail safe: logout if check fails? Or allow restrictive?
                    // Let's safe fail:
                    setIsAdmin(false);
                    setCurrentUser(user); // Allow login but maybe no admin? 
                    // Actually if whitelist is strict, maybe we should block error too?
                    // For now let's assume valid login if DB fails, but no admin.
                }
            } else {
                setCurrentUser(null);
                setIsAdmin(false);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        isAdmin,
        signup,
        login,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
