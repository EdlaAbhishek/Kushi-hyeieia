import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { supabase } from './supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState(null)
  const isDoctor = role === 'doctor'
  const isAdmin = role === 'admin'
  
  // Track if login() already resolved role to avoid duplicate work
  const loginResolvedRef = useRef(false)

  const ensureProfile = async (sessionUser, resolvedRole) => {
    if (!sessionUser) return
    if (resolvedRole === 'admin') return
    
    try {
      const { error } = await supabase.from('patients').upsert([{
        id: sessionUser.id,
        email: sessionUser.email,
        full_name: sessionUser.user_metadata?.full_name || sessionUser.user_metadata?.name || sessionUser.email,
        role: resolvedRole || sessionUser.user_metadata?.role || 'patient'
      }], { onConflict: 'id', ignoreDuplicates: false })

      if (error) console.warn("Profile upsert note:", error.message)
    } catch (err) {
      console.warn("Could not upsert patient profile:", err)
    }
  }

  const resolveUserRole = async (userId, metadataRole) => {
    let userRole = metadataRole || 'patient'
    try {
      const { data: adminProfile } = await supabase
        .from('admins')
        .select('role')
        .eq('id', userId)
        .maybeSingle()
      
      if (adminProfile?.role) return adminProfile.role

      const { data: doctorProfile } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle()
        
      if (doctorProfile) return 'doctor'

      const { data: patientProfile } = await supabase
        .from('patients')
        .select('role')
        .eq('id', userId)
        .maybeSingle()
        
      if (patientProfile?.role) return patientProfile.role
    } catch (e) {
      console.warn("Error resolving role:", e)
    }
    return userRole
  }

  useEffect(() => {
    let mounted = true

    // Safety timeout: if loading is STILL true after 10s, force it false
    const safetyTimer = setTimeout(() => {
      if (mounted && loading) {
        console.warn("AuthContext: Safety timeout — forcing loading=false")
        setLoading(false)
      }
    }, 10000)

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return

        if (session) {
          setUser(session.user)
          
          // If login() already handled role resolution, skip duplicate work
          if (loginResolvedRef.current) {
            loginResolvedRef.current = false
            setLoading(false)
            return
          }

          // Use setTimeout(0) to defer async work OFF the Supabase internal auth lock
          // This prevents the Navigator LockManager timeout
          setTimeout(async () => {
            if (!mounted) return
            try {
              const resolvedRole = await resolveUserRole(session.user.id, session.user?.user_metadata?.role)
              if (mounted) {
                setRole(resolvedRole)
                if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
                  await ensureProfile(session.user, resolvedRole)
                }
              }
            } catch (err) {
              console.error("Auth context error:", err)
            } finally {
              if (mounted) setLoading(false)
            }
          }, 0)
        } else {
          setUser(null)
          setRole(null)
          setLoading(false)
        }
      }
    )

    return () => {
      mounted = false
      clearTimeout(safetyTimer)
      listener?.subscription?.unsubscribe()
    }
  }, [])

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error

    // Mark that we already resolved role, so onAuthStateChange skips duplicate work
    loginResolvedRef.current = true

    const resolvedRole = await resolveUserRole(data.user.id, data.user?.user_metadata?.role)
    setRole(resolvedRole)
    setUser(data.user)
    setLoading(false)
    
    data.user._resolvedRole = resolvedRole

    // Ensure profile in background — don't block navigation
    ensureProfile(data.user, resolvedRole).catch(() => {})

    return data.user
  }

  const signup = async ({ email, password, full_name, role }) => {
    const { data, error } = await supabase.auth.signUp({
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

    // Mark resolved to skip onAuthStateChange duplicate work
    loginResolvedRef.current = true
    setUser(data.user)
    setRole(role || 'patient')
    setLoading(false)

    // Create profile in background
    ensureProfile(data.user, role).catch(() => {})

    return data.user
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const loginWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      }
    })
    if (error) throw error
    return data
  }

  const resetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    if (error) throw error;
  }

  const updatePassword = async (newPassword) => {
    const { data, error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    return data;
  }

  return (
    <AuthContext.Provider value={{ user, loading, role, isDoctor, isAdmin, login, loginWithGoogle, resetPassword, updatePassword, signup, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}