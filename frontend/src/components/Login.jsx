import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm]   = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await axios.post(`${API}/login`, form);
      // Store JWT + user in localStorage
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user",  JSON.stringify(res.data.user));
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Check credentials.");
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
          <h1>Welcome<br /><em>back.</em></h1>
          <p>Check the latest lost &amp; found reports, manage your submissions, and help reunite items.</p>
        </div>
        <p className="auth-foot">© 2025 CampusFind</p>
      </div>

      <div className="auth-right">
        <div className="auth-box">
          <span className="box-eyebrow">Existing user</span>
          <h2>Sign In</h2>

          {error && <div className="alert alert-err">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="field">
              <label>Email Address</label>
              <input type="email" name="email" placeholder="you@college.edu"
                value={form.email} onChange={handleChange} required />
            </div>
            <div className="field">
              <label>Password</label>
              <input type="password" name="password" placeholder="Your password"
                value={form.password} onChange={handleChange} required />
            </div>
            <button type="submit" className="btn-main" disabled={loading}>
              {loading ? <span className="spinner" /> : "Sign In →"}
            </button>
          </form>
          <p className="switch-txt">New here? <Link to="/register">Create account</Link></p>
        </div>
      </div>
    </div>
  );
}