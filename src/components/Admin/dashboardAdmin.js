import React, { useState, useEffect, useCallback } from "react";
import { getAuth, signOut } from "firebase/auth";
import { Outlet, Link, useLocation } from "react-router-dom";
import { collection, query, getDocs, orderBy } from "firebase/firestore";
import { db } from "../../firebase"; // Adjust path as needed

// ✅ Import images from src/images (case-sensitive)
import LogoM from "../../images/logoM.png";
import IconDashboard from "../../images/Dashboard Blue.png";
import IconUnit from "../../images/Monitoring White.png";
import IconUser from "../../images/Admin.png";
import IconDriver from "../../images/Driver White.png";
import IconVehicle from "../../images/Vehicle White.png";
import IconReport from "../../images/Report.png";

const auth = getAuth();

// Dashboard Analytics Component
const DashboardAnalytics = () => {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [stats, setStats] = useState({
    totalFare: 0,
    totalTickets: 0,
    cashPayments: 0,
    cardPayments: 0,
    cashAmount: 0,
    cardAmount: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const transactionsPerPage = 10;

  const primaryColor = "#364C6E";
  const secondaryColor = "#405a88";

  // Fetch transactions from Firebase
  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const transactionsRef = collection(db, "transactions");
      const q = query(transactionsRef, orderBy("timestamp", "desc"));
      const querySnapshot = await getDocs(q);

      const transactionData = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        transactionData.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp),
        });
      });

      setTransactions(transactionData);
      setFilteredTransactions(transactionData);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  }, []); // Only fetch data once

  // Filter transactions by date range
  const filterTransactionsByDate = useCallback(() => {
    if (!startDate && !endDate) {
      setFilteredTransactions(transactions);
      return;
    }

    const filtered = transactions.filter((transaction) => {
      const transactionDate = new Date(transaction.timestamp);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      if (end) {
        end.setHours(23, 59, 59, 999);
      }

      if (start && end) {
        return transactionDate >= start && transactionDate <= end;
      } else if (start) {
        return transactionDate >= start;
      } else if (end) {
        return transactionDate <= end;
      }
      return true;
    });

    setFilteredTransactions(filtered);
  }, [startDate, endDate, transactions]);

  // Calculate statistics, excluding voided transactions from fare calculations but including them in total tickets
  const calculateStats = useCallback(() => {
    const newStats = {
      totalFare: 0,
      totalTickets: 0,
      cashPayments: 0,
      cardPayments: 0,
      cashAmount: 0,
      cardAmount: 0,
      voidedTickets: 0,
    };

    filteredTransactions.forEach((transaction) => {
      const fare = parseFloat(transaction.farePrice) || 0;

      // Always count the transaction as part of total tickets
      if (transaction.isVoided) {
        newStats.voidedTickets += 1;
        return;
      }

      // If it's not voided, include its fare in total fare
      newStats.totalTickets += 1;
      newStats.totalFare += fare;
      // Count cash and card payments only for valid (non-voided) transactions
      if (transaction.paymentMethod === "Cash") {
        newStats.cashPayments += 1;
        newStats.cashAmount += fare;
      } else if (transaction.paymentMethod === "Card") {
        newStats.cardPayments += 1;
        newStats.cardAmount += fare;
      }
    });

    setStats(newStats);
  }, [filteredTransactions]);

  // Reset filters
  const resetFilters = () => {
    setStartDate("");
    setEndDate("");
    setFilteredTransactions(transactions);
  };

  const handleNextPage = () => {
    if (currentPage * transactionsPerPage < filteredTransactions.length) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    filterTransactionsByDate();
  }, [startDate, endDate, transactions, filterTransactionsByDate]);

  useEffect(() => {
    calculateStats();
  }, [filteredTransactions, calculateStats]);

  const currentTransactions = filteredTransactions.slice((currentPage - 1) * transactionsPerPage, currentPage * transactionsPerPage);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2" style={{ borderColor: primaryColor }}></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Dashboard Overview</h2>

        {/* Date Filters */}
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={resetFilters}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition duration-200"
          >
            Reset Filters
          </button>
          <button
            onClick={fetchTransactions}
            className="px-4 py-2 text-white rounded-md hover:opacity-90 transition duration-200"
            style={{ backgroundColor: primaryColor }}
          >
            Refresh Data
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Fare Collection */}
        <div className="bg-white rounded-lg shadow-md p-6 flex items-center justify-between">
          <div className="flex items-center justify-center w-12 h-12 rounded-full mr-4" style={{ backgroundColor: `${primaryColor}20` }}>
            <svg className="w-6 h-6" style={{ color: primaryColor }} fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Total Fare Collection</p>
            <p className="text-2xl font-bold text-gray-900">₱{stats.totalFare.toFixed(2)}</p>
          </div>
        </div>

        {/* Total Tickets */}
        <div className="bg-white rounded-lg shadow-md p-6 flex items-center justify-between">
          <div className="p-3 rounded-full mr-4" style={{ backgroundColor: `${secondaryColor}20` }}>
            <svg className="w-6 h-6" style={{ color: secondaryColor }} fill="currentColor" viewBox="0 0 20 20">
              <path d="M7 12l2 1 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Total Tickets</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalTickets.toLocaleString()}</p>
          </div>
        </div>

        {/* Cash Payments */}
        <div className="bg-white rounded-lg shadow-md p-6 flex items-center justify-between">
          <div className="p-3 rounded-full bg-green-100 mr-4">
            <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Cash Payments</p>
            <p className="text-2xl font-bold text-gray-900">₱{stats.cashAmount.toFixed(2)}</p>
            <p className="text-sm text-gray-500">({stats.cashPayments} transactions)</p>
          </div>
        </div>

        {/* Card Payments */}
        <div className="bg-white rounded-lg shadow-md p-6 flex items-center justify-between">
          <div className="p-3 rounded-full bg-blue-100 mr-4">
            <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Card Payments</p>
            <p className="text-2xl font-bold text-gray-900">₱{stats.cardAmount.toFixed(2)}</p>
            <p className="text-sm text-gray-500">({stats.cardPayments} transactions)</p>
          </div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Transactions</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fare Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Method</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pick-Up</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Drop-Off</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentTransactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(transaction.timestamp).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₱{parseFloat(transaction.farePrice).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={` ml-3 px-7 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      transaction.paymentMethod === 'Cash' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {transaction.paymentMethod}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.pickUp || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.dropOff || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.driverName || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.invoiceNum || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      transaction.isVoided ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {transaction.isVoided ? 'Voided' : 'Successful'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between items-center mt-4">
  <p className="text-sm text-gray-500">
    Showing {currentTransactions.length} of {filteredTransactions.length} transactions
  </p>
  <div className="flex items-center space-x-2">
    {/* Previous Button */}
    <button
      onClick={handlePreviousPage}
      disabled={currentPage === 1}
      className="px-3 py-2 border border-gray-300 rounded-full text-gray-700 disabled:opacity-50 hover:bg-gray-200 transition"
    >
      {/* Left Arrow Icon */}
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 5l-7 7 7 7" />
      </svg>
    </button>

    {/* Next Button */}
    <button
      onClick={handleNextPage}
      disabled={currentPage * transactionsPerPage >= filteredTransactions.length}
      className="px-3 py-2 border border-gray-300 rounded-full text-gray-700 disabled:opacity-50 hover:bg-gray-200 transition"
    >
      {/* Right Arrow Icon */}
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 5l7 7-7 7" />
      </svg>
    </button>
  </div>
</div>
      </div>
    </div>
  );
};

export default function DashboardAdmin() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false); // State for dropdown
  const location = useLocation();
  const activeLink = location.pathname;

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

  const isMainDashboard = activeLink === "/dashboardAdmin";

  return (
    <div className="flex bg-gray-100 min-h-screen">
      {/* Sidebar */}
      <aside
        className="w-64 min-h-screen text-white flex flex-col justify-between fixed top-0 left-0"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="flex flex-col items-center py-6">
          <img src={LogoM} alt="VODACTCO Logo" className="w-40 mb-8" />
          <nav className="w-full px-4 space-y-2 text-sm font-medium">
            {navLinks.map(({ to, img, label, isDropdown, onClick }) => {
              const isActive = activeLink === to;
              return (
                <div key={label}>
                  {/* Regular link */}
                  {!isDropdown ? (
                    <Link
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
                        style={isActive && label === "Dashboard" ? { filter: "none", boxShadow: "none" } : {}}
                        draggable="false"
                      />
                      <span>{label}</span>
                    </Link>
                  ) : (
                    <div>
                      <button
                        onClick={onClick}
                        className={`flex items-center px-4 py-2 rounded-lg w-full transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-md ${
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
      <main className="flex-1 p-6 bg-gray-50 overflow-y-auto ml-64">
        {/* Show Dashboard analytics only on main dashboard route, otherwise show Outlet */}
        {isMainDashboard ? (
          <DashboardAnalytics />
        ) : (
          <>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p>Welcome, Admin! Here's your panel.</p>
            <Outlet />
          </>
        )}
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

