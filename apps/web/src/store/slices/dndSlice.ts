import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type DndState = {
	draggingProjectId: string | null;
	locked: boolean;
	updatingProjectId: string | null;
};

const initialState: DndState = {
	draggingProjectId: null,
	locked: false,
	updatingProjectId: null,
};

export const dndSlice = createSlice({
	name: "dnd",
	initialState,
	reducers: {
		startDrag: (state, action: PayloadAction<string>) => {
			state.draggingProjectId = action.payload;
		},
		endDrag: (state) => {
			state.draggingProjectId = null;
		},
		lockDnd: (state, action: PayloadAction<string | null>) => {
			state.locked = true;
			state.updatingProjectId = action.payload;
		},
		unlockDnd: (state) => {
			state.locked = false;
			state.updatingProjectId = null;
		},
	},
});

export const { startDrag, endDrag, lockDnd, unlockDnd } = dndSlice.actions;
export default dndSlice.reducer;
