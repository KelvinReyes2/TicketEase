import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";
import { Outlet } from "react-router-dom";
import IconDashboard from "../../images/Dashboard White.png";
import IconUnit from "../../images/Monitoring White.png";
import IconUser from "../../images/Admin.png";
import IconDriver from "../../images/Driver Blue.png";
import IconVehicle from "../../images/Vehicle White.png";
import IconReport from "../../images/Report.png";
import LogoM from "../../images/logoM.png";

const auth = getAuth();

export default function DriverDispatchLayout() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const location = useLocation();

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
    { to: "/dashboardAdmin", img: IconDashboard, label: "Dashboard" },
    { to: "/unitTracking", img: IconUnit, label: "Unit Tracking" },
    { to: "/userManagement", img: IconUser, label: "User Management" },
    { to: "/driverDispatch", img: IconDriver, label: "Driver Dispatch" },
    { to: "/vehicleManagement", img: IconVehicle, label: "Vehicle Management" },
    {
      to: "#",
      img: IconReport,
      label: "Report",
      isDropdown: true,
      onClick: () => setIsReportOpen(!isReportOpen),
    },
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
            {navLinks.map(({ to, img, label, isDropdown, onClick }) => {
              const isActive = location.pathname === to;
              return (
                <div key={label}>
                  {!isDropdown ? (
                    <Link
                      to={to}
                      className={[
                        "flex items-center px-4 py-2 rounded-lg transition-all duration-200 ease-in-out",
                        "hover:scale-[1.02] hover:shadow-md",
                        isActive ? "font-bold" : "font-medium",
                      ].join(" ")}
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
                  ) : (
                    <div>
                      <button
                        onClick={onClick}
                        className={[
                          "flex items-center px-4 py-2 rounded-lg w-full transition-all duration-200 ease-in-out",
                          "hover:scale-[1.02] hover:shadow-md",
                          isActive ? "font-bold" : "font-medium",
                        ].join(" ")}
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
                      </button>
                      {isReportOpen && (
                        <div className="pl-10 space-y-2 mt-2">
                          <Link
                            to="/report1"
                            className="block px-4 py-2 rounded-lg"
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hoverBg}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                          >
                            Transaction Overview
                          </Link>
                          <Link
                            to="/report2"
                            className="block px-4 py-2 rounded-lg"
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hoverBg}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                          >
                            Quota Summary
                          </Link>
                          <Link
                            to="/report3"
                            className="block px-4 py-2 rounded-lg"
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hoverBg}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                          >
                            Trip Logs
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Sign Out Button */}
        <div className="flex justify-center items-center w-full px-4 pb-6">
          <button
            onClick={openModal}
            className="flex items-center justify-center px-12 py-2 rounded-lg text-gray-800 font-semibold shadow-lg transition duration-200 hover:shadow-xl"
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
            className="bg-white rounded-xl shadow-2xl p-12 px-20 w/full max-w-l"
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