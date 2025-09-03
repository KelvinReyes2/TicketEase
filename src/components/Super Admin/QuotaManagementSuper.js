import React, { useEffect, useState } from "react";
import { getAuth, signOut } from "firebase/auth";
import { db } from "../../firebase";
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import { Link, useLocation } from "react-router-dom";
import { Wallet } from "lucide-react"; // ✅ Professional icon for Current Quota

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

export default function QuotaManagementSuper() {
  const location = useLocation();

  const primaryColor = "#364C6E";
  const hoverBg = "#405a88";
  const signOutBg = "#ffffff";
  const signOutBgHover = "#f1f1f1";

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  
  const [currentQuota, setCurrentQuota] = useState(0);
  const [newQuota, setNewQuota] = useState("");
  const [confirmQuota, setConfirmQuota] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false); // Track saving state
  const [quotaMatchError, setQuotaMatchError] = useState(false);

  const openModal = () => setIsModalOpen(true);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      window.location.href = "/";
    } catch (error) {
      alert("Error signing out: " + error.message);
    }
  };

  // Sidebar Navigation
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

  // Fetch latest quota document to display current quota
  useEffect(() => {
    const fetchQuota = async () => {
      try {
        const q = query(
          collection(db, "quota"),
          orderBy("Date", "desc"),
          limit(1)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          const docSnap = snap.docs[0];
          setCurrentQuota(parseFloat(docSnap.data().TargetQuota) || 0);
        }
      } catch (e) {
        console.error("Error fetching quota:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchQuota();
  }, []);

  // Save updated quota to ALL documents in the quota collection
  const handleSaveQuota = async () => {
    if (!newQuota || !confirmQuota) {
      return; // Simply return without saving if fields are empty
    }

    if (newQuota !== confirmQuota) {
      setQuotaMatchError(true); // Set error state to true if the quotas don't match
      return;
    }

    setQuotaMatchError(false); // Reset error state if quotas match
    setSaving(true); // Start saving

    try {
      const value = parseFloat(newQuota);
      if (isNaN(value) || value <= 0) {
        setQuotaMatchError(true); // Set error state to true if the value is invalid
        setSaving(false); // Stop saving
        return;
      }

      // Fetch ALL documents in the quota collection
      const quotaQuery = query(collection(db, "quota"));
      const querySnapshot = await getDocs(quotaQuery);
      
      // Update each document with the new TargetQuota
      const updatePromises = querySnapshot.docs.map(docSnapshot => 
        updateDoc(doc(db, "quota", docSnapshot.id), {
          TargetQuota: value.toString(),
          updatedAt: new Date(),
        })
      );

      // Execute all updates
      await Promise.all(updatePromises);

      setCurrentQuota(value);
      setNewQuota("");
      setConfirmQuota("");

      setToastMessage(`Quota updated successfully! Updated ${querySnapshot.docs.length} quota records.`);
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } catch (e) {
      console.error("Error saving quota:", e);
      setQuotaMatchError(true); // Set error state to true if there's an issue saving the quota
      setToastMessage("Error updating quota. Please try again.");
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } finally {
      setSaving(false); // Stop saving
    }
  };

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
              const isActive = location.pathname === to;
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
                    color: isActive ? primaryColor: "#ffffffff",
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
        <div className="mx-auto w-full max-w-[1200px]">
          <div
            className="bg-white border rounded-xl shadow-sm flex flex-col p-9"
            style={{ minHeight: "calc(70vh - 112px)" }}
          >
            <h1 className="text-2xl font-semibold text-gray-800 mb-6">
              Quota Management
            </h1>

            {loading ? (
              <p>Loading...</p>
            ) : (
              <div className="grid grid-cols-2 gap-10 mt-11">
                {/* Current Quota */}
                <div className="flex flex-col items-center justify-center border-r pr-10">
                  <h2 className="text-lg font-semibold text-gray-600 mb-2 flex items-center gap-2 mt-1">
                    <Wallet className="w-8 h-8 text-blue-600" />
                    Current Quota
                  </h2>
                  <div className="text-5xl font-bold text-gray-800 flex items-center gap-2">
                    <span>₱</span>
                    {currentQuota.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                </div>

                {/* Quota Change */}
                <div className="flex flex-col">
                  <h2 className="text-2xl font-semibold text-gray-600 mb-2">
                    Quota Change
                  </h2>
                  <p className="text-base text-gray-500 mb-4">
                    NOTE: If you want to modify the current quota, input the new quota and
                    retype the quota to confirm that you really want to change it. This is
                    applicable to all active drivers and will update ALL quota records.
                  </p>

                  <input
                    type="number"
                    placeholder="Enter new quota"
                    className={`w-full border rounded-md px-3 py-2 mb-2 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-300 ${quotaMatchError ? "bg-red-100 border-red-500" : ""}`}
                    value={newQuota}
                    onChange={(e) => setNewQuota(e.target.value)}
                  />
                  <input
                    type="number"
                    placeholder="Confirm new quota"
                    className={`w-full border rounded-md px-3 py-2 mb-2 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-300 ${quotaMatchError ? "bg-red-100 border-red-500" : ""}`}
                    value={confirmQuota}
                    onChange={(e) => setConfirmQuota(e.target.value)}
                  />

                  {quotaMatchError && (
                    <div className="flex items-center space-x-2 mt-3">
                      <p className="text-red-500 text-sm font-semibold">
                        The quota values you entered do not match. Please ensure that both the 'New Quota' and 'Confirm Quota' fields contain the same value before proceeding.
                      </p>
                    </div>
                  )}

                  <button
                    onClick={handleSaveQuota}
                    disabled={saving}
                    className="px-5 py-2 rounded-lg text-white shadow-md hover:opacity-95 disabled:opacity-60 self-start mt-4"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {saving && (
                      <svg className="h-5 w-5 animate-spin inline-block mr-2" viewBox="0 0 24 24" >
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
                    )}
                    Save Changes
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
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
          onClick={() => setIsModalOpen(false)}
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
                onClick={() => setIsModalOpen(false)}
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