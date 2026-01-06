import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { z } from "zod";
import { supabase } from "../../../services/apiClient";
import { supabaseError, type ApiError } from "../../../services/rtkqUtils";

type AuthCredentials = {
	email: string;
	password: string;
};

const AuthResultSchema = z.object({
	userId: z.string(),
});

type AuthResult = z.infer<typeof AuthResultSchema>;

export const authApi = createApi({
	reducerPath: "authApi",
	baseQuery: fakeBaseQuery<ApiError>(),
	endpoints: (builder) => ({
		signUp: builder.mutation<AuthResult, AuthCredentials>({
			queryFn: async ({ email, password }) => {
				const { data, error } = await supabase.auth.signUp({ email, password });
				if (error) return { error: supabaseError(error.message) };

				const userId = data.user?.id;
				if (!userId) return { error: supabaseError("No user returned from sign up") };

				return { data: AuthResultSchema.parse({ userId }) };
			},
		}),
		login: builder.mutation<AuthResult, AuthCredentials>({
			queryFn: async ({ email, password }) => {
				const { data, error } = await supabase.auth.signInWithPassword({ email, password });
				if (error) return { error: supabaseError(error.message) };

				const userId = data.user?.id;
				if (!userId) return { error: supabaseError("No user returned from sign in") };

				return { data: AuthResultSchema.parse({ userId }) };
			},
		}),
	}),
});

export const { useSignUpMutation, useLoginMutation } = authApi;
