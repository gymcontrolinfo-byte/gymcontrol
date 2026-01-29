import { db } from '../firebase';
import {
    doc,
    collection,
    setDoc,
    deleteDoc,
    onSnapshot,
    query,
    orderBy,
    getDocs,
    getDoc,
    addDoc,
    where,
    limit
} from 'firebase/firestore';

export const ADMIN_EMAIL = 'gymcontrolinfo@gmail.com';

// Whitelist Logic
// Whitelist Logic
export const checkWhitelist = async (email) => {
    // Admin is always allowed
    if (email === ADMIN_EMAIL) return { allowed: true, role: 'admin' };

    // 1. Try direct lookup (New format: ID = email)
    const docRef = doc(db, 'whitelist', email);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const data = docSnap.data();
        return { allowed: true, role: data.role || 'user' };
    }

    // 2. Fallback: Query by field (Old format: Random ID)
    const q = query(collection(db, 'whitelist'), where('email', '==', email));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        return { allowed: true, role: data.role || 'user' };
    }

    // 3. User not found -> Register as Pending
    try {
        await setDoc(docRef, {
            email,
            role: 'pending',
            createdAt: new Date().toISOString()
        });
        return { allowed: false, role: 'pending' };
    } catch (e) {
        console.error("Error creating pending user:", e);
        return { allowed: false, error: true };
    }
};

export const checkIsAdmin = async (email) => {
    console.log('[DEBUG] checkIsAdmin for:', email, '| Super Admin:', ADMIN_EMAIL);
    if (email === ADMIN_EMAIL) {
        console.log('[DEBUG] Match! Returning true.');
        return true;
    }
    const { allowed, role } = await checkWhitelist(email);
    console.log('[DEBUG] Whitelist Result:', { allowed, role });
    return allowed && role === 'admin';
};

export const getWhitelist = async () => {
    const snapshot = await getDocs(collection(db, 'whitelist'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const addToWhitelist = async (email, role = 'user') => {
    // Use Email as Document ID for security rules lookup
    // This enables the security rule: match /whitelist/{email}
    await setDoc(doc(db, 'whitelist', email), {
        email,
        role,
        createdAt: new Date().toISOString()
    });
};

export const updateUserRole = async (id, newRole) => {
    const ref = doc(db, 'whitelist', id);
    await setDoc(ref, { role: newRole }, { merge: true });
};

export const removeFromWhitelist = async (id) => {
    await deleteDoc(doc(db, 'whitelist', id));
};

// Local cache of data
export const dbData = {
    exercises: [],
    sessions: [],
    history: [],
    user: {},
    muscles: {
        "Chest": ["Upper", "Middle", "Lower"],
        "Back": ["Lats", "Traps", "Lower Back"],
        "Legs": ["Quads", "Hamstrings", "Calves", "Glutes"],
        "Shoulders": ["Front", "Side", "Rear"],
        "Biceps": ["Long Head", "Short Head"],
        "Triceps": ["Long Head", "Lateral Head", "Medial Head"],
        "Core": ["Upper Abs", "Lower Abs", "Obliques"],
        "Full Body": []
    }
};

// Reactivity System
const listeners = new Set();

export const subscribe = (listener) => {
    listeners.add(listener);
    // Return current data immediately
    listener(dbData);
    return () => listeners.delete(listener);
};

const notifyListeners = () => {
    listeners.forEach(listener => listener(dbData));
};

let currentUserId = null;
let unsubscribes = [];

const INITIAL_MUSCLES = dbData.muscles;

// Initialize DB with Subcollection Listeners
export const initDB = async (userId) => {
    if (!userId) return;
    currentUserId = userId;

    // Cleanup previous listeners
    unsubscribes.forEach(unsub => unsub());
    unsubscribes = [];

    const userRef = doc(db, 'users', userId);

    // 1. User Profile & Settings (Muscles) Listener
    const unsubUser = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            dbData.user = data.user || {}; // Keep user profile in main doc
            dbData.muscles = data.muscles || INITIAL_MUSCLES;
        } else {
            // Initialize main doc if missing
            setDoc(userRef, {
                created: new Date().toISOString(),
                muscles: INITIAL_MUSCLES
            }, { merge: true });
            dbData.muscles = INITIAL_MUSCLES;
        }
        notifyListeners();
    });
    unsubscribes.push(unsubUser);

    // 2. Exercises Subcollection Listener
    const exercisesRef = collection(db, 'users', userId, 'exercises');
    const unsubExercises = onSnapshot(query(exercisesRef, orderBy('createdAt', 'desc')), (snapshot) => {
        dbData.exercises = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        notifyListeners();
    });
    unsubscribes.push(unsubExercises);

    // 3. Sessions Subcollection Listener
    const sessionsRef = collection(db, 'users', userId, 'sessions');
    const unsubSessions = onSnapshot(query(sessionsRef), (snapshot) => {
        dbData.sessions = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        notifyListeners();
    });
    unsubscribes.push(unsubSessions);

    // 4. History Subcollection Listener
    const historyRef = collection(db, 'users', userId, 'history');
    const unsubHistory = onSnapshot(query(historyRef, orderBy('date', 'desc')), (snapshot) => {
        const history = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        // Ensure sorting by date desc (shim if orderBy fails or for robustness)
        dbData.history = history.sort((a, b) => new Date(b.date) - new Date(a.date));
        notifyListeners();
    });
    unsubscribes.push(unsubHistory);

    return dbData;
};

// --- CRUD Operations (Subcollections) ---

// Exercises
export const getExercises = () => dbData.exercises || [];

export const saveExercise = async (exercise) => {
    if (!currentUserId) return;
    // Optimistic update
    const idx = dbData.exercises.findIndex(e => e.id === exercise.id);
    if (idx >= 0) dbData.exercises[idx] = exercise;
    else dbData.exercises.unshift(exercise);
    notifyListeners();

    // Firestore Update
    const ref = doc(db, 'users', currentUserId, 'exercises', exercise.id);
    await setDoc(ref, exercise);
    return exercise;
};

export const deleteExercise = async (id) => {
    if (!currentUserId) return;
    dbData.exercises = dbData.exercises.filter(e => e.id !== id);
    notifyListeners();
    await deleteDoc(doc(db, 'users', currentUserId, 'exercises', id));
};

// Sessions
export const getSessions = () => dbData.sessions || [];

export const saveSession = async (session) => {
    if (!currentUserId) return;
    const idx = dbData.sessions.findIndex(s => s.id === session.id);
    if (idx >= 0) dbData.sessions[idx] = session;
    else dbData.sessions.push(session);
    notifyListeners();

    const ref = doc(db, 'users', currentUserId, 'sessions', session.id);
    await setDoc(ref, session);
    return session;
};

export const deleteSession = async (id) => {
    if (!currentUserId) return;
    dbData.sessions = dbData.sessions.filter(s => s.id !== id);
    notifyListeners();
    await deleteDoc(doc(db, 'users', currentUserId, 'sessions', id));
};

export const toggleSessionFavorite = async (id) => {
    if (!currentUserId) return;
    const session = dbData.sessions.find(s => s.id === id);
    if (session) {
        const newFavStatus = !session.isFavorite;
        // Optimistic
        session.isFavorite = newFavStatus;
        notifyListeners();
        // Firestore
        const ref = doc(db, 'users', currentUserId, 'sessions', id);
        await setDoc(ref, { isFavorite: newFavStatus }, { merge: true });
    }
};

// History
export const getHistory = () => dbData.history || [];

export const saveLog = async (log) => {
    if (!currentUserId) return;
    const idx = dbData.history.findIndex(h => h.id === log.id);
    if (idx >= 0) dbData.history[idx] = log;
    else dbData.history.unshift(log);
    notifyListeners();

    const ref = doc(db, 'users', currentUserId, 'history', log.id);
    await setDoc(ref, log);
    return log;
};

export const deleteLog = async (id) => {
    if (!currentUserId) return;
    dbData.history = dbData.history.filter(h => h.id !== id);
    notifyListeners();
    await deleteDoc(doc(db, 'users', currentUserId, 'history', id));
};

// Muscles (Stored in Main Doc)
export const getMuscles = () => dbData.muscles || {};

const updateMuscles = async (newMuscles) => {
    if (!currentUserId) return;
    dbData.muscles = newMuscles; // Optimistic
    notifyListeners();
    const userRef = doc(db, 'users', currentUserId);
    await setDoc(userRef, { muscles: newMuscles }, { merge: true });
};

export const addMuscleGroup = (group) => {
    if (!dbData.muscles[group]) {
        updateMuscles({ ...dbData.muscles, [group]: [] });
    }
};

export const deleteMuscleGroup = (group) => {
    if (dbData.muscles[group]) {
        const newMuscles = { ...dbData.muscles };
        delete newMuscles[group];
        updateMuscles(newMuscles);
    }
};

export const addSubMuscle = (group, sub) => {
    if (dbData.muscles[group] && !dbData.muscles[group].includes(sub)) {
        const newGroup = [...dbData.muscles[group], sub];
        updateMuscles({ ...dbData.muscles, [group]: newGroup });
    }
};

export const deleteSubMuscle = (group, sub) => {
    if (dbData.muscles[group]) {
        const newGroup = dbData.muscles[group].filter(s => s !== sub);
        updateMuscles({ ...dbData.muscles, [group]: newGroup });
    }
};

export const resetDB = () => {
    window.location.reload();
};

// --- Sharing (Local Server) ---
const API_URL = 'http://localhost:3001/api';

export const sharePlan = async (fromEmail, toEmail, plan, exercises) => {
    const shareData = {
        id: crypto.randomUUID(),
        from: fromEmail,
        to: toEmail,
        timestamp: new Date().toISOString(),
        plan,
        exercises
    };

    const res = await fetch(`${API_URL}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shareData })
    });

    if (!res.ok) throw new Error('Failed to share plan');
    return true;
};

export const getPendingShares = async (userEmail) => {
    // Determine where to fetch. Since server.js has /api/db, we can just read the whole DB and filter.
    // Or we could add a specific endpoint. Let's use /api/db for simplicity if it exposes everything.
    // server.js's /api/db returns the whole JSON.
    try {
        const res = await fetch(`${API_URL}/db`);
        if (!res.ok) return [];
        const data = await res.json();
        return (data.shared_plans || []).filter(s => s.to === userEmail);
    } catch (e) {
        console.error("Error fetching shares", e);
        return [];
    }
};

export const resolveShare = async (shareId) => {
    const res = await fetch(`${API_URL}/resolve-share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shareId })
    });
    if (!res.ok) throw new Error('Failed to resolve share');
    return true;
};

// --- CMS (Featured Content) ---
export const updateFeaturedContent = async (data) => {
    // "featured" is the singleton ID for the featured card
    await setDoc(doc(db, 'site_content', 'featured'), data, { merge: true });
};

export const subscribeFeaturedContent = (callback) => {
    return onSnapshot(doc(db, 'site_content', 'featured'), (docSnap) => {
        if (docSnap.exists()) {
            callback(docSnap.data());
        } else {
            callback(null);
        }
    });
};

// --- Articles CMS ---
export const getArticles = async () => {
    const q = query(collection(db, 'articles'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const subscribeArticles = (callback) => {
    const q = query(collection(db, 'articles'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
        const articles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(articles);
    });
};

export const subscribeLatestArticle = (callback) => {
    const q = query(collection(db, 'articles'), orderBy('createdAt', 'desc'), limit(1));
    return onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
            const docSnap = snapshot.docs[0];
            callback({ id: docSnap.id, ...docSnap.data() });
        } else {
            callback(null);
        }
    });
};

export const getArticle = async (id) => {
    const docRef = doc(db, 'articles', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
};

export const saveArticle = async (article) => {
    // If no ID, create new. If ID, update.
    const id = article.id || crypto.randomUUID();
    const docRef = doc(db, 'articles', id);
    const dataToSave = {
        ...article,
        id: id, // Ensure ID is set and not undefined
        updatedAt: new Date().toISOString()
    };
    if (!article.createdAt) {
        dataToSave.createdAt = new Date().toISOString();
    }

    await setDoc(docRef, dataToSave, { merge: true });
    return id;
};

export const deleteArticle = async (id) => {
    await deleteDoc(doc(db, 'articles', id));
};
