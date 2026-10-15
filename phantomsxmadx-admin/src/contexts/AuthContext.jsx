import { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { db } from "../services/mockDb";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Restore session from sessionStorage on app load
        try {
            const storedUser = JSON.parse(sessionStorage.getItem("currentUser"));
            if (storedUser) setUser(storedUser);
        } catch (e) {
            // ignore
        }
        setLoading(false);
    }, []);

    const login = useCallback(async (username, password) => {
        try {
            // Find user in local DB
            const found = db.users.findByUsername(username);
            if (!found || found.password !== password) {
                return { success: false, message: "Invalid username or password" };
            }

            const userData = {
                ...found,
                password: undefined, // never expose password
                mustChangePassword: found.mustChangePassword || false,
                policyAccepted: found.policyAccepted || false,
                policyAcceptedAt: found.policyAcceptedAt || null,
            };

            // Store session
            sessionStorage.setItem("token", "demo_token_" + found._id);
            sessionStorage.setItem("currentUser", JSON.stringify(userData));
            setUser(userData);

            return {
                success: true,
                mustChangePassword: userData.mustChangePassword,
                policyAccepted: userData.policyAccepted,
            };
        } catch (error) {
            return { success: false, message: "Login failed" };
        }
    }, []);

    const logout = useCallback(() => {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("currentUser");
        setUser(null);
        window.location.href = "/";
    }, []);

    const register = useCallback(async (userData) => {
        try {
            const existing = db.users.findByUsername(userData.username || userData.email);
            if (existing) return { success: false, message: "Username already exists" };
            db.users.create({
                ...userData,
                role: userData.role || 'employee',
                policyAccepted: false,
                mustChangePassword: true,
            });
            return { success: true, message: "Registration successful" };
        } catch (error) {
            return { success: false, message: "Registration failed" };
        }
    }, []);

    const contextValue = useMemo(
        () => ({ user, login, logout, register, loading }),
        [user, loading, login, logout, register]
    );

    return (
        <AuthContext.Provider value={contextValue}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
