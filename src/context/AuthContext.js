import React, { createContext, useContext, useState, useEffect } from "react";


const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Helper to get non-stringified null values from localStorage
    const getStorageItem = (key) => {
        const item = localStorage.getItem(key);
        if (item === "null" || item === "undefined" || !item) return null;
        return item;
    };

    // Initialize Auth State from LocalStorage
    useEffect(() => {
        const initializeAuth = async () => {
            const token = getStorageItem("token");
            const email = getStorageItem("email");
            const roles = getStorageItem("roles");
            const idUser = getStorageItem("idUser");
            const name = getStorageItem("name");
            const imageUrl = getStorageItem("imageUrl");

            if (token && email) {
                setIsAuthenticated(true);
                // We could fetch profile by idUser or email if needed. For now restore from localStorage.
                setUser({
                    email,
                    idUser,
                    name,
                    imageUrl,
                    roles: roles ? JSON.parse(roles) : []
                });
            }
            setIsLoading(false);
        };

        initializeAuth();
    }, []);

    const login = (data) => {
        // data: { token, refreshToken, role, idUser, email, name, imageUrl... }
        localStorage.setItem("token", data.token);
        localStorage.setItem("refreshToken", data.refreshToken);
        localStorage.setItem("roles", JSON.stringify(data.role)); // Backend returns "role" (array), we store as "roles"
        localStorage.setItem("idUser", data.idUser);
        localStorage.setItem("email", data.email);

        // Save user details if available
        if (data.name) localStorage.setItem("name", data.name);
        if (data.imageUrl) localStorage.setItem("imageUrl", data.imageUrl);

        setIsAuthenticated(true);
        setUser({
            email: data.email,
            idUser: data.idUser,
            name: data.name,
            imageUrl: data.imageUrl,
            roles: data.role
        });
    };

    const updateUser = (data) => {
        setUser(prev => {
            const newUser = { ...prev, ...data };

            // Update localStorage
            if (data.name) localStorage.setItem("name", data.name);
            if (data.imageUrl) localStorage.setItem("imageUrl", data.imageUrl);
            if (data.idUser) localStorage.setItem("idUser", data.idUser);
            if (data.email) localStorage.setItem("email", data.email);
            if (data.roles) localStorage.setItem("roles", JSON.stringify(data.roles));

            return newUser;
        });
    };

    const logout = () => {
        localStorage.clear();
        setIsAuthenticated(false);
        setUser(null);
        // Optional: Call API to revoke token
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
