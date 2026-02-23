import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [role, setRole] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const init = async () => {
            const { data } = await supabase.auth.getSession()

            if (data?.session) {
                const sessionUser = data.session.user
                const token = data.session.access_token

                localStorage.setItem('khushi_token', token)

                setUser(sessionUser)
                setRole(sessionUser.user_metadata?.role || 'patient')
            }

            setLoading(false)
        }

        init()

        const { data: { subscription } } =
            supabase.auth.onAuthStateChange((event, session) => {
                if (session) {
                    localStorage.setItem('khushi_token', session.access_token)
                    setUser(session.user)
                    setRole(session.user.user_metadata?.role || 'patient')
                } else {
                    localStorage.removeItem('khushi_token')
                    setUser(null)
                    setRole(null)
                }
            })

        return () => subscription.unsubscribe()
    }, [])

    const login = async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
    }

    const signup = async (email, password, full_name, role = 'patient') => {
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name, role }
            }
        })
        if (error) throw error
    }

    const signOut = async () => {
        await supabase.auth.signOut()
        localStorage.removeItem('khushi_token')
        setUser(null)
        setRole(null)
    }

    return (
        <AuthContext.Provider value={{ user, role, loading, login, signup, signOut }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
    return ctx
}