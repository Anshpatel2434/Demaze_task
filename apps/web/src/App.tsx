import { useEffect } from "react";
import { AuthPage } from "./pages/auth/Page/AuthPage";
import { supabase } from "./services/apiClient";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import AdminPage from "./pages/admin/Page/AdminPage";
import UserDashboard from "./pages/user_dashboard/Page/UserDashboard";

function App() {

	useEffect(() => {
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((event) => {
			console.log("AUTH EVENT:", event);
		});

		return () => subscription.unsubscribe();
	}, []);

	return (

		<Router>
			<Routes>
				<Route path="/auth" element={<AuthPage/>}/>
				<Route path="/admin" element={<AdminPage/>}/>
				<Route path="/dashboard" element={<UserDashboard/>}/>
			</Routes>
		</Router>
	);
}

export default App;
