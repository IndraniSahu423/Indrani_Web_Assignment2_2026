import { Link } from "react-router-dom";
import { Home, LogIn } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-surface-800 border border-border-800 rounded-lg shadow-lg p-8">
          <div className="mx-auto w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mb-6">
            <span className="text-4xl font-bold text-accent">404</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 mb-2">Page Not Found</h1>
          <p className="text-slate-300 mb-8">
            The page you're looking for doesn't exist or may have been moved.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-accent hover:bg-accent/90 text-slate-950 font-semibold rounded-md transition-all"
            >
              <Home className="w-4 h-4" />
              Go to Dashboard
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 border border-border-800 hover:bg-surface-700 text-slate-100 font-semibold rounded-md transition-all"
            >
              <LogIn className="w-4 h-4" />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

