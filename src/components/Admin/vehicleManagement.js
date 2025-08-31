import React, { useEffect, useMemo, useState } from "react";
import { getAuth, signOut } from "firebase/auth";
import { Outlet, Link, useLocation } from "react-router-dom";
import DataTable from "react-data-table-component";
import { FaEdit } from "react-icons/fa";

import LogoM from "../../images/logoM.png";
import IconDashboard from "../../images/Dashboard White.png";
import IconUnit from "../../images/Monitoring White.png";
import IconUser from "../../images/Admin.png";
import IconDriver from "../../images/Driver White.png";
import IconVehicle from "../../images/Vehicle Blue.png";
import IconReport from "../../images/Report.png";

import { db } from "../../firebase";
import { collection, onSnapshot, doc, setDoc, addDoc, query, orderBy } from "firebase/firestore";

const auth = getAuth();

export default function VehicleManagement() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isReportOpen, setIsReportOpen] = useState(false);
  const location = useLocation();

  const primaryColor = "#364C6E";
  const hoverBg = "#405a88"; // Unused, but we'll apply it for hover effects
  const signOutBg = "#ffffff";
  const signOutBgHover = "#f1f1f1"; // Unused, but we'll apply it in the button

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      window.location.href = "/";
    } catch (error) {
      console.error("Error signing out:", error);
      alert("Error signing out. Please try again.");
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

  const isVehiclePage = location.pathname === "/vehicleManagement";

  // ---------- Vehicle state ----------
  const [vehicles, setVehicles] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [routesLoading, setRoutesLoading] = useState(true);
  const [err, setErr] = useState(null);

  const [search, setSearch] = useState("");
  const [filterBy, setFilterBy] = useState("");
  const [routeFilter, setRouteFilter] = useState("");

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [edit, setEdit] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const [form, setForm] = useState({
    vehicleID: "",
    unit: "",
    serialNo: "",
    fuel: "",
    routeId: "",
    status: "Active",
  });
  const [errors, setErrors] = useState({});

  // Load vehicles from Firestore with proper error handling
  useEffect(() => {
    if (!isVehiclePage) return;
    const vehiclesQuery = query(collection(db, "vehicle"));
    const unsub = onSnapshot(vehiclesQuery, (snap) => {
      try {
        const temp = [];
        snap.forEach((d) => {
          const data = d.data();
          if (data) {
            temp.push({
              id: d.id,
              vehicleID: data.vehicleID || "",
              unit: data.unit || "",
              serialNo: data.serialNo || "",
              fuel: data.fuel || "",
              routeId: data.routeId || "",
              status: data.status || "Active",
            });
          }
        });
        setVehicles(temp);
        setLoading(false);
        setErr(null);
      } catch (error) {
        console.error("Error processing vehicles:", error);
        setErr("Error processing vehicles data");
        setLoading(false);
      }
    }, (error) => {
      console.error("Error loading vehicles:", error);
      setErr("Failed to load vehicles.");
      setLoading(false);
    });
    return () => unsub();
  }, [isVehiclePage]);

  // Load routes from Firestore with proper error handling
  useEffect(() => {
    if (!isVehiclePage) return;
    const routesQuery = query(collection(db, "routes"), orderBy("Route", "asc"));
    const unsub = onSnapshot(routesQuery, (snap) => {
      try {
        const temp = [];
        snap.forEach((d) => {
          const data = d.data();
          if (data && data.Route) {
            temp.push({
              id: d.id,
              route: data.Route,
            });
          }
        });
        // Remove duplicate routes
        const uniqueRoutes = Array.from(new Set(temp.map(route => route.route)))
          .map(routeName => temp.find(route => route.route === routeName));
        setRoutes(uniqueRoutes);
        setRoutesLoading(false);
      } catch (error) {
        console.error("Error processing routes:", error);
      }
    }, (error) => {
      console.error("Error loading routes:", error);
    });
    return () => unsub();
  }, [isVehiclePage]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return vehicles.filter((vehicle) => {
      const route = routes.find(r => r.id === vehicle.routeId);
      const routeName = route ? route.route : "";
      const searchText = `${vehicle.vehicleID} ${vehicle.unit} ${vehicle.serialNo} ${vehicle.fuel} ${routeName} ${vehicle.status}`.toLowerCase();
      const matchesSearch = !q || searchText.includes(q);
      const matchesFilter = !filterBy || vehicle.status === filterBy;
      const matchesRouteFilter = !routeFilter || routeName === routeFilter;

      return matchesSearch && matchesFilter && matchesRouteFilter;
    });
  }, [vehicles, routes, search, filterBy, routeFilter]);

  // Add a computed row number for display
  const filteredWithRowNumber = useMemo(
    () => filtered.map((r, i) => ({ ...r, _row: i + 1 })),
    [filtered]
  );

  const StatusBadge = ({ value }) => {
    const isActive = (value || "").toLowerCase() === "active";
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${isActive ? "bg-green-100 text-green-700 border border-green-200" : "bg-gray-100 text-gray-700 border border-gray-200"}`}
      >
        <span
          className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${isActive ? "bg-green-500" : "bg-gray-400"}`}
        />
        {isActive ? "Active" : value || "Inactive"}
      </span>
    );
  };

  const columns = [
    {
      name: "Vehicle ID",
      selector: (r) => r.vehicleID,
      sortable: true,
      grow: 1,
      cell: (r) => (
        <div className="truncate" title={r.vehicleID}>
          {r.vehicleID}
        </div>
      ),
    },
    {
      name: "Unit",
      selector: (r) => r.unit,
      sortable: true,
      grow: 1,
      cell: (r) => (
        <div className="truncate" title={r.unit}>
          {r.unit}
        </div>
      ),
    },
    {
      name: "Serial No",
      selector: (r) => r.serialNo,
      sortable: true,
      grow: 1,
      cell: (r) => (
        <div className="truncate" title={r.serialNo}>
          {r.serialNo}
        </div>
      ),
    },
    {
      name: "Fuel",
      selector: (r) => r.fuel,
      sortable: true,
      center: true,
      grow: 1,
      cell: (r) => (
        <div className="truncate" title={r.fuel}>
          {r.fuel}
        </div>
      ),
    },
    {
      name: "Route",
      selector: (r) => {
        const route = routes.find(route => route.id === r.routeId);
        return route ? route.route : "";
      },
      sortable: true,
      grow: 1,
      cell: (r) => {
        const route = routes.find(route => route.id === r.routeId);
        const routeName = route ? route.route : "No Route";
        return (
          <div className="truncate" title={routeName}>
            {routeName}
          </div>
        );
      },
    },
    {
      name: "Status",
      selector: (r) => r.status,
      sortable: true,
      center: true,
      grow: 1,
      cell: (r) => <StatusBadge value={r.status} />,
    },
    {
      name: "Action",
      button: true,
      center: true,
      width: "120px",
      cell: (row) => (
        <button
          onClick={() => {
            setViewing(row);
            setEdit({
              vehicleID: row.vehicleID,
              unit: row.unit,
              serialNo: row.serialNo,
              fuel: row.fuel,
              routeId: row.routeId,
              status: row.status,
            });
          }}
          title="Edit"
          className="inline-flex items-center justify-center h-9 px-3 rounded-full border border-gray-200 bg-white text-gray-700 hover:shadow-md transition text-sm font-semibold"
        >
          <FaEdit size={14} />
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

  const openAdd = () => {
    setIsAddOpen(true);
    setForm({
      vehicleID: "",
      unit: "",
      serialNo: "",
      fuel: "",
      routeId: "",
      status: "Active",
    });
    setErrors({});
  };

  const closeAdd = () => {
    setIsAddOpen(false);
    setErrors({});
  };

  const onForm = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) {
      const newErrors = { ...errors };
      delete newErrors[name];
      setErrors(newErrors);
    }
  };

  const saveVehicle = async () => {
    const validationErrors = {};
    if (!form.vehicleID.trim()) validationErrors.vehicleID = "Vehicle ID is required";
    if (!form.unit.trim()) validationErrors.unit = "Unit is required";
    if (!form.serialNo.trim()) validationErrors.serialNo = "Serial No is required";
    if (!form.fuel.trim()) validationErrors.fuel = "Fuel is required";
    if (!form.routeId) validationErrors.routeId = "Route is required";
    
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length) return;

    setSaving(true);
    try {
      await addDoc(collection(db, "vehicle"), {
        vehicleID: form.vehicleID.trim(),
        unit: form.unit.trim(),
        serialNo: form.serialNo.trim(),
        fuel: form.fuel.trim(),
        routeId: form.routeId,
        status: form.status,
        createdAt: new Date().toISOString(),
      });

      setToastMessage("New vehicle added successfully!");
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
      closeAdd();
    } catch (error) {
      console.error("Error saving vehicle:", error);
      if (error.code === 'permission-denied') {
        alert("Access denied. You don't have permission to add vehicles.");
      } else {
        alert("Failed to save vehicle. Please try again.");
      }
    } finally {
      setSaving(false);
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
                          >
                            Transaction Overview
                          </Link>
                          <Link
                            to="/report2"
                            className="block px-4 py-2 rounded-lg"
                          >
                            Quota Summary
                          </Link>
                          <Link
                            to="/report3"
                            className="block px-4 py-2 rounded-lg"
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
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10 mx-auto">
        {!isVehiclePage ? (
          <Outlet />
        ) : (
          <div className="mx-auto w-full max-w-[1900px]">
            <div
              className="bg-white border rounded-xl shadow-sm flex flex-col"
              style={{ minHeight: "calc(100vh - 112px)" }}
            >
              <div className="px-6 pt-6 pb-4 border-b flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-gray-800">Vehicle Management</h1>
                <div className="flex items-center gap-3">
                  <div className="relative flex items-center gap-2 rounded-lg border border-gray-300 bg-white shadow-lg hover:shadow-xl focus-within:ring-1 focus-within:ring-blue-300 px-3 py-2">
                    <select
                      className="bg-transparent pr-6 text-sm outline-none"
                      value={routeFilter}
                      onChange={(e) => setRouteFilter(e.target.value)}
                    >
                      <option value="">Filter by Route</option>
                      {routes.map((route) => (
                        <option key={route.id} value={route.route}>
                          {route.route}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search"
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

                  <button
                    onClick={openAdd}
                    className="flex items-center gap-2 px-9 py-2 rounded-lg text-white shadow-md hover:shadow-lg transition"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    <span className="font-semibold">Add Vehicle</span>
                  </button>
                </div>
              </div>

              <div className="px-6 py-4 flex-1">
                {(err) && (
                  <div className="mb-3 text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded">
                    {err}
                  </div>
                )}

                <DataTable
                  columns={columns}
                  data={filteredWithRowNumber}
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

      {/* Add Vehicle Modal */}
      {isAddOpen && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm p-4"
          onClick={closeAdd}
        >
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-[720px] max-w-[90%] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative flex items-center justify-between px-6 py-4 border-b bg-white/70 backdrop-blur">
              <div className="flex items-center gap-3">
                <div
                  className="h-9 w-9 rounded-full grid place-items-center text-white shadow"
                  style={{ backgroundColor: primaryColor }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">Add Vehicle</h2>
                  <p className="text-xs text-gray-500">Create a new vehicle record.</p>
                </div>
              </div>
              <button
                onClick={closeAdd}
                className="h-8 w-8 rounded-full grid place-items-center border border-gray-200 hover:bg-gray-50"
                title="Close"
              >
                <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12 19 6.4 17.6 5 12 10.6 6.4 5z" />
                </svg>
              </button>
            </div>

            <div className="p-12 grid ml-6 grid-cols-3 gap-x-5 gap-y-4">
              <div className="col-span-1">
                <label className="block text-sm text-gray-600 mb-1">Vehicle ID</label>
                <input
                  name="vehicleID"
                  className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-300 ${
                    errors.vehicleID ? "border-red-500" : "border-gray-200"
                  }`}
                  value={form.vehicleID}
                  onChange={onForm}
                />
                {errors.vehicleID && (
                  <p className="text-red-500 text-xs mt-1">{errors.vehicleID}</p>
                )}
              </div>

              <div className="col-span-1">
                <label className="block text-sm text-gray-600 mb-1">Unit</label>
                <input
                  name="unit"
                  className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-300 ${
                    errors.unit ? "border-red-500" : "border-gray-200"
                  }`}
                  value={form.unit}
                  onChange={onForm}
                />
                {errors.unit && (
                  <p className="text-red-500 text-xs mt-1">{errors.unit}</p>
                )}
              </div>

              <div className="col-span-1">
                <label className="block text-sm text-gray-600 mb-1">Serial No</label>
                <input
                  name="serialNo"
                  className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-300 ${
                    errors.serialNo ? "border-red-500" : "border-gray-200"
                  }`}
                  value={form.serialNo}
                  onChange={onForm}
                />
                {errors.serialNo && (
                  <p className="text-red-500 text-xs mt-1">{errors.serialNo}</p>
                )}
              </div>

              <div className="col-span-1">
                <label className="block text-sm text-gray-600 mb-1">Fuel</label>
                <input
                  name="fuel"
                  className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-300 ${
                    errors.fuel ? "border-red-500" : "border-gray-200"
                  }`}
                  value={form.fuel}
                  onChange={onForm}
                />
                {errors.fuel && (
                  <p className="text-red-500 text-xs mt-1">{errors.fuel}</p>
                )}
              </div>

              <div className="col-span-1">
                <label className="block text-sm text-gray-600 mb-1">Route</label>
                <select
                  name="routeId"
                  className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-300 ${
                    errors.routeId ? "border-red-500" : "border-gray-200"
                  }`}
                  value={form.routeId}
                  onChange={onForm}
                >
                  <option value="">Select Route</option>
                  {routes.map((route) => (
                    <option key={route.id} value={route.id}>
                      {route.route}
                    </option>
                  ))}
                </select>
                {errors.routeId && (
                  <p className="text-red-500 text-xs mt-1">{errors.routeId}</p>
                )}
              </div>

              <div className="col-span-1">
                <label className="block text-sm text-gray-600 mb-1">Status</label>
                <select
                  name="status"
                  className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-300 ${
                    errors.status ? "border-red-500" : "border-gray-200"
                  }`}
                  value={form.status}
                  onChange={onForm}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="px-6 py-4 border-t flex justify-end gap-4">
              <button
                onClick={closeAdd}
                className="px-6 py-2 rounded-md text-gray-700 border border-gray-300 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={saveVehicle}
                className={`px-6 py-2 rounded-md text-white ${
                  saving ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
                }`}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Vehicle"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
