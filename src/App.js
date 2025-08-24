// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Login from "./components/login";
import DashboardAdmin from "./components/Admin/dashboardAdmin";
import DashboardCashier from "./components/Cashier/dashboardCashier";
import DashboardSuper from "./components/Super Admin/dashboardSuper";
import ActivityLogSuper from "./components/Super Admin/activityLogSuper";
import AdminManagement from "./components/Super Admin/AdminManagementSuper";
import RouteManagement from "./components/Super Admin/RouteManagementSuper";
import QuotaManagement from "./components/Super Admin/QuotaManagementSuper";
import UserAccess from "./components/Super Admin/UACSuper";
import PassRest from "./components/Super Admin/PasswordSuper";
import Maintenance from "./components/Super Admin/MaintenanceSuper";

import PrivateRoute from "./privateRoute";

// (Optional) Simple Forbidden page if you don't have one yet
const Forbidden = () => (
  <div style={{ padding: 24 }}>
    <h1>403 — Forbidden</h1>
    <p>You don’t have permission to view this page.</p>
  </div>
);

function App() {
  return (
    <Router>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />

        {/* Admin-only */}
        <Route
          path="/dashboardAdmin"
          element={<PrivateRoute element={DashboardAdmin} allowedRoles={["Admin"]} />}
        />

        {/* Cashier-only */}
        <Route
          path="/dashboardCashier"
          element={<PrivateRoute element={DashboardCashier} allowedRoles={["Cashier"]} />}
        />

        {/* Super-only (all these pages) */}
        <Route
          path="/dashboardSuper"
          element={<PrivateRoute element={DashboardSuper} allowedRoles={["Super"]} />}
        />
        <Route
          path="/activityLogSuper"
          element={<PrivateRoute element={ActivityLogSuper} allowedRoles={["Super"]} />}
        />
        <Route
          path="/AdminManagementSuper"
          element={<PrivateRoute element={AdminManagement} allowedRoles={["Super"]} />}
        />
        <Route
          path="/RouteManagementSuper"
          element={<PrivateRoute element={RouteManagement} allowedRoles={["Super"]} />}
        />
        <Route
          path="/QuotaManagementSuper"
          element={<PrivateRoute element={QuotaManagement} allowedRoles={["Super"]} />}
        />
        <Route
          path="/UACSuper"
          element={<PrivateRoute element={UserAccess} allowedRoles={["Super"]} />}
        />
        <Route
          path="/PasswordSuper"
          element={<PrivateRoute element={PassRest} allowedRoles={["Super"]} />}
        />
        <Route
          path="/MaintenanceSuper"
          element={<PrivateRoute element={Maintenance} allowedRoles={["Super"]} />}
        />

        {/* Forbidden + catch-all */}
        <Route path="/forbidden" element={<Forbidden />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
