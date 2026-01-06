import { z } from "zod";

// 1. Zod schema
export const UserProfileSchema = z.object({
	id: z.string(),

	full_name: z.string().nullable(),
	email: z.email(),

	is_admin: z.boolean(),

	created_at: z.string(),
	updated_at: z.string(),
});

// 2. Inferred TypeScript type
export type UserProfile = z.infer<typeof UserProfileSchema>;

export const ProjectSchema = z.object({
	id: z.string(),

	assigned_user_id: z.string(),

	title: z.string().min(1, "Title cannot be empty"),
	description: z.string().nullable(),

	is_completed: z.boolean(),
	created_by_admin: z.boolean(),

	created_at: z.string(),
	updated_at: z.string(),
});

// 2. Inferred TypeScript type
export type Project = z.infer<typeof ProjectSchema>;