import { useEffect } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { ToastProvider } from "./components/toast/ToastProvider";
import { ToastViewport } from "./components/toast/ToastViewport";
import { RequireRole } from "./components/auth/RequireRole";
import AdminPage from "./pages/admin/Page/AdminPage";
import { AuthPage } from "./pages/auth/Page/AuthPage";
import { authApi } from "./pages/auth/redux_usecases/authApi";
import UserDashboard from "./pages/user_dashboard/Page/UserDashboard";
import { supabase } from "./services/apiClient";
import { appApi } from "./services/appApi";
import { useAppDispatch } from "./store/hooks";

function App() {
	const dispatch = useAppDispatch();

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
		<div className="min-h-dvh bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100">
			<ToastProvider>
				<Router>
					<ToastViewport />
					<Routes>
						<Route path="/auth" element={<AuthPage />} />
						<Route
							path="/admin"
							element={
								<RequireRole role="admin">
									<AdminPage />
								</RequireRole>
							}
						/>
						<Route
							path="/dashboard"
							element={
								<RequireRole role="user">
									<UserDashboard />
								</RequireRole>
							}
						/>
					</Routes>
				</Router>
			</ToastProvider>
		</div>
	);
}

export default App;
