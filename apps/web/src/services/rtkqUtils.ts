import type { ZodError } from "zod";

export type ApiError = {
    status: "SUPABASE_ERROR" | "VALIDATION_ERROR" | "UNKNOWN_ERROR";
    data: string;
};

export function zodErrorToMessage(error: ZodError) {
    return error.issues.map((i) => i.message).join("\n");
}

export function validationError(message: string): ApiError {
    return { status: "VALIDATION_ERROR", data: message };
}

export function supabaseError(message: string): ApiError {
    return { status: "SUPABASE_ERROR", data: message };
}

export function unknownError(message: string): ApiError {
    return { status: "UNKNOWN_ERROR", data: message };
}
