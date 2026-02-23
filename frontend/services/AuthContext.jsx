import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (!mounted) return

        if (session?.user) {
          setUser(session.user)
          setRole(session.user.user_metadata?.role || 'patient')
        } else {
          setUser(null)
          setRole(null)
        }
      } catch (err) {
        console.error("Auth init error:", err)
        setUser(null)
        setRole(null)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    initAuth()

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return

        if (session?.user) {
          setUser(session.user)
          setRole(session.user.user_metadata?.role || 'patient')
        } else {
          setUser(null)
          setRole(null)
        }

        setLoading(false)
      }
    )

    return () => {
      mounted = false
      listener?.subscription?.unsubscribe()
    }
  }, [])

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data.user
  }

  const signup = async ({ email, password, full_name, role = 'patient' }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name, role }
      }
    })
    if (error) throw error
    return data.user
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setRole(null)
  }

  return (
    <AuthContext.Provider value={{
      user,
      role,
      loading,
      login,
      signup,
      signOut,
      isDoctor: role === 'doctor',
      isPatient: role === 'patient'
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}