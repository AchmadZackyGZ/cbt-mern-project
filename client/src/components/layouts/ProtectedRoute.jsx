import { Navigate, Outlet } from "react-router-dom";
import useAuthStore from "../../stores/authStore";

const ProtectedRoute = () => {
  // Ambil token dari Zustand
  const token = useAuthStore((state) => state.token);

  // Jika token ada, render child route (Outlet)
  // Jika tidak, redirect ke /login
  return token ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
