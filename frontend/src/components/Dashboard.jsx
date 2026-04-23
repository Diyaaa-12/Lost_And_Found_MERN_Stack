import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const TYPE_FILTER = ["All", "Lost", "Found"];

const EMPTY_FORM = {
  itemName: "", description: "", type: "Lost",
  location: "", date: new Date().toISOString().split("T")[0],
  contactInfo: "", status: "Active",
};

export default function Dashboard() {
  const navigate = useNavigate();
  const user     = JSON.parse(localStorage.getItem("user") || "{}");
  const token    = localStorage.getItem("token");
  const headers  = { headers: { Authorization: `Bearer ${token}` } };

  // ── State ────────────────────────────────────────────────────────
  const [items,       setItems]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [typeFilter,  setTypeFilter]  = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMode,  setSearchMode]  = useState(false);

  // Modal state
  const [showAdd,   setShowAdd]   = useState(false);
  const [editItem,  setEditItem]  = useState(null);  // null = not editing
  const [viewItem,  setViewItem]  = useState(null);  // for detail view

  // Form state
  const [form,    setForm]    = useState(EMPTY_FORM);
  const [formMsg, setFormMsg] = useState({ text: "", type: "" });
  const [saving,  setSaving]  = useState(false);
  const [deleting,setDeleting]= useState(null);

  // Stats
  const lostCount  = items.filter(i => i.type === "Lost").length;
  const foundCount = items.filter(i => i.type === "Found").length;
  const myCount    = items.filter(i => i.userId === user.id).length;

  // ── Data Fetching ────────────────────────────────────────────────
  const fetchItems = useCallback(async (filter = "All") => {
    try {
      const url = filter === "All"
        ? `${API}/items`
        : `${API}/items?type=${filter}`;
      const res = await axios.get(url, headers);
      setItems(res.data.items);
    } catch (err) {
      if (err.response?.status === 401) handleLogout();
    }
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) { setSearchMode(false); fetchItems(typeFilter); return; }
    setLoading(true);
    try {
      const res = await axios.get(`${API}/items/search?name=${encodeURIComponent(searchQuery)}`, headers);
      setItems(res.data.items);
      setSearchMode(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery(""); setSearchMode(false); fetchItems(typeFilter);
  };

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    fetchItems(typeFilter).finally(() => setLoading(false));
  }, [typeFilter]);

  // ── Auth ─────────────────────────────────────────────────────────
  const handleLogout = () => { localStorage.clear(); navigate("/login"); };

  // ── Add / Edit Submit ────────────────────────────────────────────
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormMsg({ text: "", type: "" }); setSaving(true);
    try {
      if (editItem) {
        // UPDATE existing item — PUT /api/items/:id
        await axios.put(`${API}/items/${editItem._id}`, form, headers);
        setFormMsg({ text: "Item updated successfully!", type: "ok" });
      } else {
        // CREATE new item — POST /api/items
        await axios.post(`${API}/items`, form, headers);
        setFormMsg({ text: "Item reported successfully!", type: "ok" });
      }
      await fetchItems(typeFilter);
      setTimeout(() => {
        setShowAdd(false); setEditItem(null);
        setForm(EMPTY_FORM); setFormMsg({ text: "", type: "" });
      }, 900);
    } catch (err) {
      setFormMsg({ text: err.response?.data?.message || "Something went wrong", type: "err" });
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this item? This cannot be undone.")) return;
    setDeleting(id);
    try {
      await axios.delete(`${API}/items/${id}`, headers);
      await fetchItems(typeFilter);
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed");
    } finally {
      setDeleting(null);
    }
  };

  // ── Open Edit modal ──────────────────────────────────────────────
  const openEdit = (item) => {
    setForm({
      itemName:    item.itemName,
      description: item.description,
      type:        item.type,
      location:    item.location,
      date:        item.date?.split("T")[0] || new Date().toISOString().split("T")[0],
      contactInfo: item.contactInfo,
      status:      item.status,
    });
    setEditItem(item);
    setShowAdd(true);
  };

  const openAdd = () => {
    setForm(EMPTY_FORM); setEditItem(null);
    setFormMsg({ text: "", type: "" }); setShowAdd(true);
  };

  const closeModal = () => {
    setShowAdd(false); setEditItem(null);
    setForm(EMPTY_FORM); setFormMsg({ text: "", type: "" });
  };

  // ── Loading screen ───────────────────────────────────────────────
  if (loading) return (
    <div className="dash-loading">
      <div className="load-ring" />
      <p>Loading campus board…</p>
    </div>
  );

  const initials = user.name?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0,2) || "U";

  return (
    <div className="dash-root">

      {/* ══ NAVBAR ══════════════════════════════════════════════ */}
      <header className="dash-nav">
        <div className="nav-brand">
          <span className="brand-mark">◎</span> CampusFind
        </div>
        <div className="nav-right">
          <div className="nav-user">
            <div className="nav-avatar">{initials}</div>
            <span className="nav-name">{user.name}</span>
          </div>
          <button className="btn-logout" onClick={handleLogout}>Sign Out</button>
        </div>
      </header>

      <div className="dash-body">

        {/* ══ HERO STATS ══════════════════════════════════════════ */}
        <div className="hero-row">
          <div className="hero-text">
            <p className="hero-eyebrow">Campus Lost &amp; Found Board</p>
            <h1 className="hero-title">What are you looking for?</h1>
          </div>
          <button className="btn-report" onClick={openAdd}>
            + Report Item
          </button>
        </div>

        <div className="stats-row">
          <div className="stat-card stat-lost">
            <span className="stat-num">{lostCount}</span>
            <span className="stat-lbl">Lost Items</span>
          </div>
          <div className="stat-card stat-found">
            <span className="stat-num">{foundCount}</span>
            <span className="stat-lbl">Found Items</span>
          </div>
          <div className="stat-card stat-mine">
            <span className="stat-num">{myCount}</span>
            <span className="stat-lbl">My Reports</span>
          </div>
          <div className="stat-card stat-total">
            <span className="stat-num">{items.length}</span>
            <span className="stat-lbl">Total Listed</span>
          </div>
        </div>

        {/* ══ SEARCH + FILTER ══════════════════════════════════════ */}
        <div className="toolbar">
          <div className="search-wrap">
            <input
              className="search-input"
              type="text"
              placeholder="Search items, locations, descriptions…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
            />
            {searchMode
              ? <button className="btn-search-clear" onClick={clearSearch}>✕ Clear</button>
              : <button className="btn-search" onClick={handleSearch}>Search</button>
            }
          </div>

          <div className="type-tabs">
            {TYPE_FILTER.map(t => (
              <button
                key={t}
                className={`type-tab ${typeFilter === t && !searchMode ? "active" : ""} ${t === "Lost" ? "tab-lost" : t === "Found" ? "tab-found" : ""}`}
                onClick={() => { setTypeFilter(t); setSearchMode(false); setSearchQuery(""); }}
              >
                {t === "Lost" ? "🔴" : t === "Found" ? "🟢" : "◎"} {t}
              </button>
            ))}
          </div>
        </div>

        {searchMode && (
          <p className="search-result-label">
            Showing {items.length} result{items.length !== 1 ? "s" : ""} for "<strong>{searchQuery}</strong>"
          </p>
        )}

        {/* ══ ITEMS GRID ══════════════════════════════════════════ */}
        {items.length === 0 ? (
          <div className="empty-state">
            <span>🔍</span>
            <p>No items found</p>
            <small>
              {searchMode ? "Try a different search term" : "Be the first to report one!"}
            </small>
          </div>
        ) : (
          <div className="items-grid">
            {items.map(item => {
              const isOwner = item.userId === user.id;
              return (
                <div key={item._id} className={`item-card ${item.type === "Lost" ? "card-lost" : "card-found"}`}>
                  <div className="card-top">
                    <span className={`type-badge ${item.type === "Lost" ? "badge-lost" : "badge-found"}`}>
                      {item.type === "Lost" ? "🔴 Lost" : "🟢 Found"}
                    </span>
                    {item.status === "Resolved" && (
                      <span className="badge-resolved">✅ Resolved</span>
                    )}
                  </div>

                  <h3 className="card-title">{item.itemName}</h3>
                  <p className="card-desc">{item.description}</p>

                  <div className="card-meta">
                    <span>📍 {item.location}</span>
                    <span>📅 {new Date(item.date).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" })}</span>
                    <span>👤 {item.userName}</span>
                    <span>📞 {item.contactInfo}</span>
                  </div>

                  <div className="card-actions">
                    <button className="btn-view" onClick={() => setViewItem(item)}>
                      View
                    </button>
                    {isOwner && (
                      <>
                        <button className="btn-edit" onClick={() => openEdit(item)}>
                          Edit
                        </button>
                        <button
                          className="btn-del"
                          onClick={() => handleDelete(item._id)}
                          disabled={deleting === item._id}
                        >
                          {deleting === item._id ? "…" : "Delete"}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ══ ADD / EDIT MODAL ════════════════════════════════════ */}
      {showAdd && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal">
            <div className="modal-head">
              <h3>{editItem ? "Edit Item" : "Report New Item"}</h3>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>

            {formMsg.text && (
              <div className={`alert ${formMsg.type === "ok" ? "alert-ok" : "alert-err"}`}>
                {formMsg.text}
              </div>
            )}

            <form onSubmit={handleFormSubmit}>
              <div className="field-row2">
                <div className="field">
                  <label>Item Name *</label>
                  <input type="text" placeholder="e.g. Blue Wallet"
                    value={form.itemName}
                    onChange={e => setForm({...form, itemName: e.target.value})} required />
                </div>
                <div className="field">
                  <label>Type *</label>
                  <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                    <option value="Lost">Lost</option>
                    <option value="Found">Found</option>
                  </select>
                </div>
              </div>

              <div className="field">
                <label>Description *</label>
                <textarea placeholder="Describe the item in detail — color, brand, distinguishing features…"
                  value={form.description}
                  onChange={e => setForm({...form, description: e.target.value})}
                  rows={3} required />
              </div>

              <div className="field-row2">
                <div className="field">
                  <label>Location *</label>
                  <input type="text" placeholder="e.g. Library, Block A"
                    value={form.location}
                    onChange={e => setForm({...form, location: e.target.value})} required />
                </div>
                <div className="field">
                  <label>Date *</label>
                  <input type="date" value={form.date}
                    onChange={e => setForm({...form, date: e.target.value})} required />
                </div>
              </div>

              <div className="field-row2">
                <div className="field">
                  <label>Contact Info *</label>
                  <input type="text" placeholder="Phone or email"
                    value={form.contactInfo}
                    onChange={e => setForm({...form, contactInfo: e.target.value})} required />
                </div>
                {editItem && (
                  <div className="field">
                    <label>Status</label>
                    <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                      <option value="Active">Active</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="modal-btns">
                <button type="button" className="btn-cancel" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn-main sm" disabled={saving}>
                  {saving ? <span className="spinner dark" /> : editItem ? "Save Changes" : "Submit Report"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ VIEW DETAIL MODAL ═══════════════════════════════════ */}
      {viewItem && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setViewItem(null)}>
          <div className="modal">
            <div className="modal-head">
              <h3>Item Details</h3>
              <button className="modal-close" onClick={() => setViewItem(null)}>✕</button>
            </div>
            <div className={`detail-type-banner ${viewItem.type === "Lost" ? "banner-lost" : "banner-found"}`}>
              {viewItem.type === "Lost" ? "🔴 LOST ITEM" : "🟢 FOUND ITEM"}
              {viewItem.status === "Resolved" && " — ✅ RESOLVED"}
            </div>
            <div className="detail-grid">
              <div className="detail-row"><span>Item Name</span><strong>{viewItem.itemName}</strong></div>
              <div className="detail-row"><span>Description</span><strong>{viewItem.description}</strong></div>
              <div className="detail-row"><span>Location</span><strong>{viewItem.location}</strong></div>
              <div className="detail-row"><span>Date</span><strong>{new Date(viewItem.date).toLocaleDateString("en-IN", { day:"numeric", month:"long", year:"numeric" })}</strong></div>
              <div className="detail-row"><span>Reported By</span><strong>{viewItem.userName}</strong></div>
              <div className="detail-row"><span>Contact</span><strong>{viewItem.contactInfo}</strong></div>
            </div>
            <button className="btn-main sm" style={{marginTop:"16px"}} onClick={() => setViewItem(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}