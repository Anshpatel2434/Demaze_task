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
    selectedUser: UserProfile | null;
    showToast: ShowToast;
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

                <div className="rounded-xl border border-white/10 bg-slate-950/30 p-3 text-sm text-slate-300">
                    <p className="font-medium text-slate-100">Assigned user</p>
                    <p className="mt-1 text-sm text-slate-400">
                        {selectedUser ? selectedUser.email : "Select a user from the list to assign this project."}
                    </p>
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
