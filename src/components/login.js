import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../firebase";

// import images from src/images
import MainLogo from "../images/MainLogo.png";
import SideLogo from "../images/SideLogo.png";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userEmail = userCredential.user.email;

      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", userEmail));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const role = (userDoc.data().role || "").toLowerCase();

        switch (role) {
          case "admin":
            navigate("/dashboardAdmin");
            break;
          case "cashier":
            navigate("/dashboardCashier");
            break;
          case "super":
            navigate("/dashboardSuper");
            break;
          default:
            setError("Unknown role. Please contact the administrator.");
        }
      } else {
        setError("No user role found in the database.");
      }
    } catch (err) {
      if (err.code === "auth/invalid-credential") {
        setError("Incorrect email or password, please try again.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many failed login attempts. Please try again later.");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200">
      {loading && (
        <div className="fixed inset-0 bg-white bg-opacity-95 flex flex-col items-center justify-center z-50 animate-fadeIn">
          <div className="dual-spinner mb-4" />
          <p className="text-lg font-medium text-blue-900 animate-pulse">Logging in...</p>
        </div>
      )}

      {/* Left: Login Form */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center px-6 py-8 animate-slideIn">
        <div className="flex flex-col items-center space-y-3">
          <img src={MainLogo} className="w-72 animate-fadeInUp" alt="Logo" />
          <h2 className="text-4xl font-bold tracking-tight animate-fadeInUp delay-100">Welcome Back!</h2>
          <p className="text-gray-600 animate-fadeInUp delay-200">
            Please enter your login details below
          </p>
        </div>

        {error && (
          <div className="w-full max-w-lg mt-4 px-4 py-3 rounded-lg text-sm font-medium bg-red-100 border border-red-300 text-red-700 animate-shake">
            {error}
          </div>
        )}

        <form className="w-full max-w-lg mt-6 space-y-5" onSubmit={handleLogin}>
          <div className="animate-fadeInUp delay-300">
            <label className="block text-base font-semibold text-gray-700">Email</label>
            <input
              type="email"
              className="mt-1 w-full p-4 text-base border border-gray-300 rounded-lg shadow-md focus:outline-none focus:ring-4 focus:ring-indigo-300 transition-all duration-300"
              placeholder="Enter email..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
            />
          </div>

          <div className="animate-fadeInUp delay-400">
            <label className="block text-base font-semibold text-gray-700">Password</label>
            <input
              type="password"
              className="mt-1 w-full p-4 text-base border border-gray-300 rounded-lg shadow-md focus:outline-none focus:ring-4 focus:ring-indigo-300 transition-all duration-300"
              placeholder="Enter password..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            <div className="text-sm text-right mt-1 text-gray-500 hover:text-indigo-600 transition-all duration-200">
              <a href="#forgot">Forgot Password?</a>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold py-3 rounded-lg shadow-lg hover:scale-105 hover:shadow-xl transform transition duration-300 text-lg animate-fadeInUp delay-500 disabled:opacity-60 disabled:hover:scale-100"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>

      {/* Right: Image Section */}
      <div className="hidden md:block md:w-1/2 relative animate-slideInRight">
        <div className="w-full h-full rounded-l-3xl shadow-2xl overflow-hidden relative neon-box">
          <img
            src={SideLogo}
            className="w-full h-full object-cover object-center rounded-l-3xl scale-105 hover:scale-110 transition-transform duration-[6000ms] ease-in-out"
            alt="Background"
          />
          <div className="absolute inset-0 rounded-l-3xl bg-gradient-to-b from-red-700 via-indigo-800 to-blue-900 opacity-70 backdrop-brightness-90"></div>
        </div>
      </div>

      <style>{`
        @keyframes float { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-20px) rotate(180deg); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(-50px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes slideInRight { from { opacity: 0; transform: translateX(50px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 50% { transform: translateX(5px); } 75% { transform: translateX(-5px); } }
        .animate-fadeIn { animation: fadeIn 0.5s ease forwards; }
        .animate-fadeInUp { animation: fadeInUp 0.6s ease forwards; }
        .animate-slideIn { animation: slideIn 0.6s ease forwards; }
        .animate-slideInRight { animation: slideInRight 0.6s ease forwards; }
        .animate-shake { animation: shake 0.3s ease; }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        .delay-400 { animation-delay: 0.4s; }
        .delay-500 { animation-delay: 0.5s; }
        .dual-spinner { width: 48px; height: 48px; border: 4px solid #1e3a8a; border-top: 4px solid transparent; border-radius: 50%; animation: spin 1s linear infinite; position: relative; }
        .dual-spinner::after { content: ""; position: absolute; top: 8px; left: 8px; right: 8px; bottom: 8px; border: 3px solid #1e3a8a; border-bottom-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite reverse; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default Login;
