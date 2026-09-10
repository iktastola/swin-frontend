import { useState, useEffect, lazy, Suspense } from "react";
import "@/App.css";
import "@/lib/api";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import Login from "@/pages/Login";
import { Toaster } from "@/components/ui/sonner";
import { API_URL as API } from "@/lib/api";

const SwimmerDashboard = lazy(() => import("@/pages/SwimmerDashboard"));
const CoachDashboard = lazy(() => import("@/pages/CoachDashboard"));
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));

function App() {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token');
    const saved = localStorage.getItem('user');
    return token && saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Validar token en background. Si el token es válido, actualizamos los
    // datos del usuario (podrían haber cambiado en el servidor). Si no,
    // limpiamos la sesión. Importante: comprobamos que el token siga en
    // localStorage antes de actualizar el state para no sobreescribir un
    // logout que el usuario haya hecho durante la espera.
    axios
      .get(`${API}/users/me`, { timeout: 60000 })
      .then((res) => {
        if (localStorage.getItem('token')) {
          setUser(res.data);
          localStorage.setItem('user', JSON.stringify(res.data));
        }
      })
      .catch((error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        } else {
          toast.error("Error de conexión, inténtalo de nuevo");
        }
      });
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

  return (
    <div className="App">
      <BrowserRouter>
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50">
            <div className="animate-pulse text-[#278D33] text-xl font-semibold">Cargando...</div>
          </div>
        }>
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
            <Route
              path="*"
              element={<Navigate to="/" />}
            />
          </Routes>
        </Suspense>
      </BrowserRouter>
      <Toaster />
    </div>
  );
}

export default App;
