import { useCallback, useState } from "react";
import type { Project, UserProfile } from "../../../types";
import { useUpdateProjectMutation } from "../../../services/appApi";
import type { ShowToast } from "../../../App";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { lockDnd, unlockDnd } from "../../../store/slices/dndSlice";

function findUserEmail(users: UserProfile[], id: string) {
    return users.find((u) => u.id === id)?.email ?? id.slice(0, 8);
}

type Props = {
    project: Project;
    knownUsers: UserProfile[];
    selectedUser: UserProfile | null;
    showToast: ShowToast;
    allowDragAssign: boolean;
};

export function AdminProjectCard({ project, knownUsers, selectedUser, showToast, allowDragAssign }: Props) {
    const dispatch = useAppDispatch();
    const { locked } = useAppSelector((s) => s.dnd);
    const [updateProject, { isLoading: isAssigning }] = useUpdateProjectMutation();

    const onDrop = useCallback(
        async (e: React.DragEvent) => {
            if (!allowDragAssign || !selectedUser || locked) return;

            const userId = e.dataTransfer.getData("application/user-id");
            if (!userId || userId === project.assigned_user_id) return;

            dispatch(lockDnd(project.id));
            try {
                await updateProject({
                    id: project.id,
                    patch: { assigned_user_id: userId },
                }).unwrap();
                showToast("success", "Assignment updated.");
            } catch (err) {
                const message = (err as { data?: string })?.data ?? "Failed to assign project";
                showToast("error", message);
            } finally {
                dispatch(unlockDnd());
            }
        },
        [allowDragAssign, dispatch, locked, project.assigned_user_id, project.id, selectedUser, showToast, updateProject]
    );

    const onDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
    }, []);

    const [isDraggingOver, setIsDraggingOver] = useState(false);

    return (
        <div
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragEnter={() => setIsDraggingOver(true)}
            onDragLeave={() => setIsDraggingOver(false)}
            className={`relative rounded-lg border bg-white p-4 shadow-sm transition-all hover:shadow-md ${
                allowDragAssign
                    ? "border-gray-200 hover:border-gray-300"
                    : "border-gray-100 bg-gray-50 opacity-90"
            } ${
                isDraggingOver && allowDragAssign
                    ? "ring-2 ring-blue-400 ring-offset-2"
                    : ""
            }`}
        >
            {isAssigning ? (
                <div className="absolute inset-0 z-10 grid place-items-center rounded-lg bg-white/70 backdrop-blur-sm">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-blue-500" />
                        Updating…
                    </div>
                </div>
            ) : null}

            <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h3 className="truncate text-base font-medium text-gray-900">{project.title}</h3>
                        {project.description ? (
                            <p className="mt-1 line-clamp-2 text-sm text-gray-600">{project.description}</p>
                        ) : null}
                    </div>
                    <span
                        className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${
                            project.is_completed
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                        }`}
                    >
                        {project.is_completed ? "Completed" : "In Progress"}
                    </span>
                </div>

                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                        Assigned: <span className="font-medium text-gray-900">{findUserEmail(knownUsers, project.assigned_user_id)}</span>
                    </p>
                    {allowDragAssign && selectedUser ? (
                        <div className="text-xs text-blue-600">Drop user here to assign</div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}