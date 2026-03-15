import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, Upload, X, FileText, Loader2, Cloud, ArrowDown, Minus, Flame } from "lucide-react";
import api from "../api/axios.js";

function cx(...c) { return c.filter(Boolean).join(" "); }

const PRIORITY_OPTIONS = [
  {
    value: "low", label: "Low", Icon: ArrowDown, description: "Can wait",
    idle:     { border: "border-slate-700", bg: "bg-slate-800",       icon: "text-slate-400",  label: "text-slate-300" },
    selected: { border: "border-indigo-700", bg: "bg-indigo-950/60",  icon: "text-indigo-400", label: "text-indigo-300", ring: "ring-1 ring-indigo-700/50" },
  },
  {
    value: "medium", label: "Medium", Icon: Minus, description: "Normal priority",
    idle:     { border: "border-slate-700", bg: "bg-slate-800",       icon: "text-slate-400",  label: "text-slate-300" },
    selected: { border: "border-indigo-500", bg: "bg-indigo-900/50",  icon: "text-indigo-300", label: "text-indigo-200", ring: "ring-1 ring-indigo-500/40" },
  },
  {
    value: "high", label: "High", Icon: Flame, description: "Urgent",
    idle:     { border: "border-slate-700", bg: "bg-slate-800",       icon: "text-slate-400",  label: "text-slate-300" },
    selected: { border: "border-indigo-400", bg: "bg-indigo-600/25",  icon: "text-indigo-200", label: "text-indigo-100", ring: "ring-1 ring-indigo-400/50" },
  },
];

export default function CreateQueryPage() {
  const navigate = useNavigate();

  const [domains, setDomains] = useState([]);
  const [loadingDomains, setLoadingDomains] = useState(true);
  const [domainError, setDomainError] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [domainId, setDomainId] = useState("");
  const [priority, setPriority] = useState("medium");
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    let alive = true;
    api.get("/api/domains")
      .then((res) => {
        if (!alive) return;
        const list = res.data?.domains || [];
        setDomains(list);
        if (list.length > 0) setDomainId(String(list[0].id));
      })
      .catch((e) => {
        if (!alive) return;
        const msg = e?.response?.data?.error || e?.response?.data?.message || "Failed to load domains.";
        setDomainError(msg);
        toast.error(msg);
      })
      .finally(() => { if (alive) setLoadingDomains(false); });
    return () => { alive = false; };
  }, []);

  const titleCount = useMemo(() => title.length, [title]);
  const descCount  = useMemo(() => description.length, [description]);

  function handleFilesSelected(list) {
    if (!list?.length) return;
    setFiles((prev) => [...prev, ...Array.from(list)]);
  }

  function removeFile(i) { setFiles((prev) => prev.filter((_, idx) => idx !== i)); }

  function validate() {
    const e = {};
    if (!title.trim())              e.title = "Title is required.";
    else if (title.trim().length < 5)  e.title = "Title must be at least 5 characters.";
    else if (title.trim().length > 100) e.title = "Title must be at most 100 characters.";
    if (!description.trim())        e.description = "Description is required.";
    else if (description.trim().length < 20) e.description = "Description must be at least 20 characters.";
    if (!domainId)  e.domainId = "Domain is required.";
    if (!priority)  e.priority = "Priority is required.";
    setFieldErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError("");
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await api.post("/api/queries", {
        title: title.trim(), description: description.trim(),
        domainId: Number(domainId), priority,
      });
      const query = res.data?.query || res.data?.data?.query;
      if (!query?.id) throw new Error("Query not returned from API.");
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        await api.post(`/api/queries/${query.id}/upload`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      }
      toast.success("Query created successfully.");
      navigate(`/queries/${query.id}`, { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || err.message || "Failed to create query.";
      setSubmitError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  const [domainOpen, setDomainOpen] = useState(false);
  const domainRef = useRef(null);

  useEffect(() => {
    function handleClick(e) { if (domainRef.current && !domainRef.current.contains(e.target)) setDomainOpen(false); }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selectedDomain = domains.find((d) => String(d.id) === domainId);

  const inputCls = (err) => cx(
    "w-full px-4 py-2.5 bg-slate-800 border rounded-md text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all",
    err ? "border-red-500" : "border-slate-600"
  );

  return (
    <div className="py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back to Dashboard</span>
        </button>

        <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl">
          {/* Header */}
          <div className="px-8 py-6 border-b border-slate-700">
            <h1 className="text-2xl font-bold text-white">New Query</h1>

          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {submitError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-md text-red-300 text-sm">{submitError}</div>
            )}

            {/* Title */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-semibold text-slate-200">Title <span className="text-red-400">*</span></label>
                <span className="text-xs text-slate-500">{titleCount}/100</span>
              </div>
              <input
                type="text" value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, 100))}
                className={inputCls(fieldErrors.title)}
                placeholder="Brief summary of your query"
              />
              {fieldErrors.title && <p className="mt-1 text-xs text-red-400">{fieldErrors.title}</p>}
            </div>

            {/* Description */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-semibold text-slate-200">Description <span className="text-red-400">*</span></label>
                <span className="text-xs text-slate-500">{descCount} chars</span>
              </div>
              <textarea
                rows={6} value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={cx(inputCls(fieldErrors.description), "resize-none")}
                placeholder="Provide detailed information about your query..."
              />
              {fieldErrors.description && <p className="mt-1 text-xs text-red-400">{fieldErrors.description}</p>}
            </div>

            {/* Domain */}
            <div ref={domainRef} className="relative">
              <label className="block text-sm font-semibold text-slate-200 mb-2">Domain <span className="text-red-400">*</span></label>
              <button
                type="button"
                disabled={loadingDomains || !!domainError}
                onClick={() => setDomainOpen((o) => !o)}
                className={cx(
                  "w-full px-4 py-2.5 bg-slate-800 border rounded-md text-left flex items-center justify-between transition-all outline-none focus:outline-none focus:ring-0",
                  domainOpen ? "border-indigo-500 ring-2 ring-indigo-500" : fieldErrors.domainId ? "border-red-500" : "border-slate-600 hover:border-indigo-600"
                )}
              >
                <span className={selectedDomain ? "text-white" : "text-slate-500"}>
                  {loadingDomains ? "Loading..." : domainError ? domainError : selectedDomain ? selectedDomain.name : "Select a domain"}
                </span>
                <ArrowDown className={cx("w-4 h-4 text-slate-400 transition-transform", domainOpen && "rotate-180")} />
              </button>
              {domainOpen && !loadingDomains && !domainError && (
                <ul className="absolute z-50 mt-1 w-full bg-slate-800 border border-indigo-500/50 rounded-md shadow-xl overflow-hidden">
                  {domains.map((d) => (
                    <li key={d.id}
                      onClick={() => { setDomainId(String(d.id)); setDomainOpen(false); }}
                      className={cx(
                        "px-4 py-2.5 text-sm cursor-pointer transition-colors",
                        String(d.id) === domainId
                          ? "bg-indigo-600 text-white"
                          : "text-slate-300 hover:bg-indigo-600/30 hover:text-white"
                      )}
                    >{d.name}</li>
                  ))}
                </ul>
              )}
              {fieldErrors.domainId && <p className="mt-1 text-xs text-red-400">{fieldErrors.domainId}</p>}
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-3">Priority <span className="text-red-400">*</span></label>
              <div className="grid grid-cols-3 gap-3">
                {PRIORITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value} type="button" onClick={() => setPriority(opt.value)}
                    className={cx(
                      "p-4 border-2 rounded-lg transition-all text-center outline-none focus:outline-none focus:ring-0 focus-visible:outline-none",
                      priority === opt.value
                        ? cx(opt.selected.border, opt.selected.bg, opt.selected.ring)
                        : cx(opt.idle.border, opt.idle.bg, "hover:border-indigo-600 hover:bg-indigo-950/30")
                    )}
                  >
                    <div className="flex justify-center mb-1.5">
                      <opt.Icon className={cx("w-6 h-6 transition-colors", priority === opt.value ? opt.selected.icon : opt.idle.icon)} />
                    </div>
                    <div className={cx("text-sm font-semibold mb-0.5 transition-colors", priority === opt.value ? opt.selected.label : opt.idle.label)}>{opt.label}</div>
                    <div className="text-xs text-slate-500">{opt.description}</div>
                  </button>
                ))}
              </div>
              {fieldErrors.priority && <p className="mt-1 text-xs text-red-400">{fieldErrors.priority}</p>}
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-2">Attachments</label>
              <div
                onDrop={(e) => { e.preventDefault(); handleFilesSelected(e.dataTransfer?.files); }}
                onDragOver={(e) => e.preventDefault()}
                className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center hover:border-indigo-500 transition-colors bg-slate-800/50 cursor-pointer"
              >
                <Cloud className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-300 mb-1">Drag and drop files here or click to browse</p>
                <p className="text-xs text-slate-500 mb-4">Supports images and PDFs</p>
                <input type="file" accept="image/*,application/pdf" multiple
                  onChange={(e) => handleFilesSelected(e.target.files)} className="hidden" id="file-upload" />
                <label htmlFor="file-upload"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium rounded-md cursor-pointer transition-colors">
                  <Upload className="w-4 h-4" />
                  Choose Files
                </label>
              </div>
              {files.length > 0 && (
                <div className="mt-3 space-y-2">
                  {files.map((file, i) => (
                    <div key={`${file.name}-${i}`} className="flex items-center justify-between p-3 bg-slate-800 border border-slate-700 rounded-md">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-200 truncate">{file.name}</p>
                          <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <button type="button" onClick={() => removeFile(i)} className="p-1 hover:bg-slate-700 rounded transition-colors">
                        <X className="w-4 h-4 text-slate-400" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit" disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-full transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {submitting && <Loader2 className="w-5 h-5 animate-spin" />}
                {submitting ? "Creating Query..." : "Create Query"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
