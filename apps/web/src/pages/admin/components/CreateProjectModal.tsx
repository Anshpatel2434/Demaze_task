import { useEffect, useMemo, useState } from "react";
import { ProjectSchema } from "../../../types";
import type { UserProfile } from "../../../types";
import { useCreateProjectMutation } from "../../../services/appApi";
import { Button } from "../../../components/ui/Button";

const CreateSchema = ProjectSchema.pick({
    assigned_user_id: true,
    title: true,
    description: true,
});

type Props = {
    isOpen: boolean;
    onClose: () => void;
    selectedUser: UserProfile | null;
    showToast: (variant: "success" | "error" | "info", message: string) => void;
};

export function CreateProjectModal({ isOpen, onClose, selectedUser, showToast }: Props) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");

    const [createProject, { isLoading }] = useCreateProjectMutation();

    const normalizedDescription = useMemo(() => {
        const t = description.trim();
        return t.length === 0 ? null : t;
    }, [description]);

    const canSubmit = Boolean(selectedUser?.id) && title.trim().length > 0;

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) {
            showToast("info", "Select a user before creating a project.");
            return;
        }

        const parsed = CreateSchema.safeParse({
            assigned_user_id: selectedUser.id,
            title: title.trim(),
            description: normalizedDescription,
        });

        if (!parsed.success) {
            const message = parsed.error.issues.map((i) => i.message).join("\n");
            showToast("error", message);
            return;
        }

        try {
            await createProject(parsed.data).unwrap();
            showToast("success", "Project created.");
            setTitle("");
            setDescription("");
            onClose();
        } catch (err) {
            const message = (err as { data?: string })?.data ?? "Failed to create project";
            showToast("error", message);
        }
    };

    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                setTitle("");
                setDescription("");
            }, 0);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
                <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Create New Project</h2>
                    <p className="mt-1 text-sm text-gray-500">Fill in the details to create a new project</p>
                </div>

                <form onSubmit={onSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                            Title
                        </label>
                        <input
                            id="title"
                            type="text"
                            placeholder="New project title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            disabled={isLoading}
                            required
                            className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>

                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                            Description
                        </label>
                        <textarea
                            id="description"
                            placeholder="Optional description…"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            disabled={isLoading}
                            rows={3}
                            className="mt-1 w-full resize-y rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>

                    <div className="rounded-xl bg-gray-50 p-3">
                        <p className="text-sm font-medium text-gray-700">Assigned user</p>
                        <p className="mt-1 text-sm text-gray-500">
                            {selectedUser ? selectedUser.email : "Select a user from the list to assign this project."}
                        </p>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            isLoading={isLoading}
                            disabled={!canSubmit}
                            className="flex-1"
                        >
                            Create project
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
