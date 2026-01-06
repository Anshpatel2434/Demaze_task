import { useEffect, useState } from "react";
import {
	useFetchUserQuery,
	useLoginMutation,
	useSignUpMutation,
} from "../redux_usecases/authApi";
import { LoginButton } from "../components/LoginButton";

type otpType = string;

export const AuthPage = () => {
	// 1. Local state for form inputs
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isLoginMode, setIsLoginMode] = useState(true); // Toggle between Login and Sign Up

	// 2. The Mutation Hooks
	// The first item (login) is the TRIGGER function.
	// The second item is an object with status flags (isLoading, error, etc.)
	const [login, { isLoading: isLoggingIn }] = useLoginMutation();
	const [signUp, { isLoading: isSigningUp }] = useSignUpMutation();

	const { data } = useFetchUserQuery();
	const [user, setUser] = useState<any>(data);
	useEffect(() => {
		setUser(data);
	}, [data]);

	const handleAuth = async (e: React.FormEvent) => {
		e.preventDefault();

		try {
			// 3. Call the appropriate mutation
			// We use .unwrap() to extract the payload or throw an error immediately
			// This makes standard try/catch blocks work perfectly!
			if (isLoginMode) {
				await login({ email, password }).unwrap();
				alert("Logged in successfully!");
			} else {
				await signUp({ email, password }).unwrap();
				alert("Signed Up successfully!");
			}

			// Clear inputs
			setEmail("");
			setPassword("");
		} catch (err: any) {
			console.error("Failed:", err);
			alert(err.data || "Something went wrong");
		}
	};

	const isLoading = isLoggingIn || isSigningUp;

	console.log(
		"So are you telling me that we already have the user present on every refresh here ? "
	);
	console.log(user);

	return (
		<div className="max-w-md mx-auto mt-10 p-6 border rounded-lg shadow-lg bg-white">
			<h2 className="text-2xl font-bold mb-4 text-center">
				{isLoginMode ? "Welcome Back" : "Create Account"}
			</h2>

			<form onSubmit={handleAuth} className="space-y-4">
				<div>
					<label className="block text-sm font-medium text-gray-700">
						Email
					</label>
					<input
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						className="mt-1 block w-full p-2 border rounded shadow-sm"
						required
					/>
				</div>
				<div>
					<label className="block text-sm font-medium text-gray-700">
						Password
					</label>
					<input
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						className="mt-1 block w-full p-2 border rounded shadow-sm"
						required
					/>
				</div>

				<button
					type="submit"
					disabled={isLoading}
					className="w-full bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700 disabled:opacity-50"
				>
					{isLoading ? "Processing..." : isLoginMode ? "Log In" : "Sign Up"}
				</button>
			</form>

			<div className="mt-4 text-center">
				<button
					onClick={() => setIsLoginMode(!isLoginMode)}
					className="text-sm text-indigo-600 hover:underline"
				>
					{isLoginMode
						? "Don't have an account? Sign Up"
						: "Already have an account? Log In"}
				</button>
			</div>

			<div className="relative my-6">
				<div className="absolute inset-0 flex items-center">
					<div className="w-full border-t border-gray-300"></div>
				</div>
			</div>
		</div>
	);
};
