import { useEffect, useRef } from "react";

type Params = {
    enabled: boolean;
    onLoadMore: () => void;
    rootMargin?: string;
};

export function useInfiniteScroll({ enabled, onLoadMore, rootMargin = "200px" }: Params) {
    const ref = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (!enabled) return;
        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) onLoadMore();
            },
            { root: null, rootMargin }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [enabled, onLoadMore, rootMargin]);

    return ref;
}
