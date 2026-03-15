import { Navigate, Route, Routes } from "react-router-dom";

import Layout from "./components/Layout.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import CreateQueryPage from "./pages/CreateQueryPage.jsx";
import QueryDetailPage from "./pages/QueryDetailPage.jsx";
import FAQPage from "./pages/FAQPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/queries"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/queries/new"
          element={
            <ProtectedRoute>
              <CreateQueryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/queries/:id"
          element={
            <ProtectedRoute>
              <QueryDetailPage />
            </ProtectedRoute>
          }
        />

        <Route path="/faq" element={<ProtectedRoute><FAQPage /></ProtectedRoute>} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Layout>
  );
}
