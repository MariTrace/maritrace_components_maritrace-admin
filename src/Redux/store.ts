import { configureStore, ThunkAction, Action } from "@reduxjs/toolkit";
import {userAccountsReducer, parentAccountsReducer } from "./Slices/AccountManagementSlices";

export const store = configureStore({
  reducer: {
    userAccounts: userAccountsReducer,
    parentAccounts: parentAccountsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// ✅ The AppThunk type
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
