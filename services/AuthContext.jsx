import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState(null)
  const isDoctor = role === 'doctor'

  useEffect(() => {
    const initSession = async () => {
      const { data } = await supabase.auth.getSession()
      const session = data?.session

      if (session) {
        setUser(session.user)
        setRole(session.user?.user_metadata?.role || 'patient')
      }

      setLoading(false)
    }

    initSession()

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session) {
          setUser(session.user)
          setRole(session.user?.user_metadata?.role || 'patient')
        } else {
          setUser(null)
          setRole(null)
        }
      }
    )

    return () => {
      listener?.subscription?.unsubscribe()
    }
  }, [])

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return data.user
  }

  const signup = async ({ email, password, full_name, role }) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
          role,
        },
      },
    })
    if (error) throw error
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, loading, role, isDoctor, login, signup, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}