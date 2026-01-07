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
    setKnownUsers: (users: UserProfile[]) => void;
};

export function UserList({ selectedUserId, onSelect, setKnownUsers }: Props) {
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

    useEffect(() => {
        if(data){
            setKnownUsers(items)
        }
    }, [data])

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
        <div className="flex min-h-0 flex-1 flex-col gap-2">
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
                        <Skeleton key={idx} className="h-9 w-full" />
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
                            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                        >
                            Retry
                        </button>
                    }
                />
            ) : null}

            {!isLoading && !isError && items.length === 0 ? (
                <EmptyState title="No users found" description="Try a different email search." />
            ) : null}

            <ul ref={scrollContainerRef} className="min-h-0 flex-1 space-y-1 overflow-auto pr-1">
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
                                className={`flex w-full items-center justify-between rounded-lg border px-3 py-1.5 text-left text-sm transition focus:outline-none focus:ring-2 focus:ring-indigo-400/15 ${
                                    selected
                                        ? "border-indigo-300 bg-indigo-50"
                                        : "border-slate-200 bg-white hover:bg-slate-50"
                                } ${locked ? "cursor-not-allowed opacity-70" : "cursor-grab"} ${
                                    isDragging ? "ring-2 ring-indigo-400/20" : ""
                                }`}
                            >
                                <div className="min-w-0">
                                    <p className="truncate font-medium text-slate-900">{u.email}</p>
                                    <p className="truncate text-xs text-slate-500">{u.full_name ?? "—"}</p>
                                </div>
                                {u.is_admin ? (
                                    <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-800">
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
                        <Skeleton key={idx} className="h-9 w-full" />
                    ))}
                </div>
            ) : null}
        </div>
    );
}
