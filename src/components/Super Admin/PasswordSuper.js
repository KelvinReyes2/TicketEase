import React, { useEffect, useMemo, useState } from "react";
import { getAuth, signOut, sendPasswordResetEmail } from "firebase/auth";
import {
  getFirestore,
  collection,
  onSnapshot,
  query,
  doc,
  updateDoc,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import { Link, Outlet, useLocation } from "react-router-dom";
import DataTable from "react-data-table-component";
import { FaCheck, FaTimes } from "react-icons/fa"; // Updated icons for approve and decline

// Images (ensure the paths/names match your /src/images)
import LogoM from "../../images/logoM.png";
import IconDashboard from "../../images/Dashboard White.png";
import IconActivity from "../../images/Activity White.png";
import IconAdmin from "../../images/Admin.png";
import IconMap from "../../images/Map White.png";
import IconQuota from "../../images/Quota.png";
import IconUAC from "../../images/UAC White.png";
import IconKeyBlue from "../../images/key blue.png"; // current page icon
import IconMaintenance from "../../images/Maintenance White.png";

// Firebase
const auth = getAuth();
const db = getFirestore();

export default function PasswordSuper() {
  const location = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Requests state
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  // UI state (search)
  const [search, setSearch] = useState("");

  // Toasts
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showDeclinedToast, setShowDeclinedToast] = useState(false);
  const [declinedToastMessage, setDeclinedToastMessage] = useState("");

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
    { to: "/AdminManagementSuper", img: IconAdmin, label: "Admin Management", color: "#f5b042" }, // Updated color for Admin Management
    { to: "/RouteManagementSuper", img: IconMap, label: "Route Management" },
    { to: "/QuotaManagementSuper", img: IconQuota, label: "Quota Management" },
    { to: "/UACSuper", img: IconUAC, label: "User Access Control" },
    { to: "/PasswordSuper", img: IconKeyBlue, label: "Password Reset Request" },
    { to: "/MaintenanceSuper", img: IconMaintenance, label: "Maintenance" },
  ];

  // ---------- Helpers ----------
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "N/A";
    if (timestamp.seconds) {
      const d = new Date(timestamp.seconds * 1000);
      return d.toLocaleString();
    }
    const d = new Date(timestamp);
    return Number.isNaN(d.getTime()) ? "N/A" : d.toLocaleString();
  };

  const toMillis = (v) => {
    if (!v) return 0;
    if (typeof v === "string") {
      const t = Date.parse(v);
      return Number.isNaN(t) ? 0 : t;
    }
    if (v?.seconds) return v.seconds * 1000 + Math.floor((v.nanoseconds || 0) / 1e6);
    return 0;
  };

  // ---------- Live fetch requests ----------
  useEffect(() => {
    const q = query(collection(db, "passwordRequestReset"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const tmp = [];
        snap.forEach((d) => {
          const x = d.data() || {};
          if (x.status === "pending") {
            tmp.push({
              id: d.id,
              user: x.user || "",
              role: x.role || "",
              requestedAt: x.requestedAt || x.createdAt || null,
              status: x.status || "pending",
              newPassword: x.newPassword,
            });
          }
        });

        tmp.sort((a, b) => {
          const ta = toMillis(a.requestedAt);
          const tb = toMillis(b.requestedAt);
          if (ta !== tb) return ta - tb;
          return (a.user || "").localeCompare(b.user || "");
        });

        setRequests(tmp);
        setLoading(false);
      },
      (e) => {
        setErr(e.message || "Failed to load password reset requests");
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  // ---------- Accept / Decline ----------
  const handleRequestAction = async (id, action, email) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));

    try {
      const reqRef = doc(db, "passwordRequestReset", id);

      await updateDoc(reqRef, {
        status: action === "Accepted" ? "Approved" : "Declined",
        approvedBy: "Super Admin",
        handledAt: new Date().toISOString(),
      });

      if (action === "Accepted") {
        // If approved, send a password reset email
        try {
          await sendPasswordResetEmail(auth, email);
          setToastMessage("Password reset email successfully sent to the user.");
          setShowSuccessToast(true);
          setTimeout(() => setShowSuccessToast(false), 3000);
        } catch (err) {
          setToastMessage(err?.message || "Failed to send password reset email.");
          setShowSuccessToast(true);
          setTimeout(() => setShowSuccessToast(false), 3000);
        }
      } else {
        setDeclinedToastMessage("Password reset request declined.");
        setShowDeclinedToast(true);
        setTimeout(() => setShowDeclinedToast(false), 3000);
      }

      // Only delete rejected requests
      if (action === "Declined") {
        await deleteDoc(reqRef);
      }

    } catch (error) {
      try {
        const qs = await getDocs(collection(db, "passwordRequestReset"));
        const rebuilt = [];
        qs.forEach((d) => rebuilt.push({ id: d.id, ...d.data() }));
        setRequests(rebuilt);
      } catch {}
      alert(error?.message || "Failed to update request.");
    }
  };

  // ---------- Badges ----------
  const StatusBadge = ({ value }) => {
    const v = (value || "").toLowerCase();
    const map = {
      pending: { label: "Pending", bg: "bg-yellow-100", text: "text-yellow-800", dot: "bg-yellow-500", border: "border-yellow-200" },
      approved: { label: "Approved", bg: "bg-green-100", text: "text-green-700", dot: "bg-green-500", border: "border-green-200" },
      declined: { label: "Declined", bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500", border: "border-red-200" },
    };
    const s = map[v] || map.pending;
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${s.bg} ${s.text} border ${s.border}`}>
        <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${s.dot}`} />
        {s.label}
      </span>
    );
  };

  // ---------- Table ----------
  const tableStyles = {
    table: { style: { borderRadius: "1rem", width: "100%", tableLayout: "auto" } },
    headRow: {
      style: {
        minHeight: "40px",
        backgroundColor: primaryColor,
        borderTopLeftRadius: "0.75rem",
        borderTopRightRadius: "0.75rem",
        borderBottom: "1px solid #e5e7eb",
        position: "sticky",
        top: 0,
        zIndex: 1,
      },
    },
    headCells: {
      style: {
        fontWeight: 700,
        color: "#ffffff",
        fontSize: "14px",
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        padding: "10px 12px",
        alignItems: "center",
        whiteSpace: "nowrap",
      },
    },
    rows: { style: { minHeight: "44px", borderBottom: "1px solid #f1f5f9" } },
    cells: {
      style: {
        padding: "10px 12px",
        fontSize: "14px",
        color: "#0f172a",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      },
    },
  };

  // Search
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return requests.filter((r) => {
      const text = `${r.user} ${r.role} ${r.status}`.toLowerCase();
      const okSearch = !q || text.includes(q);
      return okSearch;
    });
  }, [requests, search]);

  const dataWithRowNumber = useMemo(
    () => filtered.map((r, i) => ({ ...r, _row: i + 1 })),
    [filtered]
  );

  const columns = [
    {
      name: "ID",
      selector: (r) => r._row,
      width: "88px",
      right: true,
    },
    {
      name: "User",
      selector: (r) => r.user,
      sortable: true,
      grow: 1,
      cell: (r) => (
        <div className="truncate" title={r.user}>
          {r.user}
        </div>
      ),
    },
    {
      name: "Role",
      selector: (r) => r.role,
      sortable: true,
      grow: 1,
      cell: (r) => (
        <div className="truncate" title={r.role}>
          {r.role || "—"}
        </div>
      ),
    },
    {
      name: "Requested At",
      selector: (r) => toMillis(r.requestedAt),
      sortable: true,
      grow: 1,
      cell: (r) => (
        <div className="truncate" title={formatTimestamp(r.requestedAt)}>
          {formatTimestamp(r.requestedAt)}
        </div>
      ),
    },
    {
      name: "Status",
      selector: (r) => r.status || "pending",
      sortable: true,
      center: true,
      grow: 1,
      cell: (r) => <StatusBadge value={r.status || "pending"} />,
    },
    {
      name: "Action",
      button: true,
      center: true,
      width: "160px",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleRequestAction(row.id, "Accepted", row.user)}
            title="Approve"
            className="inline-flex items-center justify-center h-9 px-6 rounded-md bg-green-600 text-white hover:shadow-md transition text-sm font-semibold hover:scale-[1.02]"
          >
            <FaCheck size={16} />
          </button>
          <button
            onClick={() => handleRequestAction(row.id, "Declined", row.user)}
            title="Decline"
            className="inline-flex items-center justify-center h-9 px-6 rounded-md bg-red-600 text-white hover:shadow-md transition text-sm font-semibold hover:scale-[1.02]"
          >
            <FaTimes size={16} />
          </button>
        </div>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
    },
  ];

  const isThisPage = location.pathname === "/PasswordSuper";

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
            {navLinks.map(({ to, img, label, color }) => {
              const isActive = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={[ 
                    "flex items-center px-4 py-2 rounded-lg transition-all duration-200 ease-in-out", 
                    "hover:scale-[1.02] hover:shadow-md", 
                    isActive ? "font-bold" : "font-medium", 
                  ].join(" ")}
                  style={{
                    backgroundColor: isActive ? "white" : "transparent", 
                    color: isActive ? primaryColor : "white",
                    borderColor: color || primaryColor,
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
      <main className="flex-1 p-10 mx-auto">
        {!isThisPage ? (
          <Outlet />
        ) : (
          <div className="mx-auto w-full max-w-[1900px]">
            <div
              className="bg-white border rounded-xl shadow-sm flex flex-col"
              style={{ minHeight: "calc(100vh - 112px)" }}
            >
              {/* Header */}
              <div className="px-6 pt-6 pb-4 border-b flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-gray-800">Password Reset Requests</h1>

                <div className="flex items-center gap-3">
                  {/* Search */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by email"
                      className="w-[420px] rounded-full border border-gray-200 pl-10 pr-3 py-2.5 text-sm shadow-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-300 outline-none"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                    <div className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-gray-400">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4.5 w-4.5"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M15.5 14h-.8l-.3-.3A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16a6.471 6.471 0 0 0 4.2-1.6l.3.3v.8l5 5 1.5-1.5-5-5Zm-6 0C7 14 5 12 5 9.5S7 5 9.5 5 14 7 14 9.5 12 14 9.5 14Z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="px-6 py-4 flex-1">
                {err && (
                  <div className="mb-3 text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded">
                    {err}
                  </div>
                )}

                <DataTable
                  columns={columns}
                  data={dataWithRowNumber}
                  progressPending={loading}
                  customStyles={tableStyles}
                  highlightOnHover
                  striped
                  dense
                  persistTableHead
                  responsive
                  pagination
                  paginationComponentOptions={{ noRowsPerPage: true }}
                  fixedHeader
                  fixedHeaderScrollHeight="70vh"
                />
              </div>
            </div>
          </div>
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

      {/* Declined Toast */}
      {showDeclinedToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[60] transform transition-all duration-300 opacity-100 translate-y-0">
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-5 py-3 text-red-800 shadow-md w-[520px] max-w-[90vw]">
            <div className="mt-0.5">
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-red-500">
                <path d="M6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12 19 6.4 17.6 5 12 10.6 6.4 5z" />
              </svg>
            </div>
            <div className="text-sm">
              <div className="font-semibold">{declinedToastMessage}</div>
            </div>
          </div>
        </div>
      )}

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