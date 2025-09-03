import React, { useState, useEffect, useMemo } from "react";
import { getAuth, signOut } from "firebase/auth";
import { Link, useLocation } from "react-router-dom";
import DataTable from "react-data-table-component";
import { FaEye, FaTimes, FaHistory } from "react-icons/fa"; // Changed FaClipboardList to FaHistory
import { formatDistanceToNow, format } from "date-fns"; // Make sure this is installed

import LogoM from "../../images/logoM.png";
import IconDashboard from "../../images/Dashboard White.png";
import IconActivity from "../../images/Activity Log Blue.png";
import IconAdmin from "../../images/Admin.png";
import IconMap from "../../images/Map White.png";
import IconQuota from "../../images/Quota.png";
import IconUAC from "../../images/UAC White.png";
import IconKey from "../../images/key.png";
import IconMaintenance from "../../images/Maintenance White.png";

import { db } from "../../firebase";
import { collection, onSnapshot } from "firebase/firestore";

const auth = getAuth();

export default function ActivityLogSuper() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");  // Start date filter
  const [filterEndDate, setFilterEndDate] = useState("");  // End date filter
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  const primaryColor = "#364C6E";
  const hoverBg = "#405a88"; // Re-added hoverBg
  const signOutBg = "#ffffff";
  const signOutBgHover = "#f1f1f1";

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const openViewModal = (log) => {
    setSelectedLog(log);
    setIsViewModalOpen(true);
  };
  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedLog(null);
  };

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
    { to: "/MaintenanceSuper", img: IconMaintenance, label: "Maintenance" },
  ];

  // Helper function to format timestamp with "Today", "Yesterday", etc.
  const formatTimestamp = (timestamp) => {
    try {
      let date;

      // Handle Firestore Timestamp
      if (timestamp && typeof timestamp.toDate === "function") {
        date = timestamp.toDate();
      }
      // Handle timestamp object with seconds property (Firestore)
      else if (timestamp && timestamp.seconds) {
        date = new Date(timestamp.seconds * 1000);
      }
      // Handle JavaScript Date
      else if (timestamp instanceof Date) {
        date = timestamp;
      } else if (typeof timestamp === "string" && !isNaN(Date.parse(timestamp))) {
        date = new Date(timestamp);
      } else {
        return "N/A";
      }

      // Relative time like "Today", "Yesterday", or "2 weeks ago"
      let relativeTime = formatDistanceToNow(date, { addSuffix: true });

      // Capitalize "Less than a minute" and "About 1 hour"
      if (relativeTime === "less than a minute ago") {
        relativeTime = "Less than a minute ago";
      } else if (relativeTime === "about 1 hour ago") {
        relativeTime = "About 1 hour ago";
      } else {
        // Capitalize the first letter of all other time strings (optional)
        relativeTime = relativeTime.charAt(0).toUpperCase() + relativeTime.slice(1);
      }

      // Actual date and time in the desired format (e.g., September 17, 2025, 10:28 AM)
      const fullDate = format(date, "MMMM dd, yyyy, hh:mm a");

      return { relativeTime, fullDate };
    } catch (error) {
      console.error("Error formatting timestamp:", error);
      return { relativeTime: "Invalid Date", fullDate: "Invalid Date" };
    }
  };

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "systemLogs"),
      (snap) => {
        const temp = [];
        snap.forEach((doc) => {
          const data = doc.data();
          const role = data.role || "Unknown Role";

          // Exclude 'super' role logs from being displayed
          if (role.toLowerCase() === "super") return;

          const logEntry = {
            id: doc.id,
            timestamp: data.timestamp || null,
            performedBy: data.performedBy || "Unknown User",
            activity: data.activity || "No activity description",
            role: data.role || "Unknown Role", // Added role
          };
          temp.push(logEntry);
        });

        setLogs(temp);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching logs:", error);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []); // Runs only once when component mounts

  const filteredLogs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return logs.filter((log) => {
      const text = `${log.performedBy || ""} ${log.activity || ""}`.toLowerCase();
      const matchesSearch = !q || text.includes(q);

      let matchesDateFilter = true;
      if (filterStartDate && filterEndDate) {
        const { fullDate } = formatTimestamp(log.timestamp);
        if (fullDate !== "N/A" && fullDate !== "Invalid Date") {
          const logDate = new Date(fullDate).toISOString().split("T")[0];
          matchesDateFilter = logDate >= filterStartDate && logDate <= filterEndDate;
        } else {
          matchesDateFilter = false;
        }
      }

      return matchesSearch && matchesDateFilter;
    });
  }, [logs, search, filterStartDate, filterEndDate]);

  const columns = [
    {
      name: "Timestamp",
      selector: (log) => formatTimestamp(log.timestamp).relativeTime,
      sortable: true,
      width: "500px",
      cell: (log) => (
        <div className="text-xl">
          <div style={{ fontWeight: "bold", fontSize: "14px" }}>
            {formatTimestamp(log.timestamp).relativeTime}
          </div>
          <div className="text-sm">{formatTimestamp(log.timestamp).fullDate}</div>
        </div>
      ),
    },
    {
      name: "User",
      selector: (log) => log.performedBy || "Unknown User",
      sortable: true,
      grow: 2,
      cell: (log) => (
        <div className="truncate" style={{ fontWeight: "bold", fontSize: "15px" }}>
          <div>{log.performedBy || "Unknown User"}</div>
          <div className="text-s" style={{ fontWeight: "normal" }}>
            {log.role || "Unknown Role"}
          </div>
        </div>
      ),
    },
    {
      name: "Activity",
      selector: (log) => log.activity || "No activity description",
      sortable: true,
      grow: 2,
      cell: (log) => (
        <div className="truncate" title={log.activity || "No activity description"} style={{fontSize: "15px" }}>
          {log.activity || "No activity description"}
        </div>
      ),
    },
    {
      name: "Action",
      button: true,
      center: true,
      width: "120px",
      cell: (log) => (
        <button
          onClick={() => openViewModal(log)}
          title="View Details"
          className="inline-flex items-center justify-center h-9 px-3 rounded-full border border-gray-200 bg-white text-gray-700 hover:shadow-md transition text-sm font-semibold"
        >
          <FaEye size={14} /> {/* Eye Icon for View Details */}
        </button>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
    },
  ];

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
      <main className="flex-1 p-10">
        <div className="mx-auto w-full max-w-[1900px]">
          <div
            className="bg-white border rounded-xl shadow-sm flex flex-col"
            style={{ minHeight: "calc(100vh - 112px)" }}
          >
            <div className="px-6 pt-6 pb-4 border-b flex items-center justify-between">
              <h1 className="text-2xl font-semibold text-gray-800">Activity Log</h1>
              <div className="flex items-center gap-4">
                <input
                  type="text"
                  placeholder="Search Log"
                  className="w-[420px] rounded-full border border-gray-200 pl-10 pr-3 py-2.5 text-sm shadow-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-300 outline-none mt-7"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <div className="flex items-center gap-3">
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      className="w-[160px] rounded-lg border border-gray-200 px-3 py-2.5 text-sm shadow-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-300 outline-none"
                      value={filterStartDate}
                      onChange={(e) => setFilterStartDate(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      className="w-[160px] rounded-lg border border-gray-200 px-3 py-2.5 text-sm shadow-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-300 outline-none"
                      value={filterEndDate}
                      onChange={(e) => setFilterEndDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 flex-1">
              <DataTable
                columns={columns}
                data={filteredLogs}
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

      {/* View Log Details Modal */}
      {isViewModalOpen && selectedLog && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50"
          onClick={closeViewModal}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <FaHistory size={20} className="text-gray-700" /> {/* Changed to FaHistory for activity history icon */}
                <h2 className="text-xl font-semibold text-gray-800">Log Details</h2>
              </div>
              <button
                onClick={closeViewModal}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="Close"
              >
                <FaTimes className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Timestamp</label>
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <div className="text-sm font-semibold">
                      {formatTimestamp(selectedLog.timestamp).relativeTime}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {formatTimestamp(selectedLog.timestamp).fullDate}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 mb-1">User</label>
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <div className="text-sm font-semibold">{selectedLog.performedBy || "Unknown User"}</div>
                    <div className="text-xs text-gray-600 mt-1">{selectedLog.role || "Unknown Role"}</div>
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-gray-700">Activity</label>
                  <div className="p-4 bg-gray-50 rounded-lg border min-h-[100px]">
                    <span className="text-sm whitespace-pre-wrap">
                      {selectedLog.activity || "No activity description"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end p-6 border-t border-gray-200">
              <button
                onClick={closeViewModal}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
