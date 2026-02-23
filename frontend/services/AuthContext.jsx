import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [role, setRole] = useState(null)
    const [loading, setLoading] = useState(true)

    const fetchProfile = async (authUser) => {
        try {
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', authUser.id)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Error fetching profile:', error.message);
            }

            // Re-fetch token to store for backend API usage
            const { data } = await supabase.auth.getSession();
            if (data?.session?.access_token) {
                localStorage.setItem('khushi_token', data.session.access_token);
            }

            const finalUser = { ...authUser, ...profile };
            setUser(finalUser);
            setRole(profile?.role || 'patient');
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        // Check active session on load
        const getSession = async () => {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error || !session) {
                setLoading(false);
                return;
            }
            await fetchProfile(session.user);
        }

        getSession();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                await fetchProfile(session.user);
            } else {
                setUser(null);
                setRole(null);
                localStorage.removeItem('khushi_token');
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const login = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await fetchProfile(data.user);
        return data.user;
    }

    const signup = async (userData) => {
        const { email, password, full_name, role = 'patient' } = userData;
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name, role }
            }
        });
        if (error) throw error;
        if (data.user) {
            await fetchProfile(data.user);
        }
        return data.user;
    }

    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setRole(null);
        localStorage.removeItem('khushi_token');
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
