import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { decodeJwt, isJwtExpired } from "../utils/jwt";

const AuthContext =  createContext(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}

// authProvider
export const AuthProvider = ({children}) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const syncFromToken = () => {
        const token = localStorage.getItem('token');
        const payload = decodeJwt(token);
        if (!token || !payload || isJwtExpired(payload)) {
            localStorage.removeItem('token');
            setCurrentUser(null);
            setLoading(false);
            return;
        }
        const identity = {
            id: payload.id,
            email: payload.username,
            username: payload.username,
            role: payload.role || 'user',
        };
        setCurrentUser(identity);
        setLoading(false);
    };

    useEffect(() => {
        syncFromToken();
        const onStorage = (event) => {
            if (event.key === 'token') syncFromToken();
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    const logout = () => {
        localStorage.removeItem('token');
        setCurrentUser(null);
        return Promise.resolve();
    };

    const refreshAuth = () => syncFromToken();

    const value = useMemo(() => ({
        currentUser,
        loading,
        logout,
        refreshAuth,
    }), [currentUser, loading]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

// Backward-compatible alias for existing imports.
export const AuthProvide = AuthProvider;
