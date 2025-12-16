import { configureStore } from "@reduxjs/toolkit";
import notificationReducer from "./slices/notificationSlice";
import chatReducer from "./slices/chatSlice";

export const store = configureStore({
  reducer: {
    notifications: notificationReducer,
    chat: chatReducer
  }
});

