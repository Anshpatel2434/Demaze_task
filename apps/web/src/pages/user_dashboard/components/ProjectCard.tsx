import { useMemo, useState } from "react";
import type { Project } from "../../../types";
import { ProjectSchema } from "../../../types";
import { useUpdateProjectMutation } from "../../../services/appApi";
import type { ShowToast } from "../../../App";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { endDrag, startDrag } from "../../../store/slices/dndSlice";

const EditableSchema = ProjectSchema.pick({
    title: true,
    description: true,
});

type Props = {
    project: Project;
    disabled: boolean;
    showToast: ShowToast;
};

export function ProjectCard({ project, disabled, showToast }: Props) {
    const dispatch = useAppDispatch();
    const { locked, updatingProjectId } = useAppSelector((s) => s.dnd);

    const [title, setTitle] = useState(() => project.title);
    const [description, setDescription] = useState(() => project.description ?? "");

    const isDisabled = disabled || locked;
    const isUpdating = updatingProjectId === project.id;

    const [updateProject, { isLoading: isSaving }] = useUpdateProjectMutation();

    const normalizedDescription = useMemo(() => {
        const trimmed = description.trim();
        return trimmed.length === 0 ? null : trimmed;
    }, [description]);

    const validation = useMemo(() => {
        return EditableSchema.safeParse({ title: title.trim(), description: normalizedDescription });
    }, [normalizedDescription, title]);

    const save = async () => {
        if (!validation.success) return;
        try {
            await updateProject({
                id: project.id,
                patch: { title: validation.data.title, description: validation.data.description },
            }).unwrap();
        } catch (err) {
            const message = (err as { data?: string })?.data ?? "Failed to save project";
            showToast("error", message);
        }
    };

    const showInvalid = !validation.success && (title.length > 0 || description.length > 0);

    return (
        <div
            draggable={!isDisabled && !isUpdating}
            onDragStart={(e) => {
                dispatch(startDrag(project.id));
                e.dataTransfer.setData("application/json", JSON.stringify(project));
                e.dataTransfer.effectAllowed = "move";
            }}
            onDragEnd={() => dispatch(endDrag())}
            className={`group relative rounded-2xl border border-white/10 bg-slate-950/40 p-4 shadow-sm transition hover:border-white/20 hover:bg-slate-950/60 ${
                isDisabled ? "opacity-70" : "cursor-grab"
            }`}
        >
            {isUpdating ? (
                <div className="absolute inset-0 z-10 grid place-items-center rounded-2xl bg-slate-950/70">
                    <div className="flex items-center gap-2 text-sm text-slate-100">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Updating…
                    </div>
                </div>
            ) : null}

            <div className="space-y-3">
                <div className="space-y-2">
                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Title
                    </label>
                    <input
                        disabled={isDisabled}
                        value={title}
                        onChange={(e) => {
                            setTitle(e.target.value);
                        }}
                        className={`w-full rounded-xl border bg-slate-900/40 px-3 py-2 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-indigo-400/20 disabled:cursor-not-allowed ${
                            showInvalid
                                ? "border-rose-400/60 focus:border-rose-300"
                                : "border-white/10 focus:border-indigo-400/60"
                        }`}
                        placeholder="Project title"
                    />
                </div>

                <div className="space-y-2">
                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Description
                    </label>
                    <textarea
                        disabled={isDisabled}
                        value={description}
                        onChange={(e) => {
                            setDescription(e.target.value);
                        }}
                        className="min-h-[80px] w-full resize-y rounded-xl border border-white/10 bg-slate-900/40 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-400/20 disabled:cursor-not-allowed"
                        placeholder="Optional notes…"
                    />
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>
                        {showInvalid ? "Title cannot be empty" : "Drag to move"}
                    </span>
                    {project.created_by_admin ? <span className="text-slate-500">Assigned</span> : null}
                </div>

                <div className="mt-3">
                    <button
                        disabled={isDisabled || !validation.success || isSaving}
                        onClick={() => save()}
                        className={`w-full rounded-xl border bg-slate-900/40 px-3 py-2 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-indigo-400/20 disabled:cursor-not-allowed disabled:opacity-50 ${
                            isSaving ? "border-indigo-400/60" : "border-white/10 hover:border-indigo-400/60"
                        }`}
                    >
                        {isSaving ? "Saving…" : "Save Changes"}
                    </button>
                </div>
            </div>
        </div>
    );
}