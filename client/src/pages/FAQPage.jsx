import { useEffect, useState, useMemo } from "react";
import { Search, BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import api from "../api/axios.js";

function cx(...c) { return c.filter(Boolean).join(" "); }

const PRIORITY_COLORS = {
  high:   "bg-indigo-600/30 text-indigo-200 border border-indigo-500/40",
  medium: "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30",
  low:    "bg-slate-600/40 text-slate-300 border border-slate-500/40",
};

function FAQCard({ faq }) {
  const [open, setOpen] = useState(false);
  const answer = faq.solution || faq.commentSummary;
  return (
    <div className={cx("bg-slate-900 border rounded-lg transition-all overflow-hidden", open ? "border-indigo-500/50" : "border-slate-700 hover:border-slate-600")}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full px-5 py-4 flex items-start justify-between gap-4 text-left outline-none focus:outline-none"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 border border-slate-600">{faq.domain}</span>
            <span className={cx("text-xs font-semibold px-2 py-0.5 rounded-full capitalize", PRIORITY_COLORS[faq.priority] || PRIORITY_COLORS.low)}>{faq.priority}</span>
          </div>
          <p className="text-sm font-semibold text-white break-words">{faq.title}</p>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-1" /> : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0 mt-1" />}
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-slate-700/60 pt-4 space-y-3">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Q</p>
            <p className="text-sm text-slate-300 break-words">{faq.description}</p>
          </div>
          <div className="p-4 bg-indigo-950/40 border border-indigo-500/30 rounded-lg">
            <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wide mb-1">A</p>
            {answer
              ? <p className="text-sm text-indigo-100 break-words whitespace-pre-wrap">{answer}</p>
              : <p className="text-sm text-slate-500 italic">No answer recorded.</p>
            }
          </div>
          <p className="text-xs text-slate-600">Resolved · {new Date(faq.created_at).toLocaleDateString()}</p>
        </div>
      )}
    </div>
  );
}

export default function FAQPage() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [domain, setDomain] = useState("");

  useEffect(() => {
    api.get("/api/queries/faq")
      .then((res) => setFaqs(res.data?.faqs || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const domains = useMemo(() => [...new Set(faqs.map((f) => f.domain))], [faqs]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return faqs.filter((f) =>
      (!s || f.title.toLowerCase().includes(s) || f.description.toLowerCase().includes(s) || f.solution?.toLowerCase().includes(s) || f.commentSummary?.toLowerCase().includes(s)) &&
      (!domain || f.domain === domain)
    );
  }, [faqs, search, domain]);

  return (
    <div className="py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-indigo-600/20 border border-indigo-500/30 rounded-lg">
            <BookOpen className="w-5 h-5 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">FAQ</h1>
        </div>
        <p className="text-sm text-slate-400 mb-6 ml-12">Browse resolved queries. All entries are anonymous.</p>

        {/* Filters */}
        <div className="flex gap-3 mb-6 flex-col sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search questions or solutions..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            />
          </div>
          <select
            value={domain} onChange={(e) => setDomain(e.target.value)}
            className="px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          >
            <option value="">All Domains</option>
            {domains.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        {/* Results */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map((i) => <div key={i} className="h-16 bg-slate-800 rounded-lg animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-slate-900 border border-dashed border-slate-700 rounded-lg">
            <BookOpen className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-400">{faqs.length === 0 ? "No resolved queries yet" : "No results found"}</p>
            <p className="text-xs text-slate-600 mt-1">{faqs.length === 0 ? "Check back once queries have been resolved" : "Try a different search or domain"}</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</p>
            {filtered.map((f) => <FAQCard key={f.id} faq={f} />)}
          </div>
        )}
      </div>
    </div>
  );
}
