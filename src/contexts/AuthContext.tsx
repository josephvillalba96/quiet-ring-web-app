import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AnonymousSessionService, AnonymousSessionResponse } from '../services/AnonymousSessionService';
import { MediaService } from '../services/MediaService';

interface AuthContextType {
    token: string | null;
    sessionId: string | null;
    userName: string | null;
    mac: string | null;
    isAuthenticated: boolean;
    isAuthenticating: boolean;
    isProfileComplete: boolean;
    expiresAt: number | null;
    streamUserId: string | null;
    error: string | null;
    updateName: (name: string) => void;
    completeProfile: (photoBlob: Blob) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const generateMac = () => "XX:XX:XX:XX:XX:XX".replace(/X/g, () => "0123456789ABCDEF".charAt(Math.floor(Math.random() * 16)));

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [token, setToken] = useState<string | null>(localStorage.getItem('sessionToken'));
    const [sessionId, setSessionId] = useState<string | null>(localStorage.getItem('sessionId'));
    const [userName, setUserName] = useState<string | null>(localStorage.getItem('userName'));
    const [mac] = useState<string | null>(localStorage.getItem('deviceMac') || generateMac());
    const [expiresAt, setExpiresAt] = useState<number | null>(
        localStorage.getItem('sessionExpiresAt') ? Number(localStorage.getItem('sessionExpiresAt')) : null
    );
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [isProfileComplete, setIsProfileComplete] = useState(localStorage.getItem('isProfileComplete') === 'true');
    const [error, setError] = useState<string | null>(null);

    const isAuthenticated = !!token && !!sessionId && (!expiresAt || expiresAt > Date.now());
    const streamUserId = sessionId ? `anon-${sessionId.replace(/-/g, '').substring(0, 12)}` : null;

    // Auto-initiate session on mount if not present
    useEffect(() => {
        if (!token && mac) {
            startSession(mac);
        }
    }, []);

    // Persist MAC
    useEffect(() => {
        if (mac) localStorage.setItem('deviceMac', mac);
    }, [mac]);

    // Auto-logout when token expires
    useEffect(() => {
        if (!expiresAt) return;

        const delay = expiresAt - Date.now();
        if (delay <= 0) {
            logout();
            return;
        }

        const timer = setTimeout(() => {
            console.log('Session expired. Logging out...');
            logout();
        }, delay);

        return () => clearTimeout(timer);
    }, [expiresAt]);

    // Persist critical state changes
    useEffect(() => {
        if (token) localStorage.setItem('sessionToken', token);
        else localStorage.removeItem('sessionToken');
    }, [token]);

    useEffect(() => {
        if (sessionId) localStorage.setItem('sessionId', sessionId);
        else localStorage.removeItem('sessionId');
    }, [sessionId]);

    useEffect(() => {
        if (userName) localStorage.setItem('userName', userName);
        else localStorage.removeItem('userName');
    }, [userName]);

    useEffect(() => {
        if (expiresAt) localStorage.setItem('sessionExpiresAt', String(expiresAt));
        else localStorage.removeItem('sessionExpiresAt');
    }, [expiresAt]);

    useEffect(() => {
        localStorage.setItem('isProfileComplete', String(isProfileComplete));
    }, [isProfileComplete]);

    const startSession = async (deviceMac: string) => {
        setIsAuthenticating(true);
        setError(null);
        try {
            const data: AnonymousSessionResponse = await AnonymousSessionService.startSession(deviceMac);
            setToken(data.token);
            setSessionId(data.sessionId);
            setIsProfileComplete(false); // Reset profile completion on new session

            // Calculate expiration (fallback to 1 hour if not provided)
            const expiresInSec = data.expiresIn || 3600;
            setExpiresAt(Date.now() + expiresInSec * 1000);

        } catch (err) {
            console.error('Auto-start session failed:', err);
            setError('Failed to start session');
        } finally {
            setIsAuthenticating(false);
        }
    };

    const updateName = (name: string) => {
        setUserName(name);
    };

    const completeProfile = async (photoBlob: Blob) => {
        if (!token || !sessionId || !mac) throw new Error('No active session or device identity');
        setIsAuthenticating(true);
        setError(null);
        try {
            // 1. Upload photo to media service
            const uploadData = await MediaService.uploadMedia(photoBlob);
            console.log('Media upload response:', uploadData);

            if (!uploadData || !uploadData.url) {
                throw new Error('Failed to upload photo: URL not received from server');
            }

            if (!isProfileComplete) {
                // FASE 2: First-time registration uses createLegacySession (per user requirement)
                await AnonymousSessionService.createLegacySession(mac, uploadData.url, sessionId);
                setIsProfileComplete(true);
            } else {
                // FASE 3: Subsequent updates use updateSessionPhoto
                await AnonymousSessionService.updateSessionPhoto(sessionId, uploadData.url);
            }
        } catch (err) {
            setError('Failed to complete profile photo');
            throw err;
        } finally {
            setIsAuthenticating(false);
        }
    };

    const logout = useCallback(() => {
        setToken(null);
        setSessionId(null);
        setUserName(null);
        setExpiresAt(null);
        setIsProfileComplete(false);
        localStorage.clear();
    }, []);

    // Session validation (e.g., check for 401s could be handled here or by interceptor calling logout)

    return (
        <AuthContext.Provider value={{
            token,
            sessionId,
            userName,
            mac,
            isAuthenticated,
            isAuthenticating,
            isProfileComplete,
            expiresAt,
            streamUserId,
            error,
            updateName,
            completeProfile,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
