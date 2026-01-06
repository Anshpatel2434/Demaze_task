import { useMemo, useState } from "react";
import { ProjectSchema } from "../../../types";
import type { UserProfile } from "../../../types";
import { useCreateProjectMutation } from "../../../services/appApi";
import { Input } from "../../../components/ui/Input";
import { Textarea } from "../../../components/ui/Textarea";
import { Button } from "../../../components/ui/Button";
import { useToast } from "../../../hooks/useToast";
import { useDebouncedCallback } from "../../../hooks/useDebouncedCallback";

const CreateSchema = ProjectSchema.pick({
    assigned_user_id: true,
    title: true,
    description: true,
});

type Props = {
    selectedUser: UserProfile | null;
};

export function CreateProjectForm({ selectedUser }: Props) {
    const toast = useToast();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");

    const [createProject, { isLoading }] = useCreateProjectMutation();

    const normalizedDescription = useMemo(() => {
        const t = description.trim();
        return t.length === 0 ? null : t;
    }, [description]);

    const canSubmit = Boolean(selectedUser?.id) && title.trim().length > 0;

    const submitDebounced = useDebouncedCallback(
        async () => {
            if (!selectedUser) {
                toast.info("Select a user before creating a project.", "admin:create:missing-user");
                return;
            }

            const parsed = CreateSchema.safeParse({
                assigned_user_id: selectedUser.id,
                title: title.trim(),
                description: normalizedDescription,
            });

            if (!parsed.success) {
                const message = parsed.error.issues.map((i) => i.message).join("\n");
                toast.error(message, `admin:create:validation:${message}`);
                return;
            }

            try {
                await createProject(parsed.data).unwrap();
                toast.success("Project created.", "admin:create:success");
                setTitle("");
                setDescription("");
            } catch (err) {
                const message = (err as { data?: string })?.data ?? "Failed to create project";
                toast.error(message, `admin:create:error:${message}`);
            }
        },
        250,
        { leading: true, trailing: false }
    );

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                if (isLoading) return;
                submitDebounced.callback();
            }}
            className="space-y-4"
        >
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

            <Button type="submit" className="w-full" isLoading={isLoading} disabled={!canSubmit}>
                Create project
            </Button>
        </form>
    );
}
