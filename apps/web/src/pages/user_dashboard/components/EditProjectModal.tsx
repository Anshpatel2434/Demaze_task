import { useEffect, useMemo, useState } from "react";
import type { Project } from "../../../types";
import { ProjectSchema } from "../../../types";
import { useUpdateProjectMutation } from "../../../services/appApi";

const EditableSchema = ProjectSchema.pick({
    title: true,
    description: true,
});

type Props = {
    isOpen: boolean;
    onClose: () => void;
    project: Project | null;
    showToast: (variant: "success" | "error" | "info", message: string) => void;
};

export function EditProjectModal({ isOpen, onClose, project, showToast }: Props) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");

    const [updateProject, { isLoading }] = useUpdateProjectMutation();

    const normalizedDescription = useMemo(() => {
        const trimmed = description.trim();
        return trimmed.length === 0 ? null : trimmed;
    }, [description]);

    const validation = useMemo(() => {
        return EditableSchema.safeParse({ title: title.trim(), description: normalizedDescription });
    }, [normalizedDescription, title]);

    const showInvalid = !validation.success && (title.length > 0 || description.length > 0);

    useEffect(() => {
        if (project) {
            setTimeout(() => {
                setTitle(project.title);
                setDescription(project.description ?? "");
            }, 0);
        }
    }, [project]);

    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                setTitle("");
                setDescription("");
            }, 0);
        }
    }, [isOpen]);

    const save = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validation.success || !project) return;

        try {
            await updateProject({
                id: project.id,
                patch: { title: validation.data.title, description: validation.data.description },
            }).unwrap();
            showToast("success", "Project updated successfully.");
            onClose();
        } catch (err) {
            const message = (err as { data?: string })?.data ?? "Failed to update project";
            showToast("error", message);
        }
    };

    if (!isOpen || !project) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
                <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Edit Project</h2>
                    <p className="mt-1 text-sm text-gray-500">Update project details</p>
                </div>

                <form onSubmit={save} className="space-y-4">
                    <div>
                        <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700">
                            Title
                        </label>
                        <input
                            id="edit-title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            disabled={isLoading}
                            className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm text-gray-900 outline-none transition focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                                showInvalid
                                    ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                                    : "border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                            }`}
                            placeholder="Project title"
                        />
                        {showInvalid && (
                            <p className="mt-1 text-xs text-red-600">Title cannot be empty</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700">
                            Description
                        </label>
                        <textarea
                            id="edit-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            disabled={isLoading}
                            rows={3}
                            className="mt-1 w-full resize-y rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Optional notes…"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1 rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!validation.success || isLoading}
                            className="flex-1 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isLoading ? "Saving…" : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
