import type { PropsWithChildren } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useBootstrapAuthQuery } from "../../services/appApi";
import { Skeleton } from "../ui/Skeleton";

type Role = "admin" | "user";

type Props = PropsWithChildren<{
    role: Role;
}>;

export function RequireRole({ role, children }: Props) {
    const location = useLocation();
    const { data, isLoading, isError } = useBootstrapAuthQuery();

    if (isLoading) {
        return (
            <div className="mx-auto w-full max-w-5xl p-6">
                <div className="space-y-3">
                    <Skeleton className="h-10 w-40" />
                    <Skeleton className="h-32 w-full" />
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="mx-auto w-full max-w-2xl p-6">
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5 text-slate-200">
                    <p className="text-sm font-semibold">We couldn't verify your session.</p>
                    <p className="mt-1 text-sm text-slate-400">Please try again.</p>
                </div>
            </div>
        );
    }

    const userId = data?.userId ?? null;
    const profile = data?.profile ?? null;

    if (!userId) {
        return <Navigate to="/auth" state={{ from: location }} replace />;
    }

    if (!profile) {
        return (
            <div className="mx-auto w-full max-w-2xl p-6">
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5 text-slate-200">
                    <p className="text-sm font-semibold">Your profile is still initializing.</p>
                    <p className="mt-1 text-sm text-slate-400">
                        Please refresh in a moment. If this persists, sign out and back in.
                    </p>
                </div>
            </div>
        );
    }

    const isAdmin = profile.is_admin;

    if (role === "admin" && !isAdmin) {
        return <Navigate to="/dashboard" replace />;
    }

    if (role === "user" && isAdmin) {
        return <Navigate to="/admin" replace />;
    }

    return <>{children}</>;
}
