import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { z } from "zod";
import { supabase } from "./apiClient";
import { ProjectSchema, UserProfileSchema, type Project, type UserProfile } from "../types";

type ApiError = { status: "CUSTOM_ERROR"; data: string };

const apiError = (message: string): ApiError => ({ status: "CUSTOM_ERROR", data: message });
const zodErrorToMessage = (error: z.ZodError) => error.issues.map((i) => i.message).join("\n");

const PAGE_SIZE_DEFAULT = 5;

type BootstrapAuthResult = {
    userId: string | null;
    profile: UserProfile | null;
};

type Paginated<T> = {
    items: T[];
    nextOffset: number | null;
};

const ListUserProfilesArgsSchema = z.object({
    searchEmail: z.string().optional(),
    offset: z.number().int().nonnegative(),
    limit: z.number().int().positive().max(50),
});

export type ListUserProfilesArgs = z.infer<typeof ListUserProfilesArgsSchema>;

const ListProjectsArgsSchema = z.object({
    assignedUserId: z.string().optional(),
    isCompleted: z.boolean().optional(),
    offset: z.number().int().nonnegative(),
    limit: z.number().int().positive().max(50),
});

export type ListProjectsArgs = z.infer<typeof ListProjectsArgsSchema>;

const CreateProjectInputSchema = ProjectSchema.pick({
    assigned_user_id: true,
    title: true,
    description: true,
});

export type CreateProjectInput = z.infer<typeof CreateProjectInputSchema>;

const UpdateProjectPatchSchema = ProjectSchema.pick({
    assigned_user_id: true,
    title: true,
    description: true,
    is_completed: true,
})
    .partial()
    .superRefine((val, ctx) => {
        if (Object.keys(val).length === 0) {
            ctx.addIssue({ code: "custom", message: "Nothing to update" });
        }
    });

export type UpdateProjectPatch = z.infer<typeof UpdateProjectPatchSchema>;

export type UpdateProjectArgs = {
    id: string;
    patch: UpdateProjectPatch;
    optimisticProject?: Pick<
        Project,
        | "assigned_user_id"
        | "is_completed"
        | "title"
        | "description"
        | "created_by_admin"
        | "created_at"
        | "updated_at"
    >;
};

function uniqueById<T extends { id: string }>(items: T[]) {
    const seen = new Set<string>();
    return items.filter((i) => {
        if (seen.has(i.id)) return false;
        seen.add(i.id);
        return true;
    });
}

export const appApi = createApi({
    reducerPath: "appApi",
    baseQuery: fakeBaseQuery<ApiError>(),
    tagTypes: ["Auth", "UserProfile", "Project"],
    endpoints: (builder) => ({
        bootstrapAuth: builder.query<BootstrapAuthResult, void>({
            queryFn: async () => {
                try {
                    const { data, error } = await supabase.auth.getUser();
                    if (error) return { error: apiError(error.message) };

                    const userId = data.user?.id ?? null;
                    if (!userId) return { data: { userId: null, profile: null } };

                    const { data: profileRow, error: profileError } = await supabase
                        .from("user_profiles")
                        .select("*")
                        .eq("id", userId)
                        .maybeSingle();

                    if (profileError) return { error: apiError(profileError.message) };
                    if (!profileRow) return { data: { userId, profile: null } };

                    const parsed = UserProfileSchema.safeParse(profileRow);
                    if (!parsed.success) {
                        return { error: apiError(zodErrorToMessage(parsed.error)) };
                    }

                    return { data: { userId, profile: parsed.data } };
                } catch {
                    return { error: apiError("Unexpected error while loading session") };
                }
            },
            providesTags: [{ type: "Auth", id: "BOOTSTRAP" }],
        }),

        signOut: builder.mutation<void, void>({
            queryFn: async () => {
                const { error } = await supabase.auth.signOut();
                if (error) return { error: apiError(error.message) };
                return { data: undefined };
            },
            invalidatesTags: [{ type: "Auth", id: "BOOTSTRAP" }],
        }),

        listUserProfiles: builder.query<Paginated<UserProfile>, ListUserProfilesArgs>({
            queryFn: async (args) => {
                const parsedArgs = ListUserProfilesArgsSchema.safeParse(args);
                if (!parsedArgs.success) {
                    return { error: apiError(zodErrorToMessage(parsedArgs.error)) };
                }

                const { offset, limit, searchEmail } = parsedArgs.data;

                let q = supabase
                    .from("user_profiles")
                    .select("*")
                    .order("created_at", { ascending: false })
                    .range(offset, offset + limit - 1);

                if (searchEmail && searchEmail.trim().length > 0) {
                    q = q.ilike("email", `%${searchEmail.trim()}%`);
                }

                const { data, error } = await q;
                if (error) return { error: apiError(error.message) };

                const parsed = UserProfileSchema.array().safeParse(data ?? []);
                if (!parsed.success) return { error: apiError(zodErrorToMessage(parsed.error)) };

                return {
                    data: {
                        items: parsed.data,
                        nextOffset: parsed.data.length < limit ? null : offset + limit,
                    },
                };
            },
            serializeQueryArgs: ({ endpointName, queryArgs }) => {
                const key = `${queryArgs.searchEmail ?? ""}-${queryArgs.limit ?? PAGE_SIZE_DEFAULT}`;
                return `${endpointName}-${key}`;
            },
            merge: (currentCache, newData, { arg }) => {
                if (arg.offset === 0) {
                    currentCache.items = newData.items;
                } else {
                    currentCache.items = uniqueById([...currentCache.items, ...newData.items]);
                }
                currentCache.nextOffset = newData.nextOffset;
            },
            forceRefetch: ({ currentArg, previousArg }) => {
                return (
                    currentArg?.offset !== previousArg?.offset ||
                    currentArg?.searchEmail !== previousArg?.searchEmail
                );
            },
            providesTags: (result) => {
                const base: { type: "UserProfile"; id: string }[] = (result?.items ?? []).map((u) => ({
                    type: "UserProfile",
                    id: u.id,
                }));
                return base;
            },
        }),

        listProjects: builder.query<Paginated<Project>, ListProjectsArgs>({
            queryFn: async (args) => {
                const parsedArgs = ListProjectsArgsSchema.safeParse(args);
                if (!parsedArgs.success) {
                    return { error: apiError(zodErrorToMessage(parsedArgs.error)) };
                }

                const { assignedUserId, isCompleted, offset, limit } = parsedArgs.data;

                let q = supabase
                    .from("projects")
                    .select("*")
                    .order("created_at", { ascending: false })
                    .range(offset, offset + limit - 1);

                if (assignedUserId) q = q.eq("assigned_user_id", assignedUserId);
                if (typeof isCompleted === "boolean") q = q.eq("is_completed", isCompleted);

                const { data, error } = await q;
                if (error) return { error: apiError(error.message) };

                const parsed = ProjectSchema.array().safeParse(data ?? []);
                if (!parsed.success) return { error: apiError(zodErrorToMessage(parsed.error)) };

                return {
                    data: {
                        items: parsed.data,
                        nextOffset: parsed.data.length < limit ? null : offset + limit,
                    },
                };
            },
            serializeQueryArgs: ({ endpointName, queryArgs }) => {
                const key = `${queryArgs.assignedUserId ?? "ALL"}-${queryArgs.isCompleted ?? "ANY"}-${queryArgs.limit}`;
                return `${endpointName}-${key}`;
            },
            merge: (currentCache, newData, { arg }) => {
                if (arg.offset === 0) {
                    currentCache.items = newData.items;
                } else {
                    currentCache.items = uniqueById([...currentCache.items, ...newData.items]);
                }
                currentCache.nextOffset = newData.nextOffset;
            },
            forceRefetch: ({ currentArg, previousArg }) => {
                return (
                    currentArg?.offset !== previousArg?.offset ||
                    currentArg?.assignedUserId !== previousArg?.assignedUserId ||
                    currentArg?.isCompleted !== previousArg?.isCompleted
                );
            },
            providesTags: (result) => {
                return (result?.items ?? []).map((p) => ({ type: "Project" as const, id: p.id }));
            },
        }),

        createProject: builder.mutation<Project, CreateProjectInput>({
            queryFn: async (input) => {
                const parsedInput = CreateProjectInputSchema.safeParse(input);
                if (!parsedInput.success) return { error: apiError(zodErrorToMessage(parsedInput.error)) };

                const { data, error } = await supabase
                    .from("projects")
                    .insert({
                        title: parsedInput.data.title,
                        description: parsedInput.data.description,
                        assigned_user_id: parsedInput.data.assigned_user_id,
                        created_by_admin: true,
                        is_completed: false,
                    })
                    .select("*")
                    .single();

                if (error) return { error: apiError(error.message) };

                const parsed = ProjectSchema.safeParse(data);
                if (!parsed.success) return { error: apiError(zodErrorToMessage(parsed.error)) };

                return { data: parsed.data };
            },
            async onQueryStarted(input, { dispatch, queryFulfilled }) {
                const tempId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
                const optimisticProject: Project = {
                    id: tempId,
                    assigned_user_id: input.assigned_user_id,
                    title: input.title,
                    description: input.description ?? null,
                    is_completed: false,
                    created_by_admin: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                };

                let patch: { undo: () => void } | null = null;
                try {
                    patch = dispatch(
                        appApi.util.updateQueryData(
                            "listProjects",
                            { offset: 0, limit: PAGE_SIZE_DEFAULT },
                            (draft) => {
                                draft.items = uniqueById([optimisticProject, ...draft.items]);
                            }
                        )
                    );
                } catch {
                    patch = null;
                }

                try {
                    const { data } = await queryFulfilled;
                    try {
                        dispatch(
                            appApi.util.updateQueryData(
                                "listProjects",
                                { offset: 0, limit: PAGE_SIZE_DEFAULT },
                                (draft) => {
                                    draft.items = uniqueById([data, ...draft.items.filter((p) => p.id !== tempId)]);
                                }
                            )
                        );
                    } catch {
                        // no cache entry
                    }
                } catch {
                    patch?.undo();
                }
            },
            invalidatesTags: (result) => (result ? [{ type: "Project", id: result.id }] : []),
        }),

        updateProject: builder.mutation<Project, UpdateProjectArgs>({
            queryFn: async ({ id, patch }) => {
                const parsedPatch = UpdateProjectPatchSchema.safeParse(patch);
                if (!parsedPatch.success) return { error: apiError(zodErrorToMessage(parsedPatch.error)) };

                const { data, error } = await supabase
                    .from("projects")
                    .update(parsedPatch.data)
                    .eq("id", id)
                    .select("*")
                    .single();

                if (error) return { error: apiError(error.message) };

                const parsed = ProjectSchema.safeParse(data);
                if (!parsed.success) return { error: apiError(zodErrorToMessage(parsed.error)) };

                return { data: parsed.data };
            },
            async onQueryStarted({ id, patch, optimisticProject }, { dispatch, queryFulfilled }) {
                const previousAssignedUserId = optimisticProject?.assigned_user_id;
                const previousCompleted = optimisticProject?.is_completed;

                const nextAssignedUserId = patch.assigned_user_id ?? previousAssignedUserId;
                const nextCompleted = patch.is_completed ?? previousCompleted;

                const optimisticPatches: { undo: () => void }[] = [];

                const applyToList = (args: ListProjectsArgs, updater: (draft: Paginated<Project>) => void) => {
                    try {
                        const pr = dispatch(appApi.util.updateQueryData("listProjects", args, updater));
                        optimisticPatches.push(pr);
                    } catch {
                        // no cache entry
                    }
                };

                const applyUpdate = (draft: Paginated<Project>) => {
                    const idx = draft.items.findIndex((p) => p.id === id);
                    if (idx === -1) return;
                    draft.items[idx] = { ...draft.items[idx], ...patch, updated_at: new Date().toISOString() };
                };

                applyToList({ offset: 0, limit: PAGE_SIZE_DEFAULT }, applyUpdate);

                if (previousAssignedUserId) {
                    applyToList(
                        { assignedUserId: previousAssignedUserId, isCompleted: false, offset: 0, limit: PAGE_SIZE_DEFAULT },
                        (draft) => {
                            if (nextCompleted === true) {
                                draft.items = draft.items.filter((p) => p.id !== id);
                                return;
                            }
                            applyUpdate(draft);
                        }
                    );
                    applyToList(
                        { assignedUserId: previousAssignedUserId, isCompleted: true, offset: 0, limit: PAGE_SIZE_DEFAULT },
                        (draft) => {
                            if (nextCompleted === false) {
                                draft.items = draft.items.filter((p) => p.id !== id);
                                return;
                            }
                            applyUpdate(draft);
                        }
                    );
                }

                if (nextAssignedUserId && nextAssignedUserId === previousAssignedUserId && previousCompleted !== nextCompleted) {
                    const toArgs: ListProjectsArgs = {
                        assignedUserId: nextAssignedUserId,
                        isCompleted: Boolean(nextCompleted),
                        offset: 0,
                        limit: PAGE_SIZE_DEFAULT,
                    };

                    applyToList(toArgs, (draft) => {
                        const exists = draft.items.some((p) => p.id === id);
                        if (exists) {
                            applyUpdate(draft);
                            return;
                        }
                        const base: Project = {
                            id,
                            assigned_user_id: nextAssignedUserId,
                            title: optimisticProject?.title ?? "",
                            description: optimisticProject?.description ?? null,
                            is_completed: Boolean(nextCompleted),
                            created_by_admin: optimisticProject?.created_by_admin ?? true,
                            created_at: optimisticProject?.created_at ?? new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                        };
                        draft.items = uniqueById([{ ...base, ...patch }, ...draft.items]);
                    });
                }

                try {
                    await queryFulfilled;
                } catch {
                    optimisticPatches.forEach((p) => p.undo());
                }
            },
            invalidatesTags: (_result, _error, args) => [{ type: "Project", id: args.id }],
        }),
    }),
});

export const {
    useBootstrapAuthQuery,
    useSignOutMutation,
    useListUserProfilesQuery,
    useListProjectsQuery,
    useCreateProjectMutation,
    useUpdateProjectMutation,
} = appApi;

export const PAGE_SIZE = PAGE_SIZE_DEFAULT;
