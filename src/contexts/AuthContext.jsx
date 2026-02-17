import { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../utils/firebase';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    updateProfile,
    GoogleAuthProvider,
    signInWithPopup,
    sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

const AuthContext = createContext(null);

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be inside AuthProvider');
    return ctx;
}

// Admin email — only this account can delete students from the system
const ADMIN_EMAIL = 'vidacristiana21@gmail.com';

// Pre-registered accounts (work with both Firebase and demo fallback)
const KNOWN_ACCOUNTS = {
    [ADMIN_EMAIL]: { displayName: 'Prof. Teodoro', role: 'teacher', password: 'Teadoro12' },
};

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    // Check for persisted session on mount
    useEffect(() => {
        const savedSession = localStorage.getItem('em_active_session');
        if (savedSession) {
            try {
                const session = JSON.parse(savedSession);
                if (session.user && session.profile) {
                    setUser(session.user);
                    setUserProfile(session.profile);
                    // If we recovered a session, we can start non-loading
                    setLoading(false);
                }
            } catch (e) { console.warn("Failed to parse saved session"); }
        }

        const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                console.log("Auth state changed: User logged in", firebaseUser.uid);
                setUser(firebaseUser);
                try {
                    const profileDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
                    if (profileDoc.exists()) {
                        const data = profileDoc.data();
                        setUserProfile(data);
                        localStorage.setItem(`profile_${firebaseUser.uid}`, JSON.stringify(data));
                        localStorage.setItem('em_active_session', JSON.stringify({ user: firebaseUser, profile: data }));
                    } else {
                        console.warn("No Firestore profile found for user:", firebaseUser.uid);
                        const cached = localStorage.getItem(`profile_${firebaseUser.uid}`);
                        if (cached) setUserProfile(JSON.parse(cached));
                    }
                } catch (e) {
                    console.error('Could not fetch profile in onAuthStateChanged:', e.message);
                    const cached = localStorage.getItem(`profile_${firebaseUser.uid}`);
                    if (cached) setUserProfile(JSON.parse(cached));
                }
            } else {
                setUser(null);
                setUserProfile(null);
                localStorage.removeItem('em_active_session');
            }
            // Always ensure loading is false after auth state is determined
            setLoading(false);
        });
        return unsub;
    }, []);

    const login = async (email, password) => {
        // Regular Firebase login
        try {
            console.log("Attempting login for:", email);
            const cred = await signInWithEmailAndPassword(auth, email, password);
            console.log("Firebase Auth success:", cred.user.uid);

            // Explicitly fetch profile but DON'T let it hang the whole login
            const fetchProfile = async () => {
                const docRef = doc(db, 'users', cred.user.uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    let profile = docSnap.data();

                    // SAFETY CHECK: Force Teacher role for the main admin account if it somehow got corrupted
                    if (email.toLowerCase() === ADMIN_EMAIL && profile.role !== 'teacher') {
                        console.warn("Correcting role for admin account...");
                        profile.role = 'teacher';
                        await setDoc(docRef, { role: 'teacher' }, { merge: true }).catch(err => console.warn("Failed to update admin role:", err));
                    }

                    setUserProfile(profile);
                    localStorage.setItem(`profile_${cred.user.uid}`, JSON.stringify(profile));
                    localStorage.setItem('em_active_session', JSON.stringify({ user: cred.user, profile }));
                } else {
                    console.warn("No profile found for user:", cred.user.uid);
                }
            };

            // Non-blocking with a small delay for race prevention
            // We'll wait up to 3 seconds for profile, but proceed anyway
            await Promise.race([
                fetchProfile(),
                new Promise(resolve => setTimeout(resolve, 3000))
            ]).catch(err => console.error("Profile fetch error/timeout:", err));

            return cred.user;
        } catch (firebaseErr) {
            console.error("Firebase Login Error:", firebaseErr.code, firebaseErr.message);
            let msg = firebaseErr.message;
            if (firebaseErr.code === 'auth/user-not-found' || firebaseErr.code === 'auth/wrong-password' || firebaseErr.code === 'auth/invalid-credential') {
                msg = "Invalid email or password. Please try again.";
            } else if (firebaseErr.code === 'auth/too-many-requests') {
                msg = "Too many failed attempts. Please try again later.";
            }
            throw new Error(msg);
        }
    };

    const register = async (email, password, displayName, role) => {
        try {
            console.log("Starting registration for:", email);
            const cred = await createUserWithEmailAndPassword(auth, email, password);
            console.log("User created:", cred.user.uid);

            await updateProfile(cred.user, { displayName }).catch(err => console.warn("Update profile failed:", err));

            const profile = {
                uid: cred.user.uid,
                email,
                displayName,
                role,
                createdAt: new Date().toISOString(),
                avatar: null,
                preferences: { darkMode: true, notifications: true, language: 'en' }
            };

            // Non-blocking Firestore save
            setDoc(doc(db, 'users', cred.user.uid), profile)
                .then(() => console.log("Profile saved to Firestore"))
                .catch(e => console.error('Firestore profile save failed:', e.message));

            localStorage.setItem(`profile_${cred.user.uid}`, JSON.stringify(profile));
            localStorage.setItem('em_active_session', JSON.stringify({ user: cred.user, profile }));

            // Set states explicitly to avoid waiting for onAuthStateChanged
            setUser(cred.user);
            setUserProfile(profile);

            return cred.user;
        } catch (firebaseErr) {
            console.error("Firebase Registration Error:", firebaseErr.code, firebaseErr.message);

            let msg = firebaseErr.message;
            if (firebaseErr.code === 'auth/email-already-in-use') {
                msg = "This email is already registered. Please Sign In instead.";
            } else if (firebaseErr.code === 'auth/weak-password') {
                msg = "Password should be at least 6 characters.";
            } else if (firebaseErr.code === 'auth/invalid-email') {
                msg = "Please enter a valid email address.";
            }

            throw new Error(msg);
        }
    };

    // Teacher creates a pre-registered student
    const preRegisterStudent = async (email, name) => {
        // Generate a random 6-char alphanumeric code (uppercase)
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();

        if (!user) throw new Error("Please log in as a teacher.");

        try {
            // Store in a 'pre_registered' collection
            // We use the email as ID to prevent duplicates easily
            const docRef = doc(db, 'pre_registered', email.toLowerCase());
            const data = {
                email: email.toLowerCase(),
                name,
                code, // This will be their initial password
                createdAt: new Date().toISOString(),
                createdBy: user.uid
            };

            // Implement a timeout for the write operation
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Request timed out. Please check your internet connection.")), 10000)
            );

            await Promise.race([
                setDoc(docRef, data),
                timeoutPromise
            ]);

            return code;
        } catch (e) {
            console.error("Error pre-registering student:", e);
            throw new Error("Failed to generate student code: " + e.message);
        }
    };

    // Student logs in with Email + Code
    const loginWithStudentCode = async (email, code) => {
        const cleanEmail = email.trim().toLowerCase();
        const cleanCode = code.trim().toUpperCase();

        try {
            console.log("Student login attempt:", cleanEmail);
            // 1. Try to log in directly (if they already registered)
            const cred = await signInWithEmailAndPassword(auth, cleanEmail, cleanCode);
            console.log("Student auth success (returning student)");
            return cred.user;
        } catch (authError) {
            console.log("Auth failed, checking if first-time student:", authError.code);

            // auth/invalid-credential is the common denominator for "not found" or "wrong password"
            if (authError.code === 'auth/user-not-found' || authError.code === 'auth/invalid-credential') {

                // Check if they already have a profile in 'users'
                // If they do, then 'invalid-credential' must mean WRONG CODE for a returning student
                const userQuery = query(collection(db, 'users'), where('email', '==', cleanEmail));
                const userSnap = await getDocs(userQuery);

                if (!userSnap.empty) {
                    console.log("Student already has a profile, invalid code.");
                    throw new Error("Invalid Access Code. Please check and try again.");
                }

                // If no profile exists, check pre-registration
                try {
                    const preRegDoc = await getDoc(doc(db, 'pre_registered', cleanEmail));

                    if (preRegDoc.exists()) {
                        const data = preRegDoc.data();

                        // Verify code match
                        if (data.code === cleanCode) {
                            console.log("First-time student found! Creating account...");

                            const cred = await createUserWithEmailAndPassword(auth, cleanEmail, cleanCode);
                            await updateProfile(cred.user, { displayName: data.name });

                            const profile = {
                                uid: cred.user.uid,
                                email: cleanEmail,
                                displayName: data.name,
                                role: 'student',
                                createdAt: new Date().toISOString(),
                                avatar: null,
                                preferences: { darkMode: true, notifications: true, language: 'en' }
                            };

                            // Save profile
                            await setDoc(doc(db, 'users', cred.user.uid), profile);

                            // Now that it's created, they are registered!
                            setUser(cred.user);
                            setUserProfile(profile);

                            return cred.user;
                        } else {
                            throw new Error("Invalid Access Code. Please check the code your teacher gave you.");
                        }
                    } else {
                        throw new Error("Student not found. Please verify the email or ask your teacher to register you.");
                    }
                } catch (dbError) {
                    console.error("Database check failed:", dbError);
                    throw dbError;
                }
            }

            // If it's another error (like auth/wrong-password for older SDKs)
            if (authError.code === 'auth/wrong-password') {
                throw new Error("Invalid Access Code. Please check and try again.");
            }

            throw new Error(authError.message);
        }
    };

    const loginWithGoogle = async (role) => {
        const provider = new GoogleAuthProvider();
        const cred = await signInWithPopup(auth, provider);
        const profileDoc = await getDoc(doc(db, 'users', cred.user.uid)).catch(() => null);
        if (!profileDoc?.exists()) {
            const profile = {
                uid: cred.user.uid,
                email: cred.user.email,
                displayName: cred.user.displayName,
                role,
                createdAt: new Date().toISOString(),
                avatar: cred.user.photoURL,
                preferences: { darkMode: true, notifications: true, language: 'en' }
            };
            try {
                await setDoc(doc(db, 'users', cred.user.uid), profile);
            } catch (e) {
                console.warn('Could not save profile:', e.message);
            }
            localStorage.setItem(`profile_${cred.user.uid}`, JSON.stringify(profile));
            localStorage.setItem('em_active_session', JSON.stringify({ user: cred.user, profile }));
            setUserProfile(profile);
        } else {
            setUserProfile(profileDoc.data());
        }
        return cred.user;
    };

    const logout = async () => {
        try { await signOut(auth); } catch (e) { /* demo mode */ }
        setUser(null);
        setUserProfile(null);
        localStorage.removeItem('em_active_session');
    };

    // Demo mode - no Firebase needed
    const demoLogin = (role) => {
        const demoUser = {
            uid: role === 'teacher' ? 'demo-teacher' : 'demo-student-1',
            email: `demo-${role}@englishmaster.pro`,
            displayName: role === 'teacher' ? 'Prof. Anderson' : 'Alex Student',
        };
        const profile = {
            ...demoUser,
            role,
            createdAt: new Date().toISOString(),
            avatar: null,
            preferences: { darkMode: true, notifications: true, language: 'en' }
        };
        setUser(demoUser);
        setUserProfile(profile);
        localStorage.setItem(`profile_${demoUser.uid}`, JSON.stringify(profile));
        localStorage.setItem('em_active_session', JSON.stringify({ user: demoUser, profile }));
        setLoading(false);
    };

    const updateUserData = async (updates) => {
        if (!user) throw new Error('No active user');
        const newProfile = { ...userProfile, ...updates };

        // Update state
        setUserProfile(newProfile);

        // Update Firestore if online
        try {
            await setDoc(doc(db, 'users', user.uid), newProfile, { merge: true });
        } catch (e) {
            console.warn('Could not save to Firestore:', e.message);
        }

        // Update localStorage
        localStorage.setItem(`profile_${user.uid}`, JSON.stringify(newProfile));
        localStorage.setItem('em_active_session', JSON.stringify({ user, profile: newProfile }));

        // Update Firebase Auth display name if applicable
        if (updates.displayName && auth.currentUser) {
            try {
                await updateProfile(auth.currentUser, { displayName: updates.displayName });
            } catch (authErr) { /* ignore auth update errors */ }
        }
    };

    // Teacher resets a student's access code
    const resetStudentCode = async (email) => {
        if (!user) throw new Error('Please log in as a teacher.');
        const cleanEmail = email.trim().toLowerCase();
        const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();

        try {
            // Update or create the pre_registered entry with the new code
            const docRef = doc(db, 'pre_registered', cleanEmail);
            const existing = await getDoc(docRef);

            await setDoc(docRef, {
                ...(existing.exists() ? existing.data() : { email: cleanEmail, createdBy: user.uid }),
                code: newCode,
                resetAt: new Date().toISOString(),
            }, { merge: true });

            // Also try to send Firebase's password reset email
            // This only works if the student already has a Firebase Auth account
            try {
                await sendPasswordResetEmail(auth, cleanEmail);
            } catch (e) {
                // Ignore — student may not have an account yet (pre-registered only)
                console.log('Password reset email skipped (student may not have auth account):', e.code);
            }

            return newCode;
        } catch (e) {
            console.error('Error resetting student code:', e);
            throw new Error('Failed to reset student code: ' + e.message);
        }
    };

    const isProduction = window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1');

    const value = {
        user,
        userProfile,
        loading,
        login,
        register,
        loginWithGoogle,
        logout,
        demoLogin,
        updateUserData,
        isProduction,
        isTeacher: userProfile?.role === 'teacher',
        isStudent: userProfile?.role === 'student',
        isAdmin: userProfile?.email?.toLowerCase() === ADMIN_EMAIL,
        preRegisterStudent,
        loginWithStudentCode,
        resetStudentCode,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
