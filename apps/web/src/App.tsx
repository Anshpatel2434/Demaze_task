import { useCallback, useEffect, useRef, useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { RequireRole } from "./components/auth/RequireRole";
import { RootRedirect } from "./components/auth/RootRedirect";
import AdminPage from "./pages/admin/Page/AdminPage";
import { AuthPage } from "./pages/auth/Page/AuthPage";
import { authApi } from "./pages/auth/redux_usecases/authApi";
import UserDashboard from "./pages/user_dashboard/Page/UserDashboard";
import { supabase } from "./services/apiClient";
import { appApi } from "./services/appApi";
import { useAppDispatch } from "./store/hooks";

type ToastVariant = "success" | "error" | "info";

type ToastState = {
    variant: ToastVariant;
    message: string;
} | null;

const toastStyles: Record<ToastVariant, string> = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-950",
    error: "border-rose-200 bg-rose-50 text-rose-950",
    info: "border-sky-200 bg-sky-50 text-sky-950",
};

function App() {
    const dispatch = useAppDispatch();

    const [toast, setToast] = useState<ToastState>(null);
    const toastTimerRef = useRef<number | null>(null);

    const showToast = useCallback((variant: ToastVariant, message: string) => {
        setToast({ variant, message });

        if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
        toastTimerRef.current = window.setTimeout(() => {
            setToast(null);
            toastTimerRef.current = null;
        }, 3500);
    }, []);

    useEffect(() => {
        return () => {
            if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
        };
    }, []);

    useEffect(() => {
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event) => {
            if (event === "SIGNED_OUT") {
                dispatch(appApi.util.resetApiState());
                dispatch(authApi.util.resetApiState());
                return;
            }

            dispatch(appApi.util.invalidateTags([{ type: "Auth", id: "BOOTSTRAP" }]));
        });

        return () => subscription.unsubscribe();
    }, [dispatch]);

    return (
        <div className="min-h-dvh bg-slate-100 text-slate-900">
            {toast ? (
                <div className="fixed right-4 top-4 z-50 w-[min(420px,calc(100vw-2rem))]">
                    <div
                        role="status"
                        className={`flex items-start justify-between gap-4 rounded-xl border p-4 shadow-lg ${toastStyles[toast.variant]}`}
                    >
                        <p className="text-sm leading-5">{toast.message}</p>
                        <button
                            onClick={() => setToast(null)}
                            className="rounded-md px-2 py-1 text-xs text-slate-700 hover:bg-slate-900/5 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
                            aria-label="Dismiss notification"
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            ) : null}

            <Router>
                <Routes>
                    <Route path="/" element={<RootRedirect />} />
                    <Route path="/auth" element={<AuthPage showToast={showToast} />} />
                    <Route
                        path="/admin"
                        element={
                            <RequireRole role="admin">
                                <AdminPage showToast={showToast} />
                            </RequireRole>
                        }
                    />
                    <Route
                        path="/dashboard"
                        element={
                            <RequireRole role="user">
                                <UserDashboard showToast={showToast} />
                            </RequireRole>
                        }
                    />
                </Routes>
            </Router>
        </div>
    );
}

export type ShowToast = (variant: ToastVariant, message: string) => void;

export default App;
