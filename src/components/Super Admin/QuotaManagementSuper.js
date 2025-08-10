// src/components/Super Admin/DashboardQuotaLayout.js
import React, { useState } from "react";
import { getAuth, signOut } from "firebase/auth";
import { Outlet, Link, useLocation } from "react-router-dom";

// ✅ import images from src/images (case-sensitive)
import LogoM from "../../images/logoM.png";
import IconDashboard from "../../images/Dashboard White.png";
import IconActivity from "../../images/Activity White.png";
import IconAdmin from "../../images/Admin.png";
import IconMap from "../../images/Map White.png";
import IconQuotaBlue from "../../images/Quota Blue.png";
import IconUAC from "../../images/UAC White.png";
import IconKey from "../../images/key.png";
import IconMaintenance from "../../images/Maintenance White.png";

const auth = getAuth();

export default function DashboardQuotaLayout() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { pathname } = useLocation();

  const primaryColor = "#364C6E";
  const hoverBg = "#405a88";
  const signOutBg = "#ffffff";
  const signOutBgHover = "#f1f1f1";

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      window.location.href = "/";
    } catch (error) {
      alert("Error signing out: " + error.message);
    }
  };

  const navLinks = [
    { to: "/dashboardSuper", img: IconDashboard, label: "Dashboard" },
    { to: "/activityLogSuper", img: IconActivity, label: "Activity Log" },
    { to: "/AdminManagementSuper", img: IconAdmin, label: "Admin Management" },
    { to: "/RouteManagementSuper", img: IconMap, label: "Route Management" },
    { to: "/QuotaManagementSuper", img: IconQuotaBlue, label: "Quota Management" }, // current page
    { to: "/UACSuper", img: IconUAC, label: "User Access Control" },
    { to: "/PasswordSuper", img: IconKey, label: "Password Reset Request" },
    { to: "/MaintenanceSuper", img: IconMaintenance, label: "Maintenance" },
  ];

  return (
    <div className="flex bg-gray-100 min-h-screen">
      {/* Sidebar */}
      <aside
        className="w-64 min-h-screen text-white flex flex-col justify-between"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="flex flex-col items-center py-6">
          <img src={LogoM} alt="VODACTCO Logo" className="w-40 mb-8" />
          <nav className="w-full px-4 space-y-2 text-sm font-medium">
            {navLinks.map(({ to, img, label }) => {
              const isActive = pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center px-4 py-2 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-md ${
                    isActive ? "font-bold" : "font-medium"
                  }`}
                  style={{
                    backgroundColor: isActive ? "white" : "transparent",
                    color: isActive ? primaryColor : "white",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = hoverBg;
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <img
                    src={img}
                    alt={label}
                    className="w-5 h-5 mr-3 flex-shrink-0 object-contain"
                    draggable="false"
                  />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sign Out Button */}
        <div className="flex justify-center items-center w-full px-4 pb-6">
          <button
            onClick={openModal}
            className="flex items-center justify-center px-12 py-2 rounded-lg text-gray-800 font-semibold shadow-lg transition duration-200"
            style={{ backgroundColor: signOutBg, color: primaryColor }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = signOutBgHover)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = signOutBg)}
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <Outlet />
      </main>

      {/* Logout Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold text-gray-800 text-center mb-4">
              Confirm Sign Out
            </h2>
            <p className="text-gray-600 text-center mb-6">
              Are you sure you want to sign out?
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={closeModal}
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-blue-900 transition"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
