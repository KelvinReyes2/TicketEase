import React, { useEffect, useState } from "react";
import { getAuth, signOut } from "firebase/auth";
import { db } from "../../firebase";
import { doc, onSnapshot, updateDoc, getDoc, setDoc } from "firebase/firestore";
import { Outlet, Link, useLocation } from "react-router-dom";

// Import images
import LogoM from "../../images/logoM.png";
import IconDashboard from "../../images/Dashboard White.png";
import IconActivity from "../../images/Activity White.png";
import IconAdmin from "../../images/Admin.png";
import IconMap from "../../images/Map White.png";
import IconQuota from "../../images/Quota.png";
import IconUAC from "../../images/UAC White.png";
import IconKey from "../../images/key.png";
import IconMaintenanceBlue from "../../images/Maintenance Blue.png"; // current page icon

const auth = getAuth();

export default function DashboardMaintenanceLayout() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [status, setStatus] = useState("Operational Mode");
  const [maintenanceMessage, setMaintenanceMessage] = useState("");
  const [operationalMessage, setOperationalMessage] = useState("");
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const { pathname } = useLocation();

  const primaryColor = "#364C6E";
  const hoverBg = "#405a88";
  const signOutBg = "#ffffff";
  const signOutBgHover = "#f1f1f1";

  // Fetch system status and maintenance message from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "system", "Status"), (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        setStatus(data.status); // Operational Mode or Maintenance Mode
        if (data.status === "Maintenance Mode") {
          setMaintenanceMessage(data.message);
        } else {
          setMaintenanceMessage("");
        }
      } else {
        console.error("Document does not exist in Firestore");
      }
    }, (error) => {
      console.error("Error fetching Firestore data: ", error);
    });
    return () => unsubscribe();
  }, []);

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
    { to: "/QuotaManagementSuper", img: IconQuota, label: "Quota Management" },
    { to: "/UACSuper", img: IconUAC, label: "User Access Control" },
    { to: "/PasswordSuper", img: IconKey, label: "Password Reset Request" },
    { to: "/MaintenanceSuper", img: IconMaintenanceBlue, label: "Maintenance" }, // current
  ];

  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);
  };

  const handleMessageChange = (e) => {
    setMaintenanceMessage(e.target.value);
  };

  const handleOperationalMessageChange = (e) => {
    setOperationalMessage(e.target.value);
  };

  const handleSetStatus = async () => {
    try {
      setSaving(true); // Start spinner

      const systemRef = doc(db, "system", "Status");

      // Check if the document exists
      const docSnapshot = await getDoc(systemRef);
      const updatedData = {
        status: status,
        message: status === "Maintenance Mode" ? maintenanceMessage : operationalMessage,
        timestamp: new Date(),
      };

      if (docSnapshot.exists()) {
        // Document exists, update it
        await updateDoc(systemRef, updatedData);
        setToastMessage(`Status updated to: ${status}`);
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);
      } else {
        // Document does not exist, create it
        await setDoc(systemRef, updatedData);
        setToastMessage("The system status is set as " + status);
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);
      }
    } catch (error) {
      console.error("Error updating system status in Firestore: ", error);
      alert("Error updating system status in Firestore.");
    } finally {
      setSaving(false); // Stop spinner
    }
  };

  // Check if current page is MaintenanceSuper
  const isMaintenancePage = pathname === "/MaintenanceSuper";

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
                  className={[ 
                    "flex items-center px-4 py-2 rounded-lg transition-all duration-200 ease-in-out", 
                    "hover:scale-[1.02] hover:shadow-md", 
                    isActive ? "font-bold text-white" : "font-medium text-gray-300", 
                  ].join(" ")}
                  style={{
                    backgroundColor: isActive ? "white" : "transparent",
                    color: isActive ? primaryColor : "#ffffffff",
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
      <main className="flex-1 p-10">
        {isMaintenancePage ? (
          /* Maintenance Page Content */
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8 space-y-6">
            {/* Header */}
            <div className="border-b border-gray-200 pb-4 mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">Maintenance</h2>
                  <p className="text-sm text-gray-500">Update System Status</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl text-gray-600">Current Status:</span>
                  <span className="text-xl font-medium text-gray-900">{status}</span>
                  <div
                    className={`w-6 h-6 rounded-full ${status === "Operational Mode" ? "bg-green-500" : "bg-yellow-500"}`}
                  ></div>
                </div>
              </div>
            </div>

            {/* Status Selection */}
         <div className="mb-6">
              <label className="block text-l font-medium text-gray-700 mb-3">
                Set System Status:
              </label>
              <div className="space-y-3">
                {/* Operational Mode */}
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="Status"
                    value="Operational Mode"
                    checked={status === "Operational Mode"}
                    onChange={() => handleStatusChange("Operational Mode")}
                    className="w-5 h-5"
                    style={{
                      // Styling for unselected radio button
                      appearance: 'none',
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: '1px solid #ccc',  // Border color when unselected
                      backgroundColor: status === "Operational Mode" ? "#364C6E" : "#fff", // Background color when selected or unselected
                      cursor: 'pointer',
                      transition: 'background-color 0.3s, border-color 0.3s', // Smooth transition for hover and click
                    }}
                  />
                  <span className="ml-2 text-sm text-gray-700">Operational Mode</span>
                </label>

                {/* Maintenance Mode */}
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="Status"
                    value="Maintenance Mode"
                    checked={status === "Maintenance Mode"}
                    onChange={() => handleStatusChange("Maintenance Mode")}
                    className="w-5 h-5"
                    style={{
                      // Styling for unselected radio button
                      appearance: 'none',
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: '1px solid #ccc',  // Border color when unselected
                      backgroundColor: status === "Maintenance Mode" ? "#364C6E" : "#ffffffff", // Background color when selected or unselected
                      cursor: 'pointer',
                      transition: 'background-color 0.3s, border-color 0.3s', // Smooth transition for hover and click
                    }}
                  />
                  <span className="ml-2 text-sm text-gray-700">Maintenance Mode</span>
                </label>
              </div>
            </div>

            {/* Operational Mode Form */}
            {status === "Operational Mode" && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Operational Mode Message:
                </label>
                <textarea
                  value={operationalMessage}
                  onChange={handleOperationalMessageChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows="4"
                  placeholder="Enter a message for operational mode..."
                />
              </div>
            )}

            {/* Maintenance Message (only shown when Maintenance Mode is selected) */}
            {status === "Maintenance Mode" && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maintenance Message:
                </label>
                <textarea
                  value={maintenanceMessage}
                  onChange={handleMessageChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows="4"
                  placeholder="Enter a message for maintenance..."
                />
              </div>
            )}

            {/* Set Status Button */}
            <div className="flex justify-end">
              <button
                onClick={handleSetStatus}
                className="px-10 py-2 text-white text-l font-medium rounded-md shadow-lg transition-colors duration-200"
                style={{ backgroundColor: primaryColor }}
              >
                <div className="flex items-center gap-2">
                  {saving ? (
                    <svg
                      className="h-4 w-4 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4A4 4 0 004 12z"
                      />
                    </svg>
                  ) : null}
                  <span>Set Status</span>
                </div>
              </button>
            </div>
          </div>
        ) : (
          /* Other Pages Content */
          <Outlet />
        )}
      </main>

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[60] transform transition-all duration-300 opacity-100 translate-y-0">
          <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 px-5 py-3 text-green-800 shadow-md w-[520px] max-w-[90vw]">
            <div className="mt-0.5">
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-green-500">
                <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
            </div>
            <div className="text-sm">
              <div className="font-semibold">{toastMessage}</div>
            </div>
          </div>
        </div>
      )}

      {/* Logout Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-xl shadow-2xl p-12 px-20 w-full max-w-lg"
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
