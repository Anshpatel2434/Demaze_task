import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useLoginMutation, useSignUpMutation } from "../redux_usecases/authApi";
import { useBootstrapAuthQuery } from "../../../services/appApi";
import { Card } from "../../../components/ui/Card";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { LoginButton } from "../components/LoginButton";
import { useToast } from "../../../hooks/useToast";
import { useDebouncedCallback } from "../../../hooks/useDebouncedCallback";

export const AuthPage = () => {
    const toast = useToast();
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

    const onSubmitDebounced = useDebouncedCallback(
        async () => {
            try {
                if (isLoginMode) {
                    await login({ email, password }).unwrap();
                    toast.success("Welcome back.", "auth:login:success");
                } else {
                    await signUp({ email, password }).unwrap();
                    toast.success("Account created — check your email if confirmation is enabled.", "auth:signup:success");
                }

                setEmail("");
                setPassword("");
            } catch (err) {
                const message = (err as { data?: string })?.data ?? "Authentication failed";
                toast.error(message, `auth:error:${message}`);
            }
        },
        250,
        { leading: true, trailing: false }
    );

    if (redirectTo) return <Navigate to={redirectTo} replace />;

    return (
        <div className="mx-auto flex min-h-dvh w-full max-w-md items-center px-5 py-10">
            <div className="w-full space-y-4">
                <div className="space-y-1 text-center">
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-100">
                        {isLoginMode ? "Sign in" : "Create your account"}
                    </h1>
                    <p className="text-sm text-slate-400">
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
                            onSubmitDebounced.callback();
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
                                <div className="w-full border-t border-white/10" />
                            </div>
                            <div className="relative flex justify-center">
                                <span className="bg-slate-950/0 px-2 text-xs text-slate-400">or</span>
                            </div>
                        </div>

                        <div className="flex justify-center">
                            <LoginButton disabled={isLoading || isBootstrapping} />
                        </div>
                    </form>
                </Card>

                <div className="text-center">
                    <button
                        type="button"
                        onClick={() => setIsLoginMode((v) => !v)}
                        className="text-sm text-slate-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                        disabled={isLoading}
                    >
                        {isLoginMode ? "Need an account? Sign up" : "Already have an account? Sign in"}
                    </button>
                </div>
            </div>
        </div>
    );
};
