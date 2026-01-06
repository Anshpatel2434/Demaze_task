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

    if (isError || !data?.userId || !data?.profile) {
        return <Navigate to="/auth" state={{ from: location }} replace />;
    }

    const profile = data.profile;

    const isAdmin = profile.is_admin;

    if (role === "admin" && !isAdmin) {
        return <Navigate to="/dashboard" replace />;
    }

    if (role === "user" && isAdmin) {
        return <Navigate to="/admin" replace />;
    }

    return <>{children}</>;
}
