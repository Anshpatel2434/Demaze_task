import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { useLoginMutation, useSignUpMutation } from "../redux_usecases/authApi";
import { useBootstrapAuthQuery } from "../../../services/appApi";
import { Card } from "../../../components/ui/Card";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import type { ShowToast } from "../../../App";

type Props = {
    showToast: ShowToast;
};

export const AuthPage = ({ showToast }: Props) => {
    const { data: bootstrap, isLoading: isBootstrapping } = useBootstrapAuthQuery();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoginMode, setIsLoginMode] = useState(true);

    const [login, { isLoading: isLoggingIn }] = useLoginMutation();
    const [signUp, { isLoading: isSigningUp }] = useSignUpMutation();

    const redirectTo = useMemo(() => {
        if (!bootstrap?.userId || !bootstrap.profile) return null;
        return bootstrap.profile.is_admin ? "/admin" : "/dashboard";
    }, [bootstrap?.profile, bootstrap?.userId]);

    const isLoading = isLoggingIn || isSigningUp;

    const submitTimerRef = useRef<number | null>(null);

    const onSubmit = async () => {
        try {
            if (isLoginMode) {
                await login({ email, password }).unwrap();
                showToast("success", "Welcome back.");
            } else {
                await signUp({ email, password }).unwrap();
                showToast("success", "Account created — check your email if confirmation is enabled.");
            }
            setEmail("");
            setPassword("");
        } catch (err) {
            const message = (err as { data?: string })?.data ?? "Authentication failed";
            showToast("error", message);
        }
    };

    useEffect(() => {
        return () => {
            if (submitTimerRef.current) window.clearTimeout(submitTimerRef.current);
        };
    }, []);

    if (redirectTo) return <Navigate to={redirectTo} replace />;

    return (
        <div className="mx-auto flex min-h-dvh w-full max-w-md items-center px-5 py-10">
            <div className="w-full space-y-4">
                <div className="space-y-1 text-center">
                    <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
                        {isLoginMode ? "Sign in" : "Create your account"}
                    </h1>
                    <p className="text-sm text-gray-500">
                        {isLoginMode
                            ? "Use your email and password to continue."
                            : "Create an account to receive and manage your assigned projects."}
                    </p>
                </div>

                <Card>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (isLoading) return;

                            if (submitTimerRef.current) window.clearTimeout(submitTimerRef.current);
                            submitTimerRef.current = window.setTimeout(() => {
                                void onSubmit();
                            }, 250);
                        }}
                        className="space-y-4"
                    >
                        <Input
                            label="Email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={isLoading || isBootstrapping}
                            placeholder="name@company.com"
                        />
                        <Input
                            label="Password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={isLoading || isBootstrapping}
                            placeholder="••••••••"
                        />

                        <Button type="submit" className="w-full" isLoading={isLoading} disabled={isBootstrapping}>
                            {isLoginMode ? "Sign in" : "Create account"}
                        </Button>

                        <div className="relative py-2">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200" />
                            </div>
                        </div>
                    </form>
                </Card>

                <div className="text-center">
                    <button
                        type="button"
                        onClick={() => setIsLoginMode((v) => !v)}
                        className="text-sm text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300"
                        disabled={isLoading}
                    >
                        {isLoginMode ? "Need an account? Sign up" : "Already have an account? Sign in"}
                    </button>
                </div>
            </div>
        </div>
    );
};
