import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  unreadCounts: {} // { userId: number }
};

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    notificationReceived: (state, action) => {
      const senderId = action.payload;
      state.unreadCounts[senderId] =
        (state.unreadCounts[senderId] || 0) + 1;
    },

    clearUnread: (state, action) => {
      const userId = action.payload;
      state.unreadCounts[userId] = 0;
    },

    resetAllUnread: (state) => {
      state.unreadCounts = {};
    }
  }
});

export const {
  notificationReceived,
  clearUnread,
  resetAllUnread
} = notificationSlice.actions;

export default notificationSlice.reducer;
