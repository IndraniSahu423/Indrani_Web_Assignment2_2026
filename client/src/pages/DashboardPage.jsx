import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FileText, Search } from "lucide-react";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";

function cx(...c) { return c.filter(Boolean).join(" "); }

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d) ? "—" : d.toLocaleString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

function StatusBadge({ status }) {
  const map = {
    open:        "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30",
    in_progress: "bg-slate-500/30 text-slate-200 border border-slate-500/40",
    resolved:    "bg-indigo-400/20 text-indigo-200 border border-indigo-400/30",
    closed:      "bg-slate-700/60 text-slate-400 border border-slate-600/50",
  };
  return (
    <span className={cx("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize", map[status] || map.closed)}>
      {(status || "—").replaceAll("_", " ")}
    </span>
  );
}

function PriorityBadge({ priority }) {
  const map = {
    high:   "bg-indigo-600/30 text-indigo-200 border border-indigo-500/40",
    medium: "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30",
    low:    "bg-slate-600/40 text-slate-300 border border-slate-500/40",
  };
  return (
    <span className={cx("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize", map[priority] || "bg-slate-500/20 text-slate-300 border border-slate-500/30")}>
      {priority || "—"}
    </span>
  );
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {[24, 48, 24, 20, 24, 28, 24, 16].map((w, i) => (
        <td key={i} className="px-6 py-4">
          <div className={`h-3.5 rounded bg-slate-700 w-${w}`} />
        </td>
      ))}
    </tr>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const isStudent = user?.role === "member" || user?.role === "student";
  const canSeeAllQueries = user?.role === "admin" || user?.role === "superadmin" || user?.role === "coordinator";

  const [loading, setLoading] = useState(true);
  const [queries, setQueries] = useState([]);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [domain, setDomain] = useState("");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api.get("/api/queries")
      .then((res) => { if (alive) setQueries(Array.isArray(res.data?.queries) ? res.data.queries : []); })
      .catch((e) => {
        if (!alive) return;
        const msg = e?.response?.data?.error || e?.response?.data?.message || "Failed to load queries.";
        setError(msg);
        toast.error(msg);
      })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const domainOptions = useMemo(() => {
    const seen = new Map();
    queries.forEach((q) => { if (q?.domain_id != null) seen.set(String(q.domain_id), q.domain || `Domain ${q.domain_id}`); });
    return [...seen.entries()].map(([value, label]) => ({ value, label }));
  }, [queries]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return queries.filter((q) =>
      (!s || (q?.title || "").toLowerCase().includes(s)) &&
      (!status || q?.status === status) &&
      (!priority || q?.priority === priority) &&
      (!domain || String(q?.domain_id) === domain)
    );
  }, [queries, search, status, priority, domain]);

  const stats = useMemo(() => ({
    total:      queries.length,
    open:       queries.filter((q) => q.status === "open").length,
    inProgress: queries.filter((q) => q.status === "in_progress").length,
    resolved:   queries.filter((q) => q.status === "resolved").length,
  }), [queries]);

  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  useEffect(() => { setPage(1); }, [search, status, priority, domain]);

  const paged = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const selectCls = "w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-md text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all";

  return (
    <div className="bg-slate-950">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Queries", value: stats.total,      border: "border-l-indigo-500",  iconBg: "bg-indigo-500/20",  iconColor: "text-indigo-400"  },
            { label: "Open",          value: stats.open,       border: "border-l-indigo-400",  iconBg: "bg-indigo-400/20",  iconColor: "text-indigo-300"  },
            { label: "In Progress",   value: stats.inProgress, border: "border-l-slate-400",   iconBg: "bg-slate-500/20",   iconColor: "text-slate-300"   },
            { label: "Resolved",      value: stats.resolved,   border: "border-l-indigo-300",  iconBg: "bg-indigo-300/20",  iconColor: "text-indigo-200"  },
          ].map((c) => (
            <div key={c.label} className={cx("bg-slate-900 border border-slate-700 rounded-lg p-5 border-l-4", c.border)}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400">{c.label}</p>
                  <p className="text-3xl font-bold text-white mt-1">{c.value}</p>
                </div>
                <div className={cx("w-11 h-11 rounded-lg flex items-center justify-center", c.iconBg)}>
                  <FileText className={cx("w-5 h-5", c.iconColor)} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by title..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-600 rounded-md text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectCls}>
                <option value="">All</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)} className={selectCls}>
                <option value="">All</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            {canSeeAllQueries && (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">Domain</label>
                <select value={domain} onChange={(e) => setDomain(e.target.value)} className={selectCls}>
                  <option value="">All</option>
                  {domainOptions.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-white">{isStudent ? "My Queries" : "All Queries"}</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {filtered.length === 0 ? "No results" : `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filtered.length)} of ${filtered.length}`}
              </p>
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
          </div>

          {/* Desktop table */}
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-800">
                <tr>
                  {["ID", "Title", "Domain", "Priority", "Status", "Assigned To", "Created At", "Actions"].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {loading ? (
                  <><SkeletonRow /><SkeletonRow /><SkeletonRow /></>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-14 text-center">
                      <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                      <p className="text-sm font-medium text-slate-300">{isStudent ? "No queries yet" : "No queries found"}</p>
                      <p className="text-xs text-slate-500 mt-1">{isStudent ? "Click \"New Query\" in the navbar to raise your first query" : "Try adjusting your filters"}</p>
                    </td>
                  </tr>
                ) : (
                  paged.map((q) => (
                    <tr key={q.id} className="hover:bg-slate-800/60 cursor-pointer transition-colors" onClick={() => navigate(`/queries/${q.id}`)}>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-300 whitespace-nowrap">#{q.id}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-white break-words max-w-[200px]">{q.title}</div>
                        <div className="text-xs text-slate-500 mt-0.5">by {q.created_by_name || "—"}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400 whitespace-nowrap">{q.domain || "—"}</td>
                      <td className="px-6 py-4 whitespace-nowrap"><PriorityBadge priority={q.priority} /></td>
                      <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={q.status} /></td>
                      <td className="px-6 py-4 text-sm text-slate-400 whitespace-nowrap">{q.assigned_to_name || "Unassigned"}</td>
                      <td className="px-6 py-4 text-sm text-slate-400 whitespace-nowrap">{formatDate(q.created_at)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button onClick={(e) => { e.stopPropagation(); navigate(`/queries/${q.id}`); }} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-md transition-all">View</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-3 border-t border-slate-700">
              <p className="text-xs text-slate-400">Page {page} of {totalPages}</p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage((p) => p - 1)} disabled={page === 1}
                  className="px-3 py-1.5 text-xs font-semibold rounded-md bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                  ← Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button key={p} onClick={() => setPage(p)}
                    className={cx("px-3 py-1.5 text-xs font-semibold rounded-md border transition-all",
                      p === page ? "bg-indigo-600 text-white border-indigo-500" : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                    )}>{p}</button>
                ))}
                <button onClick={() => setPage((p) => p + 1)} disabled={page === totalPages}
                  className="px-3 py-1.5 text-xs font-semibold rounded-md bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
