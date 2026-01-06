import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query/react";
import { authApi } from "../pages/auth/redux_usecases/authApi";
import { appApi } from "../services/appApi";
import toastReducer from "./slices/toastSlice";
import dndReducer from "./slices/dndSlice";

export const store = configureStore({
    reducer: {
        [authApi.reducerPath]: authApi.reducer,
        [appApi.reducerPath]: appApi.reducer,
        toast: toastReducer,
        dnd: dndReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(authApi.middleware, appApi.middleware),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
