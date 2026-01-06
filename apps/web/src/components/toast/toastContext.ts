import { createContext, useContext } from "react";

export type ToastVariant = "success" | "error" | "info";

export type Toast = {
    id: string;
    variant: ToastVariant;
    message: string;
    createdAt: number;
    dedupeKey: string;
    durationMs: number;
};

export type ToastInput = {
    variant: ToastVariant;
    message: string;
    durationMs?: number;
    id?: string;
    dedupeKey?: string;
};

type ToastContextValue = {
    toasts: Toast[];
    add: (toast: ToastInput) => void;
    remove: (id: string) => void;
    clear: () => void;
};

export const ToastContext = createContext<ToastContextValue | null>(null);

export function useToastContext() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useToastContext must be used within ToastProvider");
    return ctx;
}
