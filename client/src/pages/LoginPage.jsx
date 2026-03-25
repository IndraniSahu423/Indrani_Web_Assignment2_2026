import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Mail, Lock } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

function getErrorMessage(err) {
  return err?.response?.data?.message || err?.message || "Something went wrong.";
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login({ email, password });
      toast.success("Signed in successfully.");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Query and Issue Management Portal</h1>
          <p className="text-slate-400 text-sm mt-1">E-Cell IIT Bombay</p>
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-white mb-6">Sign in to your account</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-md text-red-300 text-sm">{error}</div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input value={email} onChange={(e) => setEmail(e.target.value)}
                  type="email" autoComplete="email" placeholder="you@example.com" required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-600 rounded-md text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input value={password} onChange={(e) => setPassword(e.target.value)}
                  type="password" autoComplete="current-password" placeholder="••••••••" required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-600 rounded-md text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            <button type="submit" disabled={submitting}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-md transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100">
              {submitting ? "Signing in..." : "Login"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Don't have an account?{" "}
            <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold">Create Account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
