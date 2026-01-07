import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Project, UserProfile } from "../../../types";
import { PAGE_SIZE, useListProjectsQuery, useUpdateProjectMutation, useListUserProfilesQuery } from "../../../services/appApi";
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
    onKnownUsersChange: (users: UserProfile[]) => void;
    showToast: ShowToast;
};

export function AdminProjectList({ knownUsers, onKnownUsersChange, showToast }: Props) {
    const dispatch = useAppDispatch();
    const { locked, draggingUserId, updatingProjectId } = useAppSelector((s) => s.dnd);

    const [offset, setOffset] = useState(0);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);

    const args = useMemo(() => ({ offset, limit: PAGE_SIZE }), [offset]);
    const { data, isLoading, isFetching, isError, refetch } = useListProjectsQuery(args);
    const items = data?.items ?? [];
    const nextOffset = data?.nextOffset ?? null;

    // Get unique assigned user IDs from projects
    const assignedUserIds = useMemo(() => {
        const ids = new Set<string>();
        items.forEach(project => {
            if (project.assigned_user_id) {
                ids.add(project.assigned_user_id);
            }
        });
        return Array.from(ids);
    }, [items]);

    // Fetch users that are not in knownUsers yet
    const { data: newUsersData } = useListUserProfilesQuery({
        offset: 0,
        limit: 100,
    });

    // Update knownUsers when we find new assigned users
    useEffect(() => {
        if (!newUsersData?.items) return;
        
        const currentKnownIds = new Set(knownUsers.map(u => u.id));
        const newUsers = newUsersData.items.filter(user => 
            assignedUserIds.includes(user.id) && !currentKnownIds.has(user.id)
        );

        if (newUsers.length > 0) {
            onKnownUsersChange([...knownUsers, ...newUsers]);
        }
    }, [newUsersData?.items, assignedUserIds, knownUsers, onKnownUsersChange]);

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
        <div className="flex min-h-0 flex-1 flex-col gap-2">
            <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold text-slate-700">Projects</h2>
                <p className="text-xs text-slate-500">{items.length}</p>
            </div>

            {isError ? (
                <EmptyState
                    title="Couldn't load projects"
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
                <EmptyState title="No projects" description="Create a project to get started." />
            ) : null}

            <div ref={scrollContainerRef} className="min-h-0 flex-1 overflow-y-auto pr-1">
                <div className="grid gap-3 sm:grid-cols-2">
                    {isLoading
                        ? Array.from({ length: 6 }).map((_, idx) => (
                              <Skeleton key={idx} className="h-24 w-full" />
                          ))
                        : items.map((p) => {
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
                                      className={`relative cursor-pointer rounded-xl border p-3 transition ${
                                          isDropTarget
                                              ? "border-indigo-300 bg-indigo-50 ring-2 ring-indigo-400/10"
                                              : "border-slate-200 bg-white hover:border-indigo-200"
                                      } ${locked ? "opacity-70" : ""}`}
                                  >
                                      {isUpdating ? (
                                          <div className="absolute inset-0 z-10 grid place-items-center rounded-xl bg-white/70">
                                              <div className="flex items-center gap-2 text-sm text-slate-900">
                                                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900/20 border-t-slate-900" />
                                                  Assigning…
                                              </div>
                                          </div>
                                      ) : null}

                                      <div className="flex items-start justify-between gap-3">
                                          <div className="min-w-0">
                                              <p className="truncate text-sm font-semibold text-slate-900">{p.title}</p>
                                              <p className="mt-1 line-clamp-2 text-sm text-slate-600">{p.description ?? "—"}</p>
                                          </div>
                                          <span
                                              className={`shrink-0 rounded-full px-2 py-1 text-xs ${
                                                  p.is_completed
                                                      ? "bg-emerald-100 text-emerald-800"
                                                      : "bg-amber-100 text-amber-800"
                                              }`}
                                          >
                                              {p.is_completed ? "Completed" : "In progress"}
                                          </span>
                                      </div>

                                      <div className="mt-2 flex items-center justify-between gap-3">
                                          <p className="text-xs text-slate-500">
                                              Assigned:{" "}
                                              <span className="text-slate-700">
                                                  {p.assigned_user_id ? findUserEmail(knownUsers, p.assigned_user_id) : "Unassigned"}
                                              </span>
                                          </p>
                                          {isDropTarget ? (
                                              <p className="text-xs text-indigo-700">Drop user to assign</p>
                                          ) : null}
                                      </div>
                                  </div>
                              );
                          })}
                </div>

                <div ref={sentinelRef} />
            </div>

            {isFetching && !isLoading ? (
                <div className="grid gap-3 sm:grid-cols-2">
                    {Array.from({ length: 4 }).map((_, idx) => (
                        <Skeleton key={idx} className="h-24 w-full" />
                    ))}
                </div>
            ) : null}

            {selectedProject && (
                <EditProjectModal
                    isOpen={true}
                    onClose={() => setSelectedProject(null)}
                    project={selectedProject}
                    users={knownUsers}
                    showToast={showToast}
                />
            )}
        </div>
    );
}
