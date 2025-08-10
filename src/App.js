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
import Maintenance from "./components/Super Admin/MaintenanceSuper";  // ✅ Import Activity Log page
import PrivateRoute from "./privateRoute"; // Import the PrivateRoute component

function App() {
  return (
    <Router>
      <Routes>
        {/* Public route */}
        <Route path="/login" element={<Login />} />

        {/* Protected routes */}
        <Route path="/dashboardAdmin" element={<PrivateRoute element={DashboardAdmin} />} />
        <Route path="/dashboardCashier" element={<PrivateRoute element={DashboardCashier} />} />
        <Route path="/dashboardSuper" element={<PrivateRoute element={DashboardSuper} />} />
        <Route path="/activityLogSuper" element={<PrivateRoute element={ActivityLogSuper} />} /> {/* ✅ New route */}
        <Route path="/AdminManagementSuper" element={<PrivateRoute element={AdminManagement} />} />
        <Route path="/RouteManagementSuper" element={<PrivateRoute element={RouteManagement} />} />
        <Route path="/QuotaManagementSuper" element={<PrivateRoute element={QuotaManagement} />} />
        <Route path="/UACSuper" element={<PrivateRoute element={UserAccess} />} />
        <Route path="/PasswordSuper" element={<PrivateRoute element={PassRest} />} />
        <Route path="/MaintenanceSuper" element={<PrivateRoute element={Maintenance} />} />
        {/* Optional: Redirect any unknown routes to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
