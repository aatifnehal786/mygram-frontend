import { createSlice } from "@reduxjs/toolkit";

const chatSlice = createSlice({
  name: "chat",
  initialState: {
    activeChatUserId: null // 👈 THIS IS KEY
  },
  reducers: {
    setActiveChat: (state, action) => {
      state.activeChatUserId = action.payload;
    },
    clearActiveChat: (state) => {
      state.activeChatUserId = null;
    }
  }
});

export const { setActiveChat, clearActiveChat } = chatSlice.actions;
export default chatSlice.reducer;
