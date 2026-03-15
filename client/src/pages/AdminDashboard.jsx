import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Users, UserPlus, Shield, FileText, Trash2 } from "lucide-react";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";

function cx(...c) { return c.filter(Boolean).join(" "); }

const PAGE_SIZE = 5;

function Pagination({ page, total, onChange }) {
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-6 py-3 border-t border-slate-700">
      <p className="text-xs text-slate-400">
        Showing {Math.min((page - 1) * PAGE_SIZE + 1, total)}–{Math.min(page * PAGE_SIZE, total)} of {total}
      </p>
      <div className="flex items-center gap-1">
        <button onClick={() => onChange(page - 1)} disabled={page === 1}
          className="px-3 py-1.5 text-xs font-semibold rounded-md bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
          ← Prev
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button key={p} onClick={() => onChange(p)}
            className={cx("px-3 py-1.5 text-xs font-semibold rounded-md border transition-all",
              p === page
                ? "bg-indigo-600 text-white border-indigo-500"
                : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
            )}>
            {p}
          </button>
        ))}
        <button onClick={() => onChange(page + 1)} disabled={page === totalPages}
          className="px-3 py-1.5 text-xs font-semibold rounded-md bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
          Next →
        </button>
      </div>
    </div>
  );
}

function Modal({ title, subtitle, accentColor, icon: Icon, onClose, children }) {
  const colors = {
    blue:   { border: "border-indigo-500",   bg: "from-indigo-950",  iconBg: "bg-indigo-600",   sub: "text-indigo-300"   },
    green:  { border: "border-green-500",  bg: "from-green-950", iconBg: "bg-green-600",  sub: "text-green-300"  },
    purple: { border: "border-purple-500", bg: "from-purple-950",iconBg: "bg-purple-600", sub: "text-purple-300" },
  }[accentColor];
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className={cx("bg-gradient-to-br to-slate-900 rounded-xl border-2 shadow-2xl p-8 w-full max-w-md", colors.bg, colors.border)}>
        <div className="flex items-center gap-3 mb-1">
          <div className={cx("p-2 rounded-lg", colors.iconBg)}><Icon className="w-6 h-6 text-white" /></div>
          <h3 className="text-xl font-bold text-white">{title}</h3>
        </div>
        <p className={cx("text-sm mb-6 ml-14", colors.sub)}>{subtitle}</p>
        {children}
        <button onClick={onClose} className="mt-4 w-full py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold rounded-lg transition-all">
          Cancel
        </button>
      </div>
    </div>
  );
}

const inputCls = "w-full px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all";
function CustomSelect({ value, onChange, options, placeholder = "Select..." }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    function h(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const selected = options.find((o) => String(o.value) === String(value));
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)}
        className={cx(
          "w-full px-4 py-2.5 bg-slate-800 border rounded-lg text-left flex items-center justify-between transition-all outline-none focus:outline-none focus:ring-0",
          open ? "border-indigo-500 ring-2 ring-indigo-500" : "border-slate-600 hover:border-indigo-600"
        )}>
        <span className={selected ? "text-white" : "text-slate-500"}>{selected ? selected.label : placeholder}</span>
        <svg className={cx("w-4 h-4 text-slate-400 transition-transform", open && "rotate-180")} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>
      {open && (
        <ul className="absolute z-50 mt-1 w-full bg-slate-800 border border-indigo-500/50 rounded-lg shadow-xl overflow-hidden max-h-52 overflow-y-auto">
          {options.map((o) => (
            <li key={o.value} onClick={() => { onChange(o.value); setOpen(false); }}
              className={cx("px-4 py-2.5 text-sm cursor-pointer transition-colors",
                String(o.value) === String(value)
                  ? "bg-indigo-600 text-white"
                  : "text-slate-300 hover:bg-indigo-600/30 hover:text-white"
              )}>{o.label}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const isSuperadmin = user?.role === "superadmin";
  const isAdmin      = user?.role === "admin";

  const [loading, setLoading]           = useState(true);
  const [stats, setStats]               = useState(null);
  const [coordinators, setCoordinators] = useState([]);
  const [users, setUsers]               = useState([]);
  const [domains, setDomains]           = useState([]);
  const [queries, setQueries]           = useState([]);

  const [qPage, setQPage]   = useState(1);
  const [cPage, setCPage]   = useState(1);
  const [uPage, setUPage]   = useState(1);

  const [showAdminModal, setShowAdminModal]       = useState(false);
  const [showCoordModal, setShowCoordModal]       = useState(false);
  const [showAssignModal, setShowAssignModal]     = useState(false);
  const [showDeleteModal, setShowDeleteModal]     = useState(false);
  const [selectedQuery, setSelectedQuery]         = useState(null);
  const [deleteTarget, setDeleteTarget]           = useState(null);
  const [deleting, setDeleting]                   = useState(false);

  const pagedQueries = useMemo(() => queries.slice((qPage - 1) * PAGE_SIZE, qPage * PAGE_SIZE), [queries, qPage]);
  const pagedCoords  = useMemo(() => coordinators.slice((cPage - 1) * PAGE_SIZE, cPage * PAGE_SIZE), [coordinators, cPage]);
  const pagedUsers   = useMemo(() => users.slice((uPage - 1) * PAGE_SIZE, uPage * PAGE_SIZE), [users, uPage]);

  const [newAdmin, setNewAdmin]           = useState({ name: "", email: "", password: "" });
  const [newCoord, setNewCoord]           = useState({ name: "", email: "", password: "", domainId: "" });

  useEffect(() => {
    if (!isSuperadmin && !isAdmin) { navigate("/dashboard"); return; }
    async function load() {
      try {
        const calls = [
          api.get("/api/users/stats"),
          api.get("/api/users/coordinators"),
          api.get("/api/users"),
          api.get("/api/domains"),
          api.get("/api/queries"),
        ];
        const [statsRes, coordRes, usersRes, domainsRes, queriesRes] = await Promise.all(calls);
        setStats(statsRes.data?.stats);
        setCoordinators(coordRes.data?.coordinators || []);
        setUsers(usersRes.data?.users || []);
        setDomains(domainsRes.data?.domains || []);
        setQueries(queriesRes.data?.queries || []);
      } catch (e) {
        toast.error(e?.response?.data?.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user, navigate]);

  async function refreshAll() {
    const [u, c, s, q] = await Promise.all([
      api.get("/api/users"),
      api.get("/api/users/coordinators"),
      api.get("/api/users/stats"),
      api.get("/api/queries"),
    ]);
    setUsers(u.data?.users || []);
    setCoordinators(c.data?.coordinators || []);
    setStats(s.data?.stats);
    setQueries(q.data?.queries || []);
  }

  async function handleCreateAdmin() {
    try {
      await api.post("/api/users", { ...newAdmin, role: "admin" });
      toast.success("Admin created successfully");
      setShowAdminModal(false);
      setNewAdmin({ name: "", email: "", password: "" });
      await refreshAll();
    } catch (e) { toast.error(e?.response?.data?.message || "Failed to create admin"); }
  }

  async function handleCreateCoord() {
    try {
      await api.post("/api/users", { ...newCoord, role: "coordinator", domainId: Number(newCoord.domainId) });
      toast.success("Coordinator created successfully");
      setShowCoordModal(false);
      setNewCoord({ name: "", email: "", password: "", domainId: "" });
      await refreshAll();
    } catch (e) { toast.error(e?.response?.data?.message || "Failed to create coordinator"); }
  }

  async function handleAssign(coordinatorId) {
    try {
      await api.patch(`/api/queries/${selectedQuery.id}`, { assignedTo: Number(coordinatorId) });
      toast.success("Coordinator assigned");
      setShowAssignModal(false);
      setSelectedQuery(null);
      await refreshAll();
    } catch (e) { toast.error(e?.response?.data?.message || "Failed to assign"); }
  }

  async function handleDeleteQuery() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/api/queries/${deleteTarget.id}`);
      toast.success("Query deleted.");
      setQueries((prev) => prev.filter((q) => q.id !== deleteTarget.id));
      setShowDeleteModal(false);
      setDeleteTarget(null);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to delete query.");
    } finally {
      setDeleting(false);
    }
  }

  async function handleDeactivate(userId) {
    if (!confirm("Deactivate this user?")) return;
    try {
      await api.patch(`/api/users/${userId}/deactivate`);
      toast.success("User deactivated");
      await refreshAll();
    } catch (e) { toast.error(e?.response?.data?.message || "Failed to deactivate"); }
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <p className="text-slate-300">Loading...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Action buttons */}
        <div className="flex items-center gap-3 flex-wrap">
          {isSuperadmin && (
            <button onClick={() => setShowAdminModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-md transition-all">
              <Shield className="w-4 h-4" /> Create Admin
            </button>
          )}
          {(isSuperadmin || isAdmin) && (
            <button onClick={() => setShowCoordModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-md transition-all">
              <UserPlus className="w-4 h-4" /> Create Coordinator
            </button>
          )}
        </div>
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Users",  value: stats?.totalUsers || 0,          border: "border-l-indigo-500", iconColor: "text-indigo-400", iconBg: "bg-indigo-500/20", Icon: Users    },
            { label: "Open Queries", value: stats?.queries?.open || 0,        border: "border-l-indigo-400", iconColor: "text-indigo-300", iconBg: "bg-indigo-400/20", Icon: FileText },
            { label: "In Progress",  value: stats?.queries?.in_progress || 0, border: "border-l-slate-400",  iconColor: "text-slate-300",  iconBg: "bg-slate-500/20",  Icon: FileText },
            { label: "Resolved",     value: stats?.queries?.resolved || 0,    border: "border-l-indigo-300", iconColor: "text-indigo-200", iconBg: "bg-indigo-300/20", Icon: Shield   },
          ].map((c) => (
            <div key={c.label} className={cx("bg-slate-900 border border-slate-700 rounded-lg p-5 border-l-4", c.border)}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400">{c.label}</p>
                  <p className="text-3xl font-bold text-white mt-1">{c.value}</p>
                </div>
                <div className={cx("w-11 h-11 rounded-lg flex items-center justify-center", c.iconBg)}>
                  <c.Icon className={cx("w-5 h-5", c.iconColor)} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Queries table */}
        <div className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700">
            <h3 className="text-base font-semibold text-white">Manage Queries</h3>
            <p className="text-xs text-slate-400 mt-0.5">Assign coordinators to open queries</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-800">
                <tr>
                  {["ID", "Title", "Domain", "Status", "Assigned To", "Created By", "Actions"].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {pagedQueries.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-10 text-center text-sm text-slate-500">No queries found</td></tr>
                ) : pagedQueries.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-800/60 transition-colors">
                    <td className="px-6 py-4 text-sm font-semibold text-slate-300">#{q.id}</td>
                    <td className="px-6 py-4 text-sm text-white max-w-xs truncate">{q.title}</td>
                    <td className="px-6 py-4 text-sm text-slate-400">{q.domain || "—"}</td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap">
                      <span className={cx("px-2 py-1 rounded-full text-xs font-semibold capitalize",
                        q.status === "open"        ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" :
                        q.status === "in_progress" ? "bg-slate-500/30 text-slate-200 border border-slate-500/40" :
                        q.status === "resolved"    ? "bg-indigo-400/20 text-indigo-200 border border-indigo-400/30" :
                        "bg-slate-700/60 text-slate-400 border border-slate-600/50"
                      )}>
                        {q.status?.replaceAll("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">{q.assigned_to_name || "Unassigned"}</td>
                    <td className="px-6 py-4 text-sm text-slate-400">{q.created_by_name || "—"}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => { setSelectedQuery(q); setShowAssignModal(true); }}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-md transition-all">
                          {q.assigned_to_name ? "Reassign" : "Assign"}
                        </button>
                        {isSuperadmin && (
                          <button onClick={() => { setDeleteTarget(q); setShowDeleteModal(true); }}
                            className="p-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-500/30 rounded-md transition-all" title="Delete query">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={qPage} total={queries.length} onChange={setQPage} />
        </div>

        {/* Coordinators table */}
        <div className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700">
            <h3 className="text-base font-semibold text-white">Coordinators</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-800">
                <tr>
                  {["Name", "Email", "Domain", "Assigned Queries", "Resolved"].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {pagedCoords.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-500">No coordinators yet</td></tr>
                ) : pagedCoords.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/60 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-white">{c.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-400">{c.email}</td>
                    <td className="px-6 py-4 text-sm text-slate-400">{c.domain || "—"}</td>
                    <td className="px-6 py-4 text-sm text-slate-400">{c.query_count || 0}</td>
                    <td className="px-6 py-4 text-sm text-slate-400">{c.resolved_count || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={cPage} total={coordinators.length} onChange={setCPage} />
        </div>

        {/* All users table */}
        <div className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700">
            <h3 className="text-base font-semibold text-white">All Users</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-800">
                <tr>
                  {["Name", "Email", "Role", "Status", "Actions"].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {pagedUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/60 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-white">{u.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-400">{u.email}</td>
                    <td className="px-6 py-4 text-sm text-slate-400 capitalize">{u.role}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={cx("px-2 py-1 rounded-full text-xs font-semibold",
                        u.is_active ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                                    : "bg-slate-700/60 text-slate-400 border border-slate-600/50"
                      )}>
                        {u.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {u.role !== "superadmin" && u.is_active && (
                        <button onClick={() => handleDeactivate(u.id)}
                          className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-500/30 text-xs font-semibold rounded-md transition-all">
                          Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={uPage} total={users.length} onChange={setUPage} />
        </div>
      </main>

      {/* Create Admin Modal — superadmin only */}
      {showAdminModal && (
        <Modal title="Create Admin Account" subtitle="Admins can manage coordinators and view all queries"
          accentColor="blue" icon={Shield} onClose={() => setShowAdminModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name</label>
              <input value={newAdmin.name} onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                className={inputCls} placeholder="Enter admin name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
              <input type="email" value={newAdmin.email} onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                className={inputCls} placeholder="admin@ecell.iitb.ac.in" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <input type="password" value={newAdmin.password} onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                className={inputCls} placeholder="Minimum 6 characters" />
            </div>
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-xs text-indigo-300">
              Admin privileges: manage coordinators, view all queries, access admin panel
            </div>
            <button onClick={handleCreateAdmin}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-all">
              Create Admin
            </button>
          </div>
        </Modal>
      )}

      {/* Create Coordinator Modal */}
      {showCoordModal && (
        <Modal title="Create Coordinator Account" subtitle="Coordinators manage queries in their assigned domain"
          accentColor="blue" icon={UserPlus} onClose={() => setShowCoordModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name</label>
              <input value={newCoord.name} onChange={(e) => setNewCoord({ ...newCoord, name: e.target.value })}
                className={inputCls} placeholder="Enter coordinator name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
              <input type="email" value={newCoord.email} onChange={(e) => setNewCoord({ ...newCoord, email: e.target.value })}
                className={inputCls} placeholder="coordinator@ecell.iitb.ac.in" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <input type="password" value={newCoord.password} onChange={(e) => setNewCoord({ ...newCoord, password: e.target.value })}
                className={inputCls} placeholder="Minimum 6 characters" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Assign Domain</label>
              <CustomSelect
                value={newCoord.domainId}
                onChange={(v) => setNewCoord({ ...newCoord, domainId: v })}
                options={domains.map((d) => ({ value: d.id, label: d.name }))}
                placeholder="Select Domain"
              />
            </div>
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-xs text-indigo-300">
              Coordinator privileges: manage queries in assigned domain, update status, add solutions
            </div>
            <button onClick={handleCreateCoord}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-all">
              Create Coordinator
            </button>
          </div>
        </Modal>
      )}

      {/* Assign Coordinator Modal */}
      {showAssignModal && selectedQuery && (
        <Modal title="Assign Coordinator" subtitle={`Query: ${selectedQuery.title}`}
          accentColor="blue" icon={Users} onClose={() => { setShowAssignModal(false); setSelectedQuery(null); }}>
          <div className="space-y-4">
            <div className="p-3 bg-slate-800 border border-slate-700 rounded-lg text-sm space-y-1">
              <p className="text-slate-300"><span className="text-slate-500">Domain:</span> {selectedQuery.domain || "—"}</p>
              <p className="text-slate-300"><span className="text-slate-500">Status:</span> {selectedQuery.status}</p>
              <p className="text-slate-300"><span className="text-slate-500">Current:</span> {selectedQuery.assigned_to_name || "Unassigned"}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Select Coordinator</label>
              <CustomSelect
                value=""
                onChange={(v) => v && handleAssign(v)}
                options={coordinators.map((c) => ({ value: c.id, label: `${c.name} — ${c.domain || "No domain"}` }))}
                placeholder="Choose a coordinator"
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deleteTarget && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border-2 border-red-500/50 rounded-xl shadow-2xl p-8 w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-600 rounded-lg"><Trash2 className="w-6 h-6 text-white" /></div>
              <h3 className="text-xl font-bold text-white">Delete Query</h3>
            </div>
            <p className="text-slate-300 mb-3">Are you sure you want to permanently delete this query?</p>
            <div className="p-3 bg-slate-800 border border-slate-700 rounded-lg mb-6">
              <p className="text-sm font-semibold text-white">#{deleteTarget.id} — {deleteTarget.title}</p>
              <p className="text-xs text-slate-400 mt-1">This will also delete all comments and attachments. This cannot be undone.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowDeleteModal(false); setDeleteTarget(null); }}
                className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold rounded-lg transition-all">
                Cancel
              </button>
              <button onClick={handleDeleteQuery} disabled={deleting}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-all disabled:opacity-50">
                {deleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
