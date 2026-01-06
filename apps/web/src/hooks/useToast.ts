import { addToast, type ToastVariant } from "../store/slices/toastSlice";
import { useAppDispatch } from "../store/hooks";

export function useToast() {
	const dispatch = useAppDispatch();

	return {
		push: (variant: ToastVariant, message: string, dedupeKey?: string) => {
			dispatch(addToast({ variant, message, dedupeKey }));
		},
		success: (message: string, dedupeKey?: string) => {
			dispatch(addToast({ variant: "success", message, dedupeKey }));
		},
		error: (message: string, dedupeKey?: string) => {
			dispatch(addToast({ variant: "error", message, dedupeKey }));
		},
		info: (message: string, dedupeKey?: string) => {
			dispatch(addToast({ variant: "info", message, dedupeKey }));
		},
	};
}
