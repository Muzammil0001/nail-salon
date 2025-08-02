import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface NotifyUpdate {
  hasNotify: boolean;
}

const initialState: NotifyUpdate = {
  hasNotify: false,
};

const notifySlice = createSlice({
  name: "notify",
  initialState,
  reducers: {
    setHasNotify: (state, action: PayloadAction<boolean>) => {
      state.hasNotify = action.payload;
    },
  },
});

export const { setHasNotify } = notifySlice.actions;
export default notifySlice.reducer;
