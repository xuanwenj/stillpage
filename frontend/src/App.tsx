import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ToastProvider } from "./toast";
import { ConfirmProvider } from "./toast";
import "./styles/modal.css";
import { NotePage } from "./pages/NotePage";
import { DailyPage } from "./pages/DailyPage";

function App() {
  return (
    <Router>
      <AuthProvider>
        <ConfirmProvider>
          <ToastProvider />
          <Routes>
            {/* Auth pages */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected pages */}

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="daily" replace />} />
              <Route path="daily" element={<DailyPage />} />
              <Route path="notes" element={<NotePage />} />
            </Route>

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </ConfirmProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
