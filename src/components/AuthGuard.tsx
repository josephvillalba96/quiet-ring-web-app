import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface AuthGuardProps {
    children: React.ReactNode;
    requireProfileComplete?: boolean;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children, requireProfileComplete = true }) => {
    const { isAuthenticated, isProfileComplete, isAuthenticating } = useAuth();
    const location = useLocation();

    // Show loading while restoring session or processing
    if (isAuthenticating) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black text-white font-sora">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 rounded-full border-2 border-brand-orange border-t-transparent animate-spin" />
                    <p>Securing connection...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        // Redirect to registration but save the attempted path
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    if (requireProfileComplete && !isProfileComplete) {
        // Authenticated but didn't finish photo update? 
        // Redirect to registration to finish it
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};
