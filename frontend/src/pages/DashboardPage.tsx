import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { DailyPage } from "./DailyPage";
import { NotePage } from "./NotePage";
import { WeekReviewPage } from "./WeekReviewPage";

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<"daily" | "review" | "notes">(
    "daily",
  );

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
            {(["daily", "review", "notes"] as const).map((tab) => (
              <button
                key={tab}
                className={`sidebar-tab ${activeTab === tab ? "active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area - Tab View */}
        {activeTab === "daily" && <DailyPage />}

        {activeTab === "review" && (
          <div className="dashboard-main tab-view">
            <WeekReviewPage />
          </div>
        )}

        {activeTab === "notes" && <NotePage />}
      </div>
    </div>
  );
};
