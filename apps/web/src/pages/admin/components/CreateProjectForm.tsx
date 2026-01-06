import { useEffect, useMemo, useRef, useState } from "react";
import { ProjectSchema } from "../../../types";
import type { UserProfile } from "../../../types";
import { useCreateProjectMutation, useListUserProfilesQuery, PAGE_SIZE } from "../../../services/appApi";
import { Input } from "../../../components/ui/Input";
import { Textarea } from "../../../components/ui/Textarea";
import { Button } from "../../../components/ui/Button";
import type { ShowToast } from "../../../App";
import { Skeleton } from "../../../components/ui/Skeleton";
import { EmptyState } from "../../../components/ui/EmptyState";

const CreateSchema = ProjectSchema.pick({
    assigned_user_id: true,
    title: true,
    description: true,
});

type Props = {
    selectedUser: UserProfile | null;
    showToast: ShowToast;
};

export function CreateProjectForm({ selectedUser, showToast }: Props) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [localSelectedUser, setLocalSelectedUser] = useState<UserProfile | null>(selectedUser);
    const [offset, setOffset] = useState(0);

    const searchTimerRef = useRef<number | null>(null);

    useEffect(() => {
        if (searchTimerRef.current) window.clearTimeout(searchTimerRef.current);
        searchTimerRef.current = window.setTimeout(() => {
            setDebouncedSearch(search);
            setOffset(0);
        }, 350);

        return () => {
            if (searchTimerRef.current) window.clearTimeout(searchTimerRef.current);
        };
    }, [search]);

    useEffect(() => {
        setLocalSelectedUser(selectedUser);
    }, [selectedUser]);

    const args = useMemo(
        () => ({ searchEmail: debouncedSearch.trim() || undefined, offset, limit: PAGE_SIZE }),
        [debouncedSearch, offset]
    );

    const { data, isLoading, isFetching, isError, refetch } = useListUserProfilesQuery(args);
    const items = data?.items ?? [];
    const nextOffset = data?.nextOffset ?? null;

    const canLoadMore = Boolean(nextOffset) && !isFetching;

    const sentinelRef = useRef<HTMLLIElement | null>(null);

    useEffect(() => {
        if (!canLoadMore) return;
        const el = sentinelRef.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (!entries[0]?.isIntersecting) return;
                if (nextOffset == null) return;
                setOffset(nextOffset);
            },
            { root: null, rootMargin: "200px" }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [canLoadMore, nextOffset]);

    const [createProject, { isLoading }] = useCreateProjectMutation();

    const normalizedDescription = useMemo(() => {
        const t = description.trim();
        return t.length === 0 ? null : t;
    }, [description]);

    const canSubmit = Boolean(localSelectedUser?.id) && title.trim().length > 0;

    const submitTimerRef = useRef<number | null>(null);

    const onSubmit = async () => {
        if (!localSelectedUser) {
            showToast("info", "Select a user before creating a project.");
            return;
        }

        const parsed = CreateSchema.safeParse({
            assigned_user_id: localSelectedUser.id,
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
            setLocalSelectedUser(null);
            setSearch("");
        } catch (err) {
            const message = (err as { data?: string })?.data ?? "Failed to create project";
            showToast("error", message);
        }
    };

    useEffect(() => {
        return () => {
            if (submitTimerRef.current) window.clearTimeout(submitTimerRef.current);
        };
    }, []);

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                if (isLoading) return;

                if (submitTimerRef.current) window.clearTimeout(submitTimerRef.current);
                submitTimerRef.current = window.setTimeout(() => {
                    void onSubmit();
                }, 250);
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

            <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Select User</label>
                <Input
                    placeholder="Search users by email…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    disabled={isLoading}
                />
                <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-gray-200">
                    {isLoading ? (
                        <div className="p-2">
                            {Array.from({ length: 4 }).map((_, idx) => (
                                <Skeleton key={idx} className="mb-2 h-10 w-full" />
                            ))}
                        </div>
                    ) : null}

                    {isError ? (
                        <EmptyState
                            title="Couldn't load users"
                            description="Please retry."
                            action={
                                <button
                                    onClick={() => refetch()}
                                    className="mt-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                    Retry
                                </button>
                            }
                        />
                    ) : null}

                    {!isLoading && !isError && items.length === 0 ? (
                        <div className="p-3 text-sm text-gray-500">No users found</div>
                    ) : null}

                    {!isLoading && !isError ? (
                        <ul className="divide-y divide-gray-200">
                            {items.map((u) => {
                                const selected = u.id === localSelectedUser?.id;
                                return (
                                    <li key={u.id}>
                                        <button
                                            type="button"
                                            onClick={() => setLocalSelectedUser(u)}
                                            className={`w-full px-3 py-2 text-left text-sm transition ${
                                                selected ? "bg-blue-50 font-medium text-blue-900" : "text-gray-900 hover:bg-gray-50"
                                            }`}
                                        >
                                            <div className="font-medium">{u.email}</div>
                                            <div className="text-xs text-gray-500">{u.full_name ?? "—"}</div>
                                        </button>
                                    </li>
                                );
                            })}
                            <li aria-hidden ref={sentinelRef} />
                        </ul>
                    ) : null}
                </div>
                {isFetching && !isLoading ? (
                    <div className="p-2">
                        {Array.from({ length: 2 }).map((_, idx) => (
                            <Skeleton key={idx} className="mb-2 h-10 w-full" />
                        ))}
                    </div>
                ) : null}
            </div>

            {localSelectedUser ? (
                <div className="rounded-lg bg-blue-50 p-3">
                    <p className="text-sm font-medium text-blue-900">Assigning to: {localSelectedUser.email}</p>
                </div>
            ) : null}

            <Button type="submit" className="w-full" isLoading={isLoading} disabled={!canSubmit}>
                Create project
            </Button>
        </form>
    );
}
