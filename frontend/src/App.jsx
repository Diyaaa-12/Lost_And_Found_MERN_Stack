import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Register  from "./components/Register";
import Login     from "./components/Login";
import Dashboard from "./components/Dashboard";
import "./App.css";

// Guard: if no token → redirect to login
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/"          element={<Navigate to="/login" replace />} />
        <Route path="/register"  element={<Register />} />
        <Route path="/login"     element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}