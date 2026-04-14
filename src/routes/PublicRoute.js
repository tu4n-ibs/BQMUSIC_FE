import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PageLoader from '../components/common/PageLoader';

const PublicRoute = () => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <PageLoader />;
    }

    // If logged in, redirect to Feed (or home) instead of showing Login/Register page
    return isAuthenticated ? <Navigate to="/newF" replace /> : <Outlet />;
};

export default PublicRoute;
