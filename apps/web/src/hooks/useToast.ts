import { useMemo } from "react";
import { useToastContext, type ToastVariant } from "../components/toast/toastContext";

export function useToast() {
    const { add } = useToastContext();

    return useMemo(
        () => ({
            push: (variant: ToastVariant, message: string, dedupeKey?: string) => {
                add({ variant, message, dedupeKey });
            },
            success: (message: string, dedupeKey?: string) => {
                add({ variant: "success", message, dedupeKey });
            },
            error: (message: string, dedupeKey?: string) => {
                add({ variant: "error", message, dedupeKey });
            },
            info: (message: string, dedupeKey?: string) => {
                add({ variant: "info", message, dedupeKey });
            },
        }),
        [add]
    );
}
