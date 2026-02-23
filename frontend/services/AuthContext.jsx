import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔥 Fetch profile from DB
  const fetchProfile = async (authUser) => {
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Profile fetch error:", error.message);
      }

      // Always refresh session token
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (token) {
        localStorage.setItem("khushi_token", token);
      }

      setUser({ ...authUser, ...profile });
      setRole(profile?.role || authUser?.user_metadata?.role || "patient");
    } catch (err) {
      console.error("Fetch profile failed:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error || !data?.session) {
          setLoading(false);
          return;
        }

        await fetchProfile(data.session.user);
      } catch (err) {
        console.error("Session error:", err.message);
        setLoading(false);
      }
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_, session) => {
      if (!mounted) return;

      if (session?.user) {
        await fetchProfile(session.user);
      } else {
        setUser(null);
        setRole(null);
        localStorage.removeItem("khushi_token");
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    await fetchProfile(data.user);
    return data.user;
  };

  const signup = async ({ email, password, full_name, role = "patient" }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name, role },
      },
    });

    if (error) throw error;

    if (data.user) {
      await fetchProfile(data.user);
    }

    return data.user;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
    localStorage.removeItem("khushi_token");
  };

  const isDoctor = role === "doctor";
  const isPatient = role === "patient";

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        loading,
        login,
        signup,
        signOut,
        isDoctor,
        isPatient,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return ctx;
}