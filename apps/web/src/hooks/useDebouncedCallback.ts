import { useCallback, useEffect, useRef } from "react";

type Options = {
	leading?: boolean;
	trailing?: boolean;
};

export function useDebouncedCallback<TArgs extends unknown[]>(
	fn: (...args: TArgs) => void | Promise<void>,
	delayMs: number,
	options: Options = { leading: false, trailing: true }
) {
	const fnRef = useRef(fn);
	const timerRef = useRef<number | null>(null);
	const lastArgsRef = useRef<TArgs | null>(null);
	const leadingCalledRef = useRef(false);

	useEffect(() => {
		fnRef.current = fn;
	}, [fn]);

	const cancel = useCallback(() => {
		if (timerRef.current) window.clearTimeout(timerRef.current);
		timerRef.current = null;
		lastArgsRef.current = null;
		leadingCalledRef.current = false;
	}, []);

	useEffect(() => cancel, [cancel]);

	return {
		cancel,
		callback: useCallback(
			(...args: TArgs) => {
				lastArgsRef.current = args;

				if (options.leading && !leadingCalledRef.current) {
					leadingCalledRef.current = true;
					void fnRef.current(...args);
				}

				if (timerRef.current) window.clearTimeout(timerRef.current);
				timerRef.current = window.setTimeout(() => {
					timerRef.current = null;
					leadingCalledRef.current = false;
					if (options.trailing && lastArgsRef.current) {
						void fnRef.current(...lastArgsRef.current);
					}
					lastArgsRef.current = null;
				}, delayMs);
			},
			[delayMs, options.leading, options.trailing]
		),
	};
}
