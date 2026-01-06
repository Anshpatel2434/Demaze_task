import { useCallback, useMemo, useState, type PropsWithChildren } from "react";
import { ToastContext, type Toast, type ToastInput } from "./toastContext";

function generateId() {
    return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

export function ToastProvider({ children }: PropsWithChildren) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const remove = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const clear = useCallback(() => {
        setToasts([]);
    }, []);

    const add = useCallback((payload: ToastInput) => {
            setToasts((prev) => {
                const dedupeKey = payload.dedupeKey ?? `${payload.variant}:${payload.message}`;
                if (prev.some((t) => t.dedupeKey === dedupeKey)) return prev;

                const next: Toast = {
                    id: payload.id ?? generateId(),
                    variant: payload.variant,
                    message: payload.message,
                    createdAt: Date.now(),
                    dedupeKey,
                    durationMs: payload.durationMs ?? 3500,
                };

                const merged = [...prev, next];
                return merged.length > 4 ? merged.slice(merged.length - 4) : merged;
            });
    }, []);

    const value = useMemo(() => ({ toasts, add, remove, clear }), [add, clear, remove, toasts]);

    return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}
