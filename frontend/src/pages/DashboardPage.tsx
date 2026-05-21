import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="dashboard-wrapper">
      {/* Navbar */}
      <div className="dashboard-navbar">
        <h1>Stillpage</h1>
        <div className="navbar-right">
          <span>{user?.name}</span>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Sidebar */}
        <div className="dashboard-sidebar">
          <nav className="sidebar-nav">
            <Link to="/dashboard/daily" className="sidebar-tab">
              Daily
            </Link>
            <Link to="/dashboard/review" className="sidebar-tab">
              Review
            </Link>
            <Link to="/dashboard/notes" className="sidebar-tab">
              Notes
            </Link>
          </nav>
        </div>
        <Outlet />
      </div>
    </div>
  );
};
