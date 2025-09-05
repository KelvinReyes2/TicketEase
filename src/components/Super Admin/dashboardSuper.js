import React, { useState, useEffect } from "react";
import { getAuth, signOut } from "firebase/auth";
import { Link, useLocation } from "react-router-dom";
import DataTable from "react-data-table-component";
import { FaUsersCog, FaLaptop, FaHistory } from "react-icons/fa";
import { formatDistanceToNow, format } from "date-fns";

import LogoM from "../../images/logoM.png";
import IconDashboard from "../../images/Dashboard Blue.png";
import IconActivity from "../../images/Activity White.png";
import IconAdmin from "../../images/Admin.png";
import IconMap from "../../images/Map White.png";
import IconQuota from "../../images/Quota.png";
import IconUAC from "../../images/UAC White.png";
import IconKey from "../../images/key.png";
import IconMaintenance from "../../images/Maintenance White.png";

import { db } from "../../firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";

const auth = getAuth();

export default function DashboardSuper() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [logs, setLogs] = useState([]);
  const [passwordRequests, setPasswordRequests] = useState([]);
  const [activeUsers, setActiveUsers] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(true);
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
    { to: "/dashboardSuper", img: IconDashboard, label: "Dashboard" },
    { to: "/activityLogSuper", img: IconActivity, label: "Activity Log" },
    { to: "/AdminManagementSuper", img: IconAdmin, label: "Admin Management" },
    { to: "/RouteManagementSuper", img: IconMap, label: "Route Management" },
    { to: "/QuotaManagementSuper", img: IconQuota, label: "Quota Management" },
    { to: "/UACSuper", img: IconUAC, label: "User Access Control" },
    { to: "/PasswordSuper", img: IconKey, label: "Password Reset Request" },
    { to: "/MaintenanceSuper", img: IconMaintenance, label: "Maintenance" },
  ];

  const formatTimestamp = (timestamp) => {
    try {
      let date;
      if (timestamp && typeof timestamp.toDate === "function") {
        date = timestamp.toDate();
      } else if (timestamp && timestamp.seconds) {
        date = new Date(timestamp.seconds * 1000);
      } else if (timestamp instanceof Date) {
        date = timestamp;
      } else if (typeof timestamp === "string" && !isNaN(Date.parse(timestamp))) {
        date = new Date(timestamp);
      } else {
        return "N/A";
      }

      let relativeTime = formatDistanceToNow(date, { addSuffix: true });

      if (relativeTime === "less than a minute ago") {
        relativeTime = "Less than a minute ago";
      } else if (relativeTime === "about 1 hour ago") {
        relativeTime = "About 1 hour ago";
      } else {
        relativeTime = relativeTime.charAt(0).toUpperCase() + relativeTime.slice(1);
      }

      const fullDate = format(date, "MMMM dd, yyyy, hh:mm a");
      return { relativeTime, fullDate };
    } catch (error) {
      console.error("Error formatting timestamp:", error);
      return { relativeTime: "Invalid Date", fullDate: "Invalid Date" };
    }
  };

  useEffect(() => {
    setLoading(true);

    const unsubLogs = onSnapshot(collection(db, "systemLogs"), (snap) => {
      const temp = [];
      snap.forEach((doc) => {
        const data = doc.data();
        const role = data.role || "Unknown Role";
        if (role.toLowerCase() === "super") return;

        const logEntry = {
          id: doc.id,
          timestamp: data.timestamp || null,
          performedBy: data.performedBy || "Unknown User",
          activity: data.activity || "No activity description",
          role: data.role || "Unknown Role",
        };
        temp.push(logEntry);
      });
      setLogs(temp);
      setLogsLoading(false);
    });

    const unsubPasswordRequests = onSnapshot(
      query(collection(db, "passwordRequestReset"), where("status", "==", "pending")),
      (snap) => {
        const tempRequests = [];
        snap.forEach((doc) => {
          const data = doc.data();
          const request = {
            id: doc.id,
            user: data.user,
            status: data.status,
            requestedAt: data.requestedAt,
          };
          tempRequests.push(request);
        });
        setPasswordRequests(tempRequests);
        setPendingRequests(tempRequests.length);
        setRequestsLoading(false);
      }
    );

    const unsubActiveUsers = onSnapshot(collection(db, "users"), (snap) => {
      const activeUsersCount = snap.docs.filter((doc) => doc.data().role !== "Super").length;
      setActiveUsers(activeUsersCount);
      setLoading(false);
    });

    return () => {
      unsubLogs();
      unsubPasswordRequests();
      unsubActiveUsers();
    };
  }, []);

  // Custom styles for DataTable
  const customStyles = {
    header: {
      style: {
        backgroundColor: '#f8fafc',
        borderBottom: '2px solid #e2e8f0',
        minHeight: '56px',
        paddingLeft: '16px',
        paddingRight: '16px',
      },
    },
    headRow: {
      style: {
        backgroundColor: '#f1f5f9',
        borderBottom: '1px solid #cbd5e1',
        minHeight: '48px',
        fontWeight: '600',
        fontSize: '14px',
        color: '#475569',
      },
    },
    headCells: {
      style: {
        backgroundColor: '#f1f5f9',
        color: '#475569',
        fontSize: '14px',
        fontWeight: '600',
        padding: '12px 16px',
        '&:hover': {
          backgroundColor: '#e2e8f0',
        },
      },
    },
    rows: {
      style: {
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #f1f5f9',
        minHeight: '56px',
        '&:hover': {
          backgroundColor: '#f8fafc',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          transform: 'translateY(-1px)',
          transition: 'all 0.2s ease',
        },
      },
      stripedStyle: {
        backgroundColor: '#ffffff',
      },
    },
    cells: {
      style: {
        backgroundColor: '#ffffff',
        padding: '12px 16px',
        fontSize: '13px',
        color: '#334155',
      },
    },
    pagination: {
      style: {
        backgroundColor: '#ffffff',
        borderTop: '1px solid #e2e8f0',
        minHeight: '56px',
        fontSize: '13px',
        color: '#64748b',
      },
      pageButtonsStyle: {
        backgroundColor: 'transparent',
        border: '1px solid #e2e8f0',
        borderRadius: '6px',
        color: '#64748b',
        fontSize: '13px',
        height: '32px',
        margin: '0 2px',
        padding: '0 8px',
        '&:hover:not(:disabled)': {
          backgroundColor: '#f1f5f9',
          color: primaryColor,
        },
        '&:focus': {
          outline: 'none',
          boxShadow: `0 0 0 2px ${primaryColor}33`,
        },
      },
    },
    table: {
      style: {
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      },
    },
  };

  const columns = [
    {
      name: "Timestamp",
      selector: (log) => formatTimestamp(log.timestamp).relativeTime,
      sortable: true,
      width: '250px',
      cell: (log) => (
        <div className="py-2">
          <div className="font-semibold text-gray-800 text-sm leading-tight">
            {formatTimestamp(log.timestamp).relativeTime}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {formatTimestamp(log.timestamp).fullDate}
          </div>
        </div>
      ),
    },
    {
      name: "User",
      selector: (log) => log.performedBy || "Unknown User",
      sortable: true,
      width: '250px',
      cell: (log) => (
        <div className="py-2">
          <div className="font-semibold text-gray-800 text-sm">
            {log.performedBy || "Unknown User"}
          </div>
        </div>
      ),
    },
    {
      name: "Activity",
      selector: (log) => log.activity || "No activity description",
      sortable: true,
      cell: (log) => (
        <div className="py-2 pr-4">
          <div 
            className="text-gray-700 text-sm leading-relaxed"
            title={log.activity}
            style={{ 
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {log.activity}
          </div>
        </div>
      ),
    },
  ];

  const requestColumns = [
    {
      name: "User",
      selector: (row) => row.user,
      sortable: true,
      width: '200px',
      cell: (row) => (
        <div className="py-2">
          <div className="font-semibold text-gray-800 text-sm">
            {row.user}
          </div>
        </div>
      ),
    },
    {
      name: "Requested At",
      selector: (row) => formatTimestamp(row.requestedAt).relativeTime,
      sortable: true,
      cell: (row) => (
        <div className="py-2">
          <div className="text-gray-700 text-sm">
            {formatTimestamp(row.requestedAt).relativeTime}
          </div>
        </div>
      ),
    },
  ];

  const filteredLogs = logs.filter(
    (log) =>
      log.activity.toLowerCase().includes(search.toLowerCase()) &&
      (!startDate || new Date(log.timestamp.seconds * 1000) >= new Date(startDate)) &&
      (!endDate || new Date(log.timestamp.seconds * 1000) <= new Date(endDate))
  );

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
                  <img src={img} alt={label} className="w-5 h-5 mr-3" draggable="false" />
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
      <main className="flex-1 p-10 space-y-6">
        <h2 className="text-2xl font-semibold text-gray-800">Dashboard Overview</h2>

        {/* Top Info Cards */}
        <div className="grid grid-cols-3 gap-6">
          <div className="p-4 bg-white rounded-lg shadow-md flex items-center">
            <FaLaptop className="text-green-600 text-2xl mr-4" />
            <div>
              <div className="text-lg font-semibold text-green-700">System Status</div>
              <div className="text-sm text-gray-700">Operational</div>
            </div>
          </div>
          <div className="p-4 bg-white rounded-lg shadow-md flex items-center">
            <FaUsersCog className="text-blue-600 text-2xl mr-4" />
            <div>
              <div className="text-lg font-semibold text-blue-700">Active Users</div>
              <div className="text-sm text-gray-700">
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                ) : (
                  activeUsers
                )}
              </div>
            </div>
          </div>
          <div className="p-4 bg-white rounded-lg shadow-md flex items-center">
            <FaHistory className="text-yellow-600 text-2xl mr-4" />
            <div>
              <div className="text-lg font-semibold text-yellow-700">Pending Requests</div>
              <div className="text-sm text-gray-700">
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                ) : (
                  pendingRequests
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Activity Log + Password Requests Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Activity Log */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 pb-4 border-b border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Activity Log</h3>
                <Link
                  to="/activityLogSuper"
                  className="text-blue-600 hover:underline text-sm font-medium transition-colors duration-200"
                  style={{ color: primaryColor }}
                  onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                  onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                >
                  View More
                </Link>
              </div>
              <div className="flex gap-3 mb-4">
                <input
                  type="date"
                  className="rounded-lg border border-gray-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <input
                  type="date"
                  className="rounded-lg border border-gray-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
                <input
                  type="text"
                  className="rounded-lg border border-gray-300 p-2 flex-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Search logs..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="h-96">
              {logsLoading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="flex flex-col items-center">
                    <div 
                      className="animate-spin rounded-full h-12 w-12 border-b-2 mb-4"
                      style={{ borderColor: primaryColor }}
                    ></div>
                    <p className="text-gray-500 text-sm">Loading activity logs...</p>
                  </div>
                </div>
              ) : (
                <DataTable
                  columns={columns}
                  data={filteredLogs}
                  customStyles={customStyles}
                  highlightOnHover
                  dense
                  pagination
                  paginationPerPage={5}
                  paginationRowsPerPageOptions={[5, 10, 15]}
                  noDataComponent={
                    <div className="py-8 text-center text-gray-500">
                      <div className="text-lg mb-2">No activity logs found</div>
                      <div className="text-sm">Try adjusting your search criteria</div>
                    </div>
                  }
                />
              )}
            </div>
          </div>

          {/* Password Reset Requests */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 pb-4 border-b border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800">
                  Pending Password Reset Requests
                </h3>
                <Link
                  to="/PasswordSuper"
                  className="text-blue-600 hover:underline text-sm font-medium transition-colors duration-200"
                  style={{ color: primaryColor }}
                  onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                  onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                >
                  View More
                </Link>
              </div>
            </div>
            <div className="h-96">
              {requestsLoading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="flex flex-col items-center">
                    <div 
                      className="animate-spin rounded-full h-12 w-12 border-b-2 mb-4"
                      style={{ borderColor: primaryColor }}
                    ></div>
                    <p className="text-gray-500 text-sm">Loading password requests...</p>
                  </div>
                </div>
              ) : (
                <DataTable
                  columns={requestColumns}
                  data={passwordRequests}
                  customStyles={customStyles}
                  highlightOnHover
                  dense
                  pagination
                  paginationPerPage={5}
                  paginationRowsPerPageOptions={[5, 10, 15]}
                  noDataComponent={
                    <div className="py-8 text-center text-gray-500">
                      <div className="text-lg mb-2">No pending requests</div>
                      <div className="text-sm">All password reset requests have been processed</div>
                    </div>
                  }
                />
              )}
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