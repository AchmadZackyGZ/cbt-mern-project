import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import App from "./App.jsx";

// Pages
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminUsers from "./pages/admin/AdminUsers.jsx";
import AdminQuizzes from "./pages/admin/AdminQuizzes.jsx";
import AdminQuestions from "./pages/admin/AdminQuestions.jsx";
import ExamPage from "./pages/ExamPage.jsx";
import AdminResults from "./pages/admin/AdminResults.jsx";

// Components
import ProtectedRoute from "./components/layouts/ProtectedRoute.jsx";

// Store
import useAuthStore from "./stores/authStore.js";

// Styles
import "katex/dist/katex.min.css";
import "./index.css";

// --- KOMPONEN PENGATUR LALU LINTAS (RootRedirect) ---
const RootRedirect = () => {
  // Ambil data dari Zustand
  const { token, user } = useAuthStore();

  // 1. Jika tidak ada token, lempar ke Login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // 2. Jika ada token, Cek Role:
  if (user?.role === "admin") {
    return <Navigate to="/admin/dashboard" replace />;
  } else {
    return <Navigate to="/dashboard" replace />;
  }
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          {/* --- INI KUNCINYA AGAR TIDAK BLANK --- */}
          {/* 'index' artinya ini dijalankan saat path tepat di '/' */}
          <Route index element={<RootRedirect />} />

          {/* Public Routes */}
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />

          {/* Student Routes (Protected) */}
          <Route element={<ProtectedRoute />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="exam/:quizId" element={<ExamPage />} />
          </Route>

          {/* Admin Routes (Protected) */}
          <Route path="admin" element={<ProtectedRoute />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="quizzes" element={<AdminQuizzes />} />

            {/* Rute Baru: Menangkap ID Kuis */}
            <Route
              path="quizzes/:quizId/questions"
              element={<AdminQuestions />}
            />
            <Route path="quizzes/:quizId/results" element={<AdminResults />} />
          </Route>

          {/* Catch All (404) -> Lempar balik ke RootRedirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
