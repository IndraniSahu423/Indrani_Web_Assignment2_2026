import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { User, Mail, Lock, ShieldCheck } from "lucide-react";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";

function getErrorMessage(err) {
  return err?.response?.data?.message || err?.message || "Something went wrong.";
}

const inputCls = "w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-600 rounded-md text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();

  const [step, setStep] = useState("details"); // "details" | "otp"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const inputRefs = useRef([]);

  async function handleDetails(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.post("/api/auth/register-send-otp", { name, email, password });
      toast.success("OTP sent to your email.");
      setStep("otp");
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleOtp(e) {
    e.preventDefault();
    const otpValue = otp.join("");
    if (otpValue.length !== 6) { setError("Please enter the 6-digit OTP."); return; }
    setError("");
    setSubmitting(true);
    try {
      const res = await api.post("/api/auth/register-verify-otp", { email, otp: otpValue });
      await loginWithToken({ token: res.data.token, user: res.data.user });
      toast.success("Account created successfully!");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  function handleOtpInput(index, value) {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  }

  function handleOtpKeyDown(index, e) {
    if (e.key === "Backspace" && !otp[index] && index > 0)
      inputRefs.current[index - 1]?.focus();
  }

  function handleOtpPaste(e) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      inputRefs.current[5]?.focus();
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

          {step === "details" ? (
            <>
              <h2 className="text-2xl font-semibold text-white mb-1">Create Account</h2>
              <p className="text-sm text-slate-400 mb-6">Sign up to get started with the portal</p>

              {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-md text-red-300 text-sm">{error}</div>}

              <form onSubmit={handleDetails} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">Full Name <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input value={name} onChange={(e) => setName(e.target.value)} type="text" autoComplete="name"
                      className={inputCls} placeholder="John Doe" required />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">Email <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email"
                      className={inputCls} placeholder="you@example.com" required />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">Password <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete="new-password"
                      className={inputCls} placeholder="••••••••" minLength={6} required />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">Minimum 6 characters</p>
                </div>

                <button type="submit" disabled={submitting}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                  {submitting ? "Sending OTP..." : "Continue"}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-slate-400">
                  Already have an account?{" "}
                  <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold">Sign in</Link>
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-indigo-600/20 border border-indigo-500/30 rounded-lg">
                  <ShieldCheck className="w-5 h-5 text-indigo-400" />
                </div>
                <h2 className="text-xl font-semibold text-white">Verify your email</h2>
              </div>
              <p className="text-sm text-slate-400 mb-6">
                We sent a 6-digit OTP to <span className="text-indigo-300 font-medium">{email}</span>. Enter it below to complete registration.
              </p>

              {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-md text-red-300 text-sm">{error}</div>}

              <form onSubmit={handleOtp} className="space-y-6">
                <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input key={i}
                      ref={(el) => (inputRefs.current[i] = el)}
                      value={digit}
                      onChange={(e) => handleOtpInput(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      maxLength={1} inputMode="numeric"
                      className="w-11 h-12 text-center text-lg font-bold bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    />
                  ))}
                </div>

                <button type="submit" disabled={submitting || otp.join("").length !== 6}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                  {submitting ? "Verifying..." : "Verify & Create Account"}
                </button>
              </form>

              <button onClick={() => { setStep("details"); setOtp(["","","","","",""]); setError(""); }}
                className="mt-4 w-full text-sm text-slate-400 hover:text-white transition-colors">
                ← Back
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
