import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <h1>Stillpage</h1>
        <div className="dashboard-header-right">
          <span>{user?.name}</span>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>

      {/* Placeholder content */}
      <div>
        <p>Dashboard coming soon...</p>
        <p style={{ marginTop: "1rem" }}>
          Welcome back, {user?.name}! Your notes will appear here.
        </p>
      </div>
    </div>
  );
};
