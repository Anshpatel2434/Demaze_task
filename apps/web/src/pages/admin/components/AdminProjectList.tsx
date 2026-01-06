import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Project, UserProfile } from "../../../types";
import { PAGE_SIZE, useListProjectsQuery, useUpdateProjectMutation } from "../../../services/appApi";
import { Skeleton } from "../../../components/ui/Skeleton";
import { EmptyState } from "../../../components/ui/EmptyState";
import type { ShowToast } from "../../../App";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { lockDnd, unlockDnd } from "../../../store/slices/dndSlice";

function findUserEmail(users: UserProfile[], id: string) {
    return users.find((u) => u.id === id)?.email ?? id.slice(0, 8);
}

type Props = {
    selectedUser?: UserProfile | null;
    knownUsers: UserProfile[];
    showToast: ShowToast;
};

type ProjectSectionProps = {
    title: string;
    isCompleted: boolean;
    knownUsers: UserProfile[];
    showToast: ShowToast;
};

function ProjectSection({ title, isCompleted, knownUsers, showToast }: ProjectSectionProps) {
    const dispatch = useAppDispatch();
    const { draggingUserId, locked } = useAppSelector((s) => s.dnd);
    const [offset, setOffset] = useState(0);

    const args = useMemo(() => ({ offset, limit: PAGE_SIZE, isCompleted }), [offset, isCompleted]);
    const { data, isLoading, isFetching, isError, refetch } = useListProjectsQuery(args);
    const items = data?.items ?? [];
    const nextOffset = data?.nextOffset ?? null;

    const canLoadMore = Boolean(nextOffset) && !isFetching;
    const sentinelRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!canLoadMore) return;
        const el = sentinelRef.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (!entries[0]?.isIntersecting) return;
                if (nextOffset == null) return;
                setOffset(nextOffset);
            },
            { root: sentinelRef.current?.parentElement, rootMargin: "200px" }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [canLoadMore, nextOffset]);

    const [updateProject] = useUpdateProjectMutation();

    const onDrop = useCallback(
        async (e: React.DragEvent, project: Project) => {
            e.preventDefault();
            if (!draggingUserId || locked) return;

            const payload = e.dataTransfer.getData("application/json");
            if (!payload) return;

            let droppedUser: UserProfile;
            try {
                droppedUser = JSON.parse(payload) as UserProfile;
            } catch {
                return;
            }

            if (droppedUser.id !== draggingUserId) return;
            if (droppedUser.id === project.assigned_user_id) return;
            if (isCompleted) {
                showToast("info", "Can only assign users to in-progress projects.");
                return;
            }

            dispatch(lockDnd(project.id));
            try {
                await updateProject({
                    id: project.id,
                    patch: { assigned_user_id: droppedUser.id },
                }).unwrap();
                showToast("success", `Project assigned to ${droppedUser.email}`);
            } catch (err) {
                const message = (err as { data?: string })?.data ?? "Failed to assign project";
                showToast("error", message);
            } finally {
                dispatch(unlockDnd());
            }
        },
        [dispatch, draggingUserId, locked, isCompleted, showToast, updateProject]
    );

    const onDragOver = useCallback((e: React.DragEvent) => {
        if (!locked && draggingUserId && !isCompleted) {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
        }
    }, [locked, draggingUserId, isCompleted]);

    return (
        <div className="flex h-full flex-col">
            <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-700">{title}</h2>
                <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                    {items.length}
                </span>
            </div>

            {isLoading ? (
                <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, idx) => (
                        <Skeleton key={idx} className="h-24 w-full" />
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
                            className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 hover:bg-gray-50"
                        >
                            Retry
                        </button>
                    }
                />
            ) : null}

            {!isLoading && !isError && items.length === 0 ? (
                <EmptyState
                    title="No projects"
                    description={isCompleted ? "Completed projects will appear here." : "Create a project to get started."}
                />
            ) : null}

            <div className="flex flex-1 flex-col gap-3 overflow-auto pr-1">
                {items.map((p) => (
                    <div
                        key={p.id}
                        onDragOver={onDragOver}
                        onDrop={(e) => onDrop(e, p)}
                        className={`group relative rounded-xl border bg-white p-4 shadow-sm transition ${
                            !isCompleted && draggingUserId && !locked
                                ? "border-blue-400 hover:border-blue-500 hover:shadow-md"
                                : "border-gray-200"
                        }`}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-gray-900">{p.title}</p>
                                <p className="mt-1 line-clamp-2 text-sm text-gray-500">{p.description ?? "—"}</p>
                            </div>
                            <span
                                className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${
                                    p.is_completed
                                        ? "bg-green-100 text-green-700"
                                        : "bg-amber-100 text-amber-700"
                                }`}
                            >
                                {p.is_completed ? "Completed" : "In Progress"}
                            </span>
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                            <p className="text-xs text-gray-500">
                                Assigned: <span className="font-medium text-gray-700">{findUserEmail(knownUsers, p.assigned_user_id)}</span>
                            </p>
                            {!isCompleted && draggingUserId && !locked && (
                                <span className="text-xs text-blue-600">Drop to assign</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div ref={sentinelRef} />

            {isFetching && !isLoading ? (
                <div className="space-y-3">
                    {Array.from({ length: 2 }).map((_, idx) => (
                        <Skeleton key={idx} className="h-24 w-full" />
                    ))}
                </div>
            ) : null}
        </div>
    );
}

export function AdminProjectList({ knownUsers, showToast }: Props) {
    return (
        <div className="flex h-[600px] gap-4">
            <div className="flex-1 overflow-hidden">
                <ProjectSection
                    title="In Progress"
                    isCompleted={false}
                    knownUsers={knownUsers}
                    showToast={showToast}
                />
            </div>
            <div className="flex-1 overflow-hidden">
                <ProjectSection
                    title="Completed"
                    isCompleted={true}
                    knownUsers={knownUsers}
                    showToast={showToast}
                />
            </div>
        </div>
    );
}
