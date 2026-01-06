import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Project, UserProfile } from "../../../types";
import { PAGE_SIZE, useListProjectsQuery, useUpdateProjectMutation } from "../../../services/appApi";
import { Skeleton } from "../../../components/ui/Skeleton";
import { EmptyState } from "../../../components/ui/EmptyState";
import { EditProjectModal } from "../../../components/ui/EditProjectModal";
import type { ShowToast } from "../../../App";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { endDragUser, lockDnd, unlockDnd } from "../../../store/slices/dndSlice";

function findUserEmail(users: UserProfile[], id: string) {
    return users.find((u) => u.id === id)?.email ?? id.slice(0, 8);
}

type Props = {
    knownUsers: UserProfile[];
    showToast: ShowToast;
};

export function AdminProjectList({ knownUsers, showToast }: Props) {
    const dispatch = useAppDispatch();
    const { locked, draggingUserId, updatingProjectId } = useAppSelector((s) => s.dnd);

    const [offset, setOffset] = useState(0);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);

    const args = useMemo(() => ({ offset, limit: PAGE_SIZE }), [offset]);
    const { data, isLoading, isFetching, isError, refetch } = useListProjectsQuery(args);
    const items = data?.items ?? [];
    const nextOffset = data?.nextOffset ?? null;

    const canLoadMore = Boolean(nextOffset) && !isFetching;

    const sentinelRef = useRef<HTMLDivElement | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement | null>(null);

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

    const [updateProject] = useUpdateProjectMutation();

    const handleDrop = useCallback(
        async (e: React.DragEvent, project: Project) => {
            e.preventDefault();
            if (locked) return;

            const payload = e.dataTransfer.getData("application/json");
            if (!payload) return;

            let draggedUser: UserProfile;
            try {
                draggedUser = JSON.parse(payload) as UserProfile;
            } catch {
                return;
            }

            if (draggedUser.id !== draggingUserId) return;
            if (draggedUser.id === project.assigned_user_id) return;

            dispatch(lockDnd(project.id));
            try {
                await updateProject({
                    id: project.id,
                    patch: { assigned_user_id: draggedUser.id },
                    optimisticProject: project,
                }).unwrap();
                showToast("success", `Assigned to ${draggedUser.email}`);
            } catch (err) {
                const message = (err as { data?: string })?.data ?? "Failed to assign project";
                showToast("error", message);
            } finally {
                dispatch(unlockDnd());
                dispatch(endDragUser());
            }
        },
        [dispatch, draggingUserId, locked, showToast, updateProject]
    );

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-100">Projects</h2>
                <p className="text-xs text-slate-400">{items.length}</p>
            </div>

            {isLoading ? (
                <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, idx) => (
                        <Skeleton key={idx} className="h-28 w-full" />
                    ))}
                </div>
            ) : null}

            {isError ? (
                <EmptyState
                    title="Couldn't load projects"
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
                <EmptyState title="No projects" description="Create a project to get started." />
            ) : null}

            <div ref={scrollContainerRef} className="flex-1 space-y-3 overflow-y-auto">
                {items.map((p) => {
                    const isUpdating = updatingProjectId === p.id;
                    const isDropTarget = draggingUserId !== null && !locked;

                    return (
                        <div
                            key={p.id}
                            onDragOver={(e) => {
                                if (isDropTarget) e.preventDefault();
                            }}
                            onDrop={(e) => handleDrop(e, p)}
                            onClick={() => setSelectedProject(p)}
                            className={`relative cursor-pointer rounded-2xl border p-4 shadow-sm transition hover:border-indigo-400/40 ${
                                isDropTarget
                                    ? "border-indigo-400/60 bg-slate-950/60 ring-2 ring-indigo-400/20"
                                    : "border-white/10 bg-slate-950/40"
                            } ${locked ? "opacity-70" : ""}`}
                        >
                            {isUpdating ? (
                                <div className="absolute inset-0 z-10 grid place-items-center rounded-2xl bg-slate-950/70">
                                    <div className="flex items-center gap-2 text-sm text-slate-100">
                                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                        Assigning…
                                    </div>
                                </div>
                            ) : null}

                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-slate-100">{p.title}</p>
                                    <p className="mt-1 line-clamp-2 text-sm text-slate-400">
                                        {p.description ?? "—"}
                                    </p>
                                </div>
                                <span
                                    className={`shrink-0 rounded-full px-2 py-1 text-xs ${
                                        p.is_completed
                                            ? "bg-emerald-500/15 text-emerald-200"
                                            : "bg-amber-500/15 text-amber-200"
                                    }`}
                                >
                                    {p.is_completed ? "Completed" : "In progress"}
                                </span>
                            </div>

                            <div className="mt-3 flex items-center justify-between gap-3">
                                <p className="text-xs text-slate-400">
                                    Assigned:{" "}
                                    <span className="text-slate-200">{findUserEmail(knownUsers, p.assigned_user_id)}</span>
                                </p>
                                {isDropTarget ? (
                                    <p className="text-xs text-indigo-300">Drop user to assign</p>
                                ) : null}
                            </div>
                        </div>
                    );
                })}
                <div ref={sentinelRef} />
            </div>


            {isFetching && !isLoading ? (
                <div className="space-y-3">
                    {Array.from({ length: 2 }).map((_, idx) => (
                        <Skeleton key={idx} className="h-28 w-full" />
                    ))}
                </div>
            ) : null}

            {selectedProject && (
                <EditProjectModal
                    isOpen={true}
                    onClose={() => setSelectedProject(null)}
                    project={selectedProject}
                    showToast={showToast}
                />
            )}
        </div>
    );
}
