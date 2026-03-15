import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, Loader2, CheckCircle, RotateCcw, MessageSquarePlus, Paperclip, FileText, Image } from "lucide-react";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";

const SERVER_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:5000";

function cx(...c) { return c.filter(Boolean).join(" "); }

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

export default function QueryDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading]           = useState(true);
  const [query, setQuery]               = useState(null);
  const [comments, setComments]         = useState([]);
  const [attachments, setAttachments]   = useState([]);
  const [commentText, setCommentText]   = useState("");
  const [commentSaving, setCommentSaving] = useState(false);
  const [followUpText, setFollowUpText] = useState("");
  const [followUpSaving, setFollowUpSaving] = useState(false);
  const [closingSaving, setClosingSaving] = useState(false);
  const [showFollowUp, setShowFollowUp] = useState(false);

  const isStudent = user?.role === "student" || user?.role === "member";
  const isOwner   = query && Number(query.created_by) === Number(user?.id);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api.get(`/api/queries/${id}`)
      .then((res) => {
        if (!alive) return;
        setQuery(res.data?.query || null);
        setComments(res.data?.comments || []);
        setAttachments(res.data?.attachments || []);
      })
      .catch((e) => { if (alive) toast.error(e?.response?.data?.message || "Failed to load query."); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [id]);

  async function handleAddComment() {
    if (!commentText.trim()) return;
    setCommentSaving(true);
    try {
      const res = await api.post(`/api/queries/${id}/comments`, { content: commentText.trim() });
      const next = res.data?.comment;
      if (next) setComments((prev) => [...prev, next]);
      // Update status if backend transitioned it
      if (res.data?.newStatus) setQuery((q) => ({ ...q, status: res.data.newStatus }));
      setCommentText("");
      toast.success("Comment added.");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to add comment.");
    } finally {
      setCommentSaving(false);
    }
  }

  async function handleFollowUp() {
    if (!followUpText.trim()) return;
    setFollowUpSaving(true);
    try {
      const res = await api.post(`/api/queries/${id}/comments`, { content: followUpText.trim() });
      const next = res.data?.comment;
      if (next) setComments((prev) => [...prev, next]);
      if (res.data?.newStatus) setQuery((q) => ({ ...q, status: res.data.newStatus }));
      setFollowUpText("");
      setShowFollowUp(false);
      toast.success("Follow-up submitted. Query reopened.");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to submit follow-up.");
    } finally {
      setFollowUpSaving(false);
    }
  }

  async function handleMarkClosed() {
    setClosingSaving(true);
    try {
      await api.patch(`/api/queries/${id}`, { status: "closed" });
      setQuery((q) => ({ ...q, status: "closed" }));
      toast.success("Query closed. Glad we could help!");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to close query.");
    } finally {
      setClosingSaving(false);
    }
  }

  if (loading) return (
    <div className="py-32 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
    </div>
  );

  if (!query) return (
    <div className="py-32 flex items-center justify-center">
      <div className="text-center">
        <p className="text-slate-300 font-semibold mb-4">Query not found</p>
        <button onClick={() => navigate("/dashboard")}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md transition-all">
          Back to Dashboard
        </button>
      </div>
    </div>
  );

  return (
    <div className="py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back to Dashboard</span>
        </button>

        <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-8">
          {/* Title */}
          <div className="mb-6">
            <span className="text-xs text-slate-500 uppercase tracking-wide">Query #{query.id}</span>
            <h1 className="text-2xl font-bold text-white mt-1 break-words">{query.title}</h1>
          </div>

          {/* Description */}
          <p className="text-slate-300 whitespace-pre-wrap break-words leading-relaxed mb-8">{query.description}</p>

          {/* Metadata */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8 p-4 bg-slate-800 rounded-lg border border-slate-700">
            <div>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Status</span>
              <div className="mt-2"><StatusBadge status={query.status} /></div>
            </div>
            <div>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Priority</span>
              <div className="mt-2"><PriorityBadge priority={query.priority} /></div>
            </div>
            <div>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Domain</span>
              <p className="text-sm font-semibold text-slate-200 mt-2">{query.domain || "—"}</p>
            </div>
            <div>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Assigned To</span>
              <p className="text-sm font-semibold text-slate-200 mt-2">{query.assigned_to_name || "Unassigned"}</p>
            </div>
          </div>

          {/* ── Student action banners ── */}
          {isStudent && isOwner && query.status === "resolved" && (
            <div className="mb-6 space-y-3">
              {/* Satisfied → Close */}
              <div className="flex items-center justify-between gap-4 p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
                <div>
                  <p className="text-sm font-semibold text-indigo-200">Your query has been resolved!</p>
                  <p className="text-xs text-indigo-300/70 mt-0.5">If you're satisfied with the answer, mark it as closed.</p>
                </div>
                <button onClick={handleMarkClosed} disabled={closingSaving}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-md transition-all whitespace-nowrap disabled:opacity-50">
                  <CheckCircle className="w-4 h-4" />
                  {closingSaving ? "Closing..." : "I'm Satisfied"}
                </button>
              </div>

              {/* Not satisfied → Follow-up */}
              {!showFollowUp && (
                <div className="flex items-center justify-between gap-4 p-4 bg-slate-700/40 border border-slate-600 rounded-lg">
                <div>
                  <p className="text-sm font-semibold text-slate-200">Not satisfied with the answer?</p>
                  <p className="text-xs text-slate-400 mt-0.5">Ask a follow-up question to reopen this query.</p>
                </div>
                <button onClick={() => setShowFollowUp(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white text-sm font-semibold rounded-md transition-all whitespace-nowrap">
                    <RotateCcw className="w-4 h-4" />
                    Ask Follow-up
                  </button>
                </div>
              )}

              {showFollowUp && (
                <div className="p-4 bg-slate-700/40 border border-slate-600 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquarePlus className="w-4 h-4 text-slate-300" />
                    <p className="text-sm font-semibold text-slate-200">Follow-up Question</p>
                    <p className="text-xs text-slate-400">(will reopen the query)</p>
                  </div>
                  <textarea
                    value={followUpText}
                    onChange={(e) => setFollowUpText(e.target.value)}
                    rows={3}
                    placeholder="Describe what's still unclear or what you need more help with..."
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-md text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                  />
                  <div className="mt-3 flex gap-3 justify-end">
                    <button onClick={() => { setShowFollowUp(false); setFollowUpText(""); }}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-medium rounded-md transition-all">
                      Cancel
                    </button>
                    <button onClick={handleFollowUp} disabled={followUpSaving || !followUpText.trim()}
                      className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-md transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                      <RotateCcw className="w-4 h-4" />
                      {followUpSaving ? "Submitting..." : "Submit Follow-up"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Closed banner */}
          {query.status === "closed" && (
            <div className="mb-6 p-4 bg-slate-700/40 border border-slate-600 rounded-lg">
              <p className="text-sm font-semibold text-slate-300">✓ This query has been closed.</p>
              <p className="text-xs text-slate-500 mt-0.5">The student confirmed they were satisfied with the resolution.</p>
            </div>
          )}

          {/* Attachments */}
          {attachments.length > 0 && (
            <div className="border-t border-slate-700 pt-6 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Paperclip className="w-4 h-4 text-slate-400" />
                <h3 className="text-base font-semibold text-white">Attachments ({attachments.length})</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {attachments.map((a) => {
                  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(a.file_name);
                  const url = a.file_url.startsWith("http") ? a.file_url : `${SERVER_URL}${a.file_url}`;
                  return (
                    <a key={a.id} href={url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-slate-800 border border-slate-700 hover:border-indigo-500/50 rounded-lg transition-all group">
                      <div className="w-8 h-8 rounded-md bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                        {isImage
                          ? <Image className="w-4 h-4 text-indigo-400" />
                          : <FileText className="w-4 h-4 text-indigo-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-200 truncate group-hover:text-indigo-300 transition-colors">{a.file_name}</p>
                        <p className="text-xs text-slate-500">{a.uploaded_by_name} · {new Date(a.created_at).toLocaleDateString()}</p>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* Comments */}
          <div className="border-t border-slate-700 pt-6">
            <h3 className="text-base font-semibold text-white mb-4">Comments ({comments.length})</h3>

            <div className="space-y-3 mb-6">
              {comments.length === 0 ? (
                <div className="text-center py-8 bg-slate-800 rounded-lg border border-dashed border-slate-600">
                  <p className="text-sm text-slate-500">No comments yet. Be the first to comment.</p>
                </div>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className={cx("rounded-lg border p-4",
                    c.user_role === "coordinator" || c.user_role === "admin" || c.user_role === "superadmin"
                      ? "bg-indigo-950/40 border-indigo-500/30"
                      : "bg-slate-800 border-slate-700"
                  )}>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <div className={cx("w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0",
                        c.user_role === "coordinator" || c.user_role === "admin" || c.user_role === "superadmin" ? "bg-blue-600" : "bg-indigo-600"
                      )}>
                        {c.user_name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <span className="text-sm font-semibold text-slate-200">{c.user_name}</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        {c.user_role || "student"}
                      </span>
                      <span className="text-xs text-slate-500 ml-auto">{new Date(c.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-slate-300 whitespace-pre-wrap break-words overflow-hidden pl-9">{c.content}</p>
                  </div>
                ))
              )}
            </div>

            {/* Comment input — hidden for closed queries */}
            {query.status !== "closed" && (
              <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {user?.name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      rows={3}
                      placeholder={isStudent && isOwner ? "Add a comment..." : "Write a response..."}
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-md text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none"
                    />
                    <div className="mt-3 flex justify-end">
                      <button onClick={handleAddComment} disabled={commentSaving || !commentText.trim()}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-md transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                        {commentSaving ? "Posting..." : "Post Comment"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
