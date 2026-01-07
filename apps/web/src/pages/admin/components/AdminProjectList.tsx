import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Project, UserProfile } from "../../../types";
import { PAGE_SIZE, useListProjectsQuery, useUpdateProjectMutation, useListUserProfilesQuery } from "../../../services/appApi";
import { Skeleton } from "../../../components/ui/Skeleton";
import { Loader } from "../../../components/ui/Loader";
import { EmptyState } from "../../../components/ui/EmptyState";
import { EditProjectModal } from "../../../components/ui/EditProjectModal";
import type { ShowToast } from "../../../App";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { endDragUser, lockDnd, unlockDnd } from "../../../store/slices/dndSlice";
import { motion } from "framer-motion";
import { Folder, User, Clock, CheckCircle2, Circle, ChevronDown } from "lucide-react";

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
    const items = useMemo(() => data?.items ?? [], [data]);
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
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex min-h-0 flex-1 flex-col gap-6"
        >
            <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center justify-between"
            >
                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
                        <Folder className="h-4 w-4 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">Projects</h2>
                        <p className="text-sm text-slate-500">Manage and organize your projects</p>
                    </div>
                </div>
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 shadow-sm border border-slate-200"
                >
                    <p className="text-sm font-medium text-slate-600">{items.length}</p>
                    <span className="text-xs text-slate-400">total</span>
                </motion.div>
            </motion.div>

            {isError ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    <EmptyState
                        title="Couldn't load projects"
                        description="Please retry."
                        action={
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => refetch()}
                                className="rounded-xl border border-slate-200 bg-gradient-to-r from-white to-slate-50 px-6 py-3 text-sm font-medium text-slate-700 shadow-sm hover:from-slate-50 hover:to-slate-100 hover:shadow-md transition-all"
                            >
                                Retry
                            </motion.button>
                        }
                    />
                </motion.div>
            ) : null}

            {!isLoading && !isError && items.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <EmptyState 
                        title="No projects" 
                        description="Create a project to get started." 
                    />
                </motion.div>
            ) : null}

            <div ref={scrollContainerRef} className="min-h-0 flex-1 overflow-y-auto pr-1">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="grid gap-4 sm:grid-cols-2"
                >
                    {isLoading
                        ? Array.from({ length: 6 }).map((_, idx) => (
                              <Skeleton key={idx} className="h-32 w-full rounded-2xl" />
                          ))
                        : items.map((p, index) => {
                              const isUpdating = updatingProjectId === p.id;
                              const isDropTarget = draggingUserId !== null && !locked;

                              return (
                                  <motion.div
                                      key={p.id}
                                      initial={{ opacity: 0, y: 20 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ delay: index * 0.05, duration: 0.3 }}
                                      onDragOver={(e) => {
                                          if (isDropTarget) e.preventDefault();
                                      }}
                                      onDrop={(e) => handleDrop(e, p)}
                                      onClick={() => setSelectedProject(p)}
                                      whileHover={{ y: -4, transition: { duration: 0.2 } }}
                                      className={`relative cursor-pointer rounded-2xl border p-5 shadow-sm transition-all duration-200 ${
                                          isDropTarget
                                              ? "border-indigo-400 bg-gradient-to-br from-indigo-50 to-purple-50 ring-2 ring-indigo-400/20 shadow-lg"
                                              : "border-slate-200 bg-white hover:border-indigo-200 hover:shadow-md"
                                      } ${locked ? "opacity-70" : ""}`}
                                  >
                                      {isUpdating ? (
                                          <div className="absolute inset-0 z-10 grid place-items-center rounded-2xl bg-white/80 backdrop-blur-sm">
                                              <div className="flex items-center gap-3">
                                                  <motion.div
                                                      animate={{ rotate: 360 }}
                                                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                  >
                                                      <Clock className="h-5 w-5 text-indigo-600" />
                                                  </motion.div>
                                                  <span className="text-sm font-medium text-slate-900">Assigning...</span>
                                              </div>
                                          </div>
                                      ) : null}

                                      <div className="flex items-start justify-between gap-4">
                                          <div className="min-w-0 flex-1">
                                              <div className="flex items-center gap-2 mb-2">
                                                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-purple-600">
                                                      <Folder className="h-3 w-3 text-white" />
                                                  </div>
                                              </div>
                                              <h3 className="text-base font-semibold text-slate-900 mb-2 leading-tight">{p.title}</h3>
                                              <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                                                  {p.description || "No description provided"}
                                              </p>
                                          </div>
                                          <div className="flex flex-col items-end gap-2">
                                              <motion.span
                                                  whileHover={{ scale: 1.05 }}
                                                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${
                                                      p.is_completed
                                                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                                          : "bg-amber-100 text-amber-800 border border-amber-200"
                                                  }`}
                                              >
                                                  {p.is_completed ? (
                                                      <div className="flex items-center gap-1.5">
                                                          <CheckCircle2 className="h-3 w-3" />
                                                          Completed
                                                      </div>
                                                  ) : (
                                                      <div className="flex items-center gap-1.5">
                                                          <Circle className="h-3 w-3 fill-current" />
                                                          In Progress
                                                      </div>
                                                  )}
                                              </motion.span>
                                          </div>
                                      </div>

                                      <div className="mt-4 flex items-center justify-between gap-3 pt-4 border-t border-slate-100">
                                          <div className="flex items-center gap-2">
                                              <User className="h-4 w-4 text-slate-400" />
                                              <p className="text-sm text-slate-600">
                                                  <span className="text-slate-500">Assigned:</span>{" "}
                                                  <span className="font-medium text-slate-700">
                                                      {p.assigned_user_id ? findUserEmail(knownUsers, p.assigned_user_id) : "Unassigned"}
                                                  </span>
                                              </p>
                                          </div>
                                          {isDropTarget ? (
                                              <motion.div
                                                  initial={{ opacity: 0, scale: 0.8 }}
                                                  animate={{ opacity: 1, scale: 1 }}
                                                  className="flex items-center gap-1.5 rounded-lg bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-700"
                                              >
                                                  <ChevronDown className="h-3 w-3" />
                                                  Drop to assign
                                              </motion.div>
                                          ) : null}
                                      </div>
                                  </motion.div>
                              );
                          })}
                </motion.div>

                <div ref={sentinelRef} />
            </div>

            {isFetching && !isLoading ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-center py-8"
                >
                    <Loader size="md" text="Loading more projects..." />
                </motion.div>
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
        </motion.div>
    );
}
