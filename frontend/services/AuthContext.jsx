import { createContext, useContext, useEffect, useState } from 'react'
import { apiFetch } from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [role, setRole] = useState(null)
    const [loading, setLoading] = useState(true)

    const checkAuth = () => {
        const token = localStorage.getItem('khushi_token');
        const storedUser = localStorage.getItem('khushi_user');

        if (!token || !storedUser) {
            setUser(null);
            setRole(null);
            setLoading(false);
            return;
        }

        try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            setRole(parsedUser.role || 'patient');
        } catch (e) {
            localStorage.removeItem('khushi_token');
            localStorage.removeItem('khushi_user');
            setUser(null);
            setRole(null);
        }
        setLoading(false);
    }

    useEffect(() => {
        checkAuth();
    }, [])

    const login = async (email, password) => {
        const data = await apiFetch('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        })
        localStorage.setItem('khushi_token', data.token);
        localStorage.setItem('khushi_user', JSON.stringify(data.user));
        setUser(data.user);
        setRole(data.user.role || 'patient');
        return data.user;
    }

    const signup = async (userData) => {
        const data = await apiFetch('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        })
        localStorage.setItem('khushi_token', data.token);
        localStorage.setItem('khushi_user', JSON.stringify(data.user));
        setUser(data.user);
        setRole(data.user.role || 'patient');
        return data.user;
    }

    const signOut = () => {
        localStorage.removeItem('khushi_token');
        localStorage.removeItem('khushi_user');
        setUser(null)
        setRole(null)
    }

    const isDoctor = role === 'doctor'
    const isPatient = role === 'patient' || (!role && !!user)

    return (
        <AuthContext.Provider value={{ user, role, loading, login, signup, signOut, isDoctor, isPatient }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used within AuthProvider')
    return ctx
}
