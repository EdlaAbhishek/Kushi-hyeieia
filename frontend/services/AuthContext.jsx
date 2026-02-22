import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [role, setRole] = useState(null)   // 'patient' | 'doctor' | 'admin'
    const [loading, setLoading] = useState(true)

    // Fetch role — tries multiple sources in order
    const fetchRole = async (authUser) => {
        if (!authUser) { setRole(null); return }

        // 1. Check user_metadata first (set during signup)
        const metaRole = authUser.user_metadata?.role
        if (metaRole === 'doctor' || metaRole === 'patient') {
            console.log('[AuthContext] Role from metadata:', metaRole)
            setRole(metaRole)
            return
        }

        // 2. Try profiles table
        try {
            const { data } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', authUser.id)
                .maybeSingle()

            if (data?.role) {
                console.log('[AuthContext] Role from profiles:', data.role)
                setRole(data.role)
                return
            }
        } catch (e) {
            console.warn('[AuthContext] profiles fetch failed:', e)
        }

        // 3. Fallback: check doctors table
        try {
            const { data: docData } = await supabase
                .from('doctors')
                .select('id')
                .eq('id', authUser.id)
                .maybeSingle()

            if (docData) {
                console.log('[AuthContext] Role from doctors table: doctor')
                setRole('doctor')
                return
            }
        } catch (e) {
            console.warn('[AuthContext] doctors check failed:', e)
        }

        // 4. Default
        console.log('[AuthContext] Defaulting to patient')
        setRole('patient')
    }

    useEffect(() => {
        let mounted = true

        supabase.auth.getSession().then(async ({ data: { session } }) => {
            const u = session?.user ?? null
            if (!mounted) return
            setUser(u)
            if (u) {
                await fetchRole(u)
            }
            if (mounted) setLoading(false)
        })

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            const u = session?.user ?? null
            if (!mounted) return
            setUser(u)
            if (u) {
                await fetchRole(u)
            } else {
                setRole(null)
            }
        })

        return () => { mounted = false; subscription.unsubscribe() }
    }, [])

    const signOut = async () => {
        await supabase.auth.signOut()
        setUser(null)
        setRole(null)
    }

    const isDoctor = role === 'doctor'
    const isPatient = role === 'patient' || (!role && !!user)

    return (
        <AuthContext.Provider value={{ user, role, loading, signOut, isDoctor, isPatient }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used within AuthProvider')
    return ctx
}
