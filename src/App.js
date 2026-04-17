import { useState, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import Login from "@/pages/Login";
import SwimmerDashboard from "@/pages/SwimmerDashboard";
import CoachDashboard from "@/pages/CoachDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import { Toaster } from "@/components/ui/sonner";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  // Interceptor global: cualquier 401 (token caducado/inválido) expulsa al
  // usuario al login. No aplica al propio /auth/login, que usa 401 para
  // credenciales incorrectas.
  useEffect(() => {
    const id = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        const status = error.response?.status;
        const url = error.config?.url || "";
        const isLoginCall = url.includes("/auth/login");

        if (status === 401 && !isLoginCall) {
          const wasLoggedIn = !!localStorage.getItem("token");
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setUser(null);
          if (wasLoggedIn) {
            toast.error("Tu sesión ha caducado, vuelve a iniciar sesión");
          }
        }
        return Promise.reject(error);
      }
    );
    return () => axios.interceptors.response.eject(id);
  }, []);

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleUserUpdate = (updatedUserData) => {
    const newUser = { ...user, ...updatedUserData };
    localStorage.setItem('user', JSON.stringify(newUser));
    setUser(newUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="animate-pulse text-[#278D33] text-xl font-semibold">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={user ? <Navigate to="/" /> : <Login onLogin={handleLogin} />}
          />
          <Route
            path="/"
            element={
              !user ? (
                <Navigate to="/login" />
              ) : user.role === "swimmer" ? (
                <SwimmerDashboard user={user} onLogout={handleLogout} onUserUpdate={handleUserUpdate} />
              ) : user.role === "coach" ? (
                <CoachDashboard user={user} onLogout={handleLogout} onUserUpdate={handleUserUpdate} />
              ) : user.role === "admin" ? (
                <AdminDashboard user={user} onLogout={handleLogout} onUserUpdate={handleUserUpdate} />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </div>
  );
}

export default App;
