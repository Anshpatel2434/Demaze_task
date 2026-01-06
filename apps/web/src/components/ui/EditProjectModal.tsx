import { useMemo, useState } from "react";
import type { Project } from "../../types";
import { ProjectSchema } from "../../types";
import { useUpdateProjectMutation } from "../../services/appApi";
import type { ShowToast } from "../../App";
import { Modal } from "./Modal";
import { Input } from "./Input";
import { Textarea } from "./Textarea";
import { Button } from "./Button";

const EditableSchema = ProjectSchema.pick({
    title: true,
    description: true,
});

type Props = {
    isOpen: boolean;
    onClose: () => void;
    project: Project;
    showToast: ShowToast;
};

export function EditProjectModal({ isOpen, onClose, project, showToast }: Props) {
    const [title, setTitle] = useState(() => project.title);
    const [description, setDescription] = useState(() => project.description ?? "");

    const [updateProject, { isLoading }] = useUpdateProjectMutation();

    const normalizedDescription = useMemo(() => {
        const trimmed = description.trim();
        return trimmed.length === 0 ? null : trimmed;
    }, [description]);

    const validation = useMemo(() => {
        return EditableSchema.safeParse({ title: title.trim(), description: normalizedDescription });
    }, [normalizedDescription, title]);

    const canSubmit = validation.success && (title.trim() !== project.title || normalizedDescription !== project.description);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validation.success) {
            showToast("error", "Title cannot be empty");
            return;
        }

        try {
            await updateProject({
                id: project.id,
                patch: { title: validation.data.title, description: validation.data.description },
                optimisticProject: project,
            }).unwrap();
            showToast("success", "Project updated");
            onClose();
        } catch (err) {
            const message = (err as { data?: string })?.data ?? "Failed to update project";
            showToast("error", message);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Project">
            <form onSubmit={onSubmit} className="space-y-4">
                <Input
                    label="Title"
                    placeholder="Project title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={isLoading}
                    required
                />
                <Textarea
                    label="Description"
                    placeholder="Optional description…"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isLoading}
                />

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-slate-600">Status:</span>
                        <span
                            className={`rounded-full px-2 py-1 text-xs ${
                                project.is_completed
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-amber-100 text-amber-800"
                            }`}
                        >
                            {project.is_completed ? "Completed" : "In progress"}
                        </span>
                    </div>
                    {project.created_by_admin && (
                        <p className="mt-2 text-xs text-slate-500">Assigned by admin</p>
                    )}
                </div>

                <div className="flex gap-3">
                    <Button
                        type="button"
                        variant="ghost"
                        className="flex-1"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        className="flex-1"
                        isLoading={isLoading}
                        disabled={!canSubmit}
                    >
                        Save changes
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
