import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { removeToast } from "../../store/slices/toastSlice";

const variantStyles: Record<string, string> = {
	success: "border-emerald-400/60 bg-emerald-950/30 text-emerald-50",
	error: "border-rose-400/60 bg-rose-950/30 text-rose-50",
	info: "border-sky-400/60 bg-sky-950/30 text-sky-50",
};

export function ToastViewport() {
	const dispatch = useAppDispatch();
	const toasts = useAppSelector((s) => s.toast.toasts);

	useEffect(() => {
		if (toasts.length === 0) return;
		const timers = toasts.map((t) =>
			window.setTimeout(() => dispatch(removeToast(t.id)), t.durationMs)
		);
		return () => timers.forEach((id) => window.clearTimeout(id));
	}, [dispatch, toasts]);

	return (
		<div className="fixed right-4 top-4 z-50 flex w-[min(420px,calc(100vw-2rem))] flex-col gap-3">
			{toasts.map((t) => (
				<div
					key={t.id}
					role="status"
					className={`flex items-start justify-between gap-4 rounded-xl border p-4 shadow-lg backdrop-blur ${variantStyles[t.variant] ?? variantStyles.info}`}
				>
					<p className="text-sm leading-5">{t.message}</p>
					<button
						onClick={() => dispatch(removeToast(t.id))}
						className="rounded-md px-2 py-1 text-xs text-white/80 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/30"
						aria-label="Dismiss notification"
					>
						Dismiss
					</button>
				</div>
			))}
		</div>
	);
}
