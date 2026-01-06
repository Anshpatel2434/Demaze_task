import { Navigate } from "react-router-dom";
import { useBootstrapAuthQuery } from "../../services/appApi";
import { Skeleton } from "../ui/Skeleton";

export function RootRedirect() {
	const { data, isLoading } = useBootstrapAuthQuery();

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

	const userId = data?.userId;
	const profile = data?.profile;

	if (!userId || !profile) {
		return <Navigate to="/auth" replace />;
	}

	const redirectPath = profile.is_admin ? "/admin" : "/dashboard";
	return <Navigate to={redirectPath} replace />;
}
