import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm]       = useState({ name: "", email: "", password: "" });
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess(""); setLoading(true);
    try {
      await axios.post(`${API}/register`, form);
      setSuccess("Account created! Redirecting to login…");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="brand">
          <span className="brand-mark">◎</span>
          <span>CampusFind</span>
        </div>
        <div className="auth-pitch">
          <h1>Lost something?<br />Found something?<br /><em>We connect.</em></h1>
          <p>The official lost &amp; found board for your campus community. Report items, reunite belongings.</p>
          <div className="pill-row">
            <span className="pill lost-pill">🔴 Lost Items</span>
            <span className="pill found-pill">🟢 Found Items</span>
          </div>
        </div>
        <p className="auth-foot">© 2025 CampusFind</p>
      </div>

      <div className="auth-right">
        <div className="auth-box">
          <span className="box-eyebrow">New account</span>
          <h2>Register</h2>

          {error   && <div className="alert alert-err">{error}</div>}
          {success && <div className="alert alert-ok">{success}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="field">
              <label>Full Name</label>
              <input type="text" name="name" placeholder="e.g. Diya Maheshwari"
                value={form.name} onChange={handleChange} required />
            </div>
            <div className="field">
              <label>Email Address</label>
              <input type="email" name="email" placeholder="you@college.edu"
                value={form.email} onChange={handleChange} required />
            </div>
            <div className="field">
              <label>Password</label>
              <input type="password" name="password" placeholder="Min. 6 characters"
                value={form.password} onChange={handleChange} minLength={6} required />
            </div>
            <button type="submit" className="btn-main" disabled={loading}>
              {loading ? <span className="spinner" /> : "Create Account →"}
            </button>
          </form>
          <p className="switch-txt">Already registered? <Link to="/login">Sign in</Link></p>
        </div>
      </div>
    </div>
  );
}