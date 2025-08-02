import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface LanguageUpdate {
  languageUpdate: boolean;
}

const initialState: LanguageUpdate = {
  languageUpdate: false,
};

const languageSlice = createSlice({
  name: "language",
  initialState,
  reducers: {
    setLanguageUpdate: (state, action: PayloadAction<boolean>) => {
      state.languageUpdate = action.payload;
    },
  },
});

export const { setLanguageUpdate } = languageSlice.actions;
export default languageSlice.reducer;
