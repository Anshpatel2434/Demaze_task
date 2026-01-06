import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type ToastVariant = "success" | "error" | "info";

export type Toast = {
	id: string;
	variant: ToastVariant;
	message: string;
	createdAt: number;
	dedupeKey: string;
	durationMs: number;
};

type ToastState = {
	toasts: Toast[];
};

const initialState: ToastState = {
	toasts: [],
};

type AddToastPayload = {
	variant: ToastVariant;
	message: string;
	dedupeKey?: string;
	durationMs?: number;
	id?: string;
};

export const toastSlice = createSlice({
	name: "toast",
	initialState,
	reducers: {
		addToast: (state, action: PayloadAction<AddToastPayload>) => {
			const dedupeKey = action.payload.dedupeKey ?? `${action.payload.variant}:${action.payload.message}`;
			if (state.toasts.some((t) => t.dedupeKey === dedupeKey)) return;

			const id = action.payload.id ?? globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
			state.toasts.push({
				id,
				variant: action.payload.variant,
				message: action.payload.message,
				createdAt: Date.now(),
				dedupeKey,
				durationMs: action.payload.durationMs ?? 3500,
			});

			if (state.toasts.length > 4) state.toasts.shift();
		},
		removeToast: (state, action: PayloadAction<string>) => {
			state.toasts = state.toasts.filter((t) => t.id !== action.payload);
		},
		clearToasts: (state) => {
			state.toasts = [];
		},
	},
});

export const { addToast, removeToast, clearToasts } = toastSlice.actions;
export default toastSlice.reducer;
