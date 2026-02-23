import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // -----------------------------
  // Store token safely
  // -----------------------------
  const storeToken = async () => {
    const { data } = await supabase.auth.getSession();

    if (data?.session?.access_token) {
      localStorage.setItem(
        "khushi_token",
        data.session.access_token
      );
    } else {
      localStorage.removeItem("khushi_token");
    }
  };

  // -----------------------------
  // Fetch profile
  // -----------------------------
  const fetchProfile = async (authUser) => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single();

      await storeToken();

      setUser({ ...authUser, ...profile });
      setRole(profile?.role || "patient");
    } catch (err) {
      console.error("Profile error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // Initial session load
  // -----------------------------
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!mounted) return;

      if (session?.user) {
        await fetchProfile(session.user);
      } else {
        setLoading(false);
      }
    };

    init();

    const { data: { subscription } } =
      supabase.auth.onAuthStateChange(
        async (_event, session) => {
          if (!mounted) return;

          if (session?.user) {
            await fetchProfile(session.user);
          } else {
            setUser(null);
            setRole(null);
            localStorage.removeItem("khushi_token");
            setLoading(false);
          }
        }
      );

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // -----------------------------
  // Login
  // -----------------------------
  const login = async (email, password) => {
    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (error) throw error;

    if (data.user) {
      await fetchProfile(data.user);
    }

    return data.user;
  };

  // -----------------------------
  // Signup
  // -----------------------------
  const signup = async ({
    email,
    password,
    full_name,
    role = "patient",
  }) => {
    const { data, error } =
      await supabase.auth.signUp({
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

  // -----------------------------
  // Logout
  // -----------------------------
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
  if (!ctx)
    throw new Error(
      "useAuth must be used within AuthProvider"
    );
  return ctx;
}import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // -----------------------------
  // Store token safely
  // -----------------------------
  const storeToken = async () => {
    const { data } = await supabase.auth.getSession();

    if (data?.session?.access_token) {
      localStorage.setItem(
        "khushi_token",
        data.session.access_token
      );
    } else {
      localStorage.removeItem("khushi_token");
    }
  };

  // -----------------------------
  // Fetch profile
  // -----------------------------
  const fetchProfile = async (authUser) => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single();

      await storeToken();

      setUser({ ...authUser, ...profile });
      setRole(profile?.role || "patient");
    } catch (err) {
      console.error("Profile error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // Initial session load
  // -----------------------------
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!mounted) return;

      if (session?.user) {
        await fetchProfile(session.user);
      } else {
        setLoading(false);
      }
    };

    init();

    const { data: { subscription } } =
      supabase.auth.onAuthStateChange(
        async (_event, session) => {
          if (!mounted) return;

          if (session?.user) {
            await fetchProfile(session.user);
          } else {
            setUser(null);
            setRole(null);
            localStorage.removeItem("khushi_token");
            setLoading(false);
          }
        }
      );

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // -----------------------------
  // Login
  // -----------------------------
  const login = async (email, password) => {
    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (error) throw error;

    if (data.user) {
      await fetchProfile(data.user);
    }

    return data.user;
  };

  // -----------------------------
  // Signup
  // -----------------------------
  const signup = async ({
    email,
    password,
    full_name,
    role = "patient",
  }) => {
    const { data, error } =
      await supabase.auth.signUp({
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

  // -----------------------------
  // Logout
  // -----------------------------
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
  if (!ctx)
    throw new Error(
      "useAuth must be used within AuthProvider"
    );
  return ctx;
}import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // -----------------------------
  // Store token safely
  // -----------------------------
  const storeToken = async () => {
    const { data } = await supabase.auth.getSession();

    if (data?.session?.access_token) {
      localStorage.setItem(
        "khushi_token",
        data.session.access_token
      );
    } else {
      localStorage.removeItem("khushi_token");
    }
  };

  // -----------------------------
  // Fetch profile
  // -----------------------------
  const fetchProfile = async (authUser) => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single();

      await storeToken();

      setUser({ ...authUser, ...profile });
      setRole(profile?.role || "patient");
    } catch (err) {
      console.error("Profile error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // Initial session load
  // -----------------------------
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!mounted) return;

      if (session?.user) {
        await fetchProfile(session.user);
      } else {
        setLoading(false);
      }
    };

    init();

    const { data: { subscription } } =
      supabase.auth.onAuthStateChange(
        async (_event, session) => {
          if (!mounted) return;

          if (session?.user) {
            await fetchProfile(session.user);
          } else {
            setUser(null);
            setRole(null);
            localStorage.removeItem("khushi_token");
            setLoading(false);
          }
        }
      );

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // -----------------------------
  // Login
  // -----------------------------
  const login = async (email, password) => {
    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (error) throw error;

    if (data.user) {
      await fetchProfile(data.user);
    }

    return data.user;
  };

  // -----------------------------
  // Signup
  // -----------------------------
  const signup = async ({
    email,
    password,
    full_name,
    role = "patient",
  }) => {
    const { data, error } =
      await supabase.auth.signUp({
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

  // -----------------------------
  // Logout
  // -----------------------------
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
  if (!ctx)
    throw new Error(
      "useAuth must be used within AuthProvider"
    );
  return ctx;
}