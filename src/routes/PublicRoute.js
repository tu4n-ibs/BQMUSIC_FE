import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PublicRoute = () => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <div className="text-center mt-10">Loading...</div>;
    }

    // If logged in, redirect to Feed (or home) instead of showing Login/Register page
    return isAuthenticated ? <Navigate to="/newF" replace /> : <Outlet />;
};

export default PublicRoute;
