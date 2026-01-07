import { useMemo, useState } from "react";
import { ProjectSchema } from "../../types";
import type { UserProfile } from "../../types";
import { useCreateProjectMutation } from "../../services/appApi";
import type { ShowToast } from "../../App";
import { Modal } from "./Modal";
import { Input } from "./Input";
import { Textarea } from "./Textarea";
import { Button } from "./Button";

const CreateSchema = ProjectSchema.pick({
    assigned_user_id: true,
    title: true,
    description: true,
});

type Props = {
    isOpen: boolean;
    onClose: () => void;
    users: UserProfile[];
    showToast: ShowToast;
};

export function CreateProjectModal({ isOpen, onClose, users, showToast }: Props) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

    const [createProject, { isLoading }] = useCreateProjectMutation();

    const normalizedDescription = useMemo(() => {
        const t = description.trim();
        return t.length === 0 ? null : t;
    }, [description]);

    const canSubmit = title.trim().length > 0;

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const parsed = CreateSchema.safeParse({
            assigned_user_id: selectedUserId,
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
            setSelectedUserId(null);
            onClose();
        } catch (err) {
            const message = (err as { data?: string })?.data ?? "Failed to create project";
            showToast("error", message);
        }
    };

    const selectedUser = selectedUserId ? users.find(u => u.id === selectedUserId) : null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create Project">
            <form onSubmit={onSubmit} className="space-y-4">
                <Input
                    label="Title"
                    placeholder="New project title"
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

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">
                        Assign to user (optional)
                    </label>
                    <select
                        value={selectedUserId ?? ""}
                        onChange={(e) => setSelectedUserId(e.target.value || null)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100"
                        disabled={isLoading}
                    >
                        <option value="">Unassigned</option>
                        {users.map((user) => (
                            <option key={user.id} value={user.id}>
                                {user.email} {user.full_name ? `(${user.full_name})` : ""}
                            </option>
                        ))}
                    </select>
                    {selectedUser && (
                        <p className="text-sm text-slate-600">
                            Selected: {selectedUser.email}
                        </p>
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
                        Create project
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
