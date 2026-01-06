import { useEffect, useMemo, useRef, useState } from "react";
import type { UserProfile } from "../../../types";
import { useListUserProfilesQuery, PAGE_SIZE } from "../../../services/appApi";
import { Input } from "../../../components/ui/Input";
import { Skeleton } from "../../../components/ui/Skeleton";
import { EmptyState } from "../../../components/ui/EmptyState";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { endDragUser, startDragUser } from "../../../store/slices/dndSlice";

type Props = {
    selectedUserId: string | null;
    onSelect: (user: UserProfile) => void;
};

export function UserList({ selectedUserId, onSelect }: Props) {
    const dispatch = useAppDispatch();
    const { locked, draggingUserId } = useAppSelector((s) => s.dnd);

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [offset, setOffset] = useState(0);

    const searchTimerRef = useRef<number | null>(null);

    useEffect(() => {
        if (searchTimerRef.current) window.clearTimeout(searchTimerRef.current);
        searchTimerRef.current = window.setTimeout(() => {
            setDebouncedSearch(search);
        }, 350);

        return () => {
            if (searchTimerRef.current) window.clearTimeout(searchTimerRef.current);
        };
    }, [search]);

    const args = useMemo(
        () => ({ searchEmail: debouncedSearch.trim() || undefined, offset, limit: PAGE_SIZE }),
        [debouncedSearch, offset]
    );

    const { data, isLoading, isFetching, isError, refetch } = useListUserProfilesQuery(args);
    const items = data?.items ?? [];
    const nextOffset = data?.nextOffset ?? null;

    const canLoadMore = Boolean(nextOffset) && !isFetching;

    const sentinelRef = useRef<HTMLLIElement | null>(null);
    const scrollContainerRef = useRef<HTMLUListElement | null>(null);

    useEffect(() => {
        if (!canLoadMore) return;
        const el = sentinelRef.current;
        const container = scrollContainerRef.current;
        if (!el || !container) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (!entries[0]?.isIntersecting) return;
                if (nextOffset == null) return;
                setOffset(nextOffset);
            },
            { root: container, rootMargin: "200px" }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [canLoadMore, nextOffset]);

    return (
        <div className="space-y-3">
            <Input
                label="Search users"
                placeholder="Search by email…"
                value={search}
                onChange={(e) => {
                    setSearch(e.target.value);
                    setOffset(0);
                }}
            />

            {isLoading ? (
                <div className="space-y-2">
                    {Array.from({ length: 6 }).map((_, idx) => (
                        <Skeleton key={idx} className="h-10 w-full" />
                    ))}
                </div>
            ) : null}

            {isError ? (
                <EmptyState
                    title="Couldn't load users"
                    description="Please retry."
                    action={
                        <button
                            onClick={() => refetch()}
                            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-100 hover:bg-white/10"
                        >
                            Retry
                        </button>
                    }
                />
            ) : null}

            {!isLoading && !isError && items.length === 0 ? (
                <EmptyState title="No users found" description="Try a different email search." />
            ) : null}

            <ul ref={scrollContainerRef} className="flex-1 space-y-2 overflow-auto pr-1">
                {items.map((u) => {
                    const selected = u.id === selectedUserId;
                    const isDragging = draggingUserId === u.id;

                    return (
                        <li key={u.id}>
                            <button
                                draggable={!locked}
                                onDragStart={(e) => {
                                    dispatch(startDragUser(u.id));
                                    e.dataTransfer.setData("application/json", JSON.stringify(u));
                                    e.dataTransfer.effectAllowed = "move";
                                }}
                                onDragEnd={() => dispatch(endDragUser())}
                                onClick={() => onSelect(u)}
                                className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition focus:outline-none focus:ring-2 focus:ring-indigo-400/20 ${
                                    selected
                                        ? "border-indigo-400/60 bg-indigo-500/10"
                                        : "border-white/10 bg-slate-950/30 hover:bg-slate-950/50"
                                } ${locked ? "cursor-not-allowed opacity-70" : "cursor-grab"} ${
                                    isDragging ? "ring-2 ring-indigo-400/30" : ""
                                }`}
                            >
                                <div className="min-w-0">
                                    <p className="truncate font-medium text-slate-100">{u.email}</p>
                                    <p className="truncate text-xs text-slate-400">{u.full_name ?? "—"}</p>
                                </div>
                                {u.is_admin ? (
                                    <span className="rounded-full bg-indigo-500/15 px-2 py-1 text-xs text-indigo-200">
                                        Admin
                                    </span>
                                ) : null}
                            </button>
                        </li>
                    );
                })}
                <li aria-hidden ref={sentinelRef} />
            </ul>

            {isFetching && !isLoading ? (
                <div className="space-y-2">
                    {Array.from({ length: 2 }).map((_, idx) => (
                        <Skeleton key={idx} className="h-10 w-full" />
                    ))}
                </div>
            ) : null}
        </div>
    );
}
