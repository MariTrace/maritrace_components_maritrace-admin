import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import * as AM from '../../Javascript/AccountManagement.js';
import { createFetchThunk } from './General';
import { RootState, AppDispatch } from "../store";

export interface UserAccountsState {
  activeAccounts: AM.UserAccount[];
  archivedAccounts: AM.UserAccount[];
}

const initialState: UserAccountsState = {
  activeAccounts: [],
  archivedAccounts: [],
};

const getTargetArray = (state: UserAccountsState, archived?: boolean) =>
  archived ? state.archivedAccounts : state.activeAccounts;

export const userAccountsSlice = createSlice({
  name: "userAccounts",
  initialState,
  reducers: {
    setUserAccounts: (
      state,
      action: PayloadAction<{ accounts: AM.UserAccount[]; archived?: boolean }>
    ) => {
      const target = getTargetArray(state, action.payload.archived);
      target.splice(0, target.length, ...action.payload.accounts); // replace array
    },

    addUserAccount: (
      state,
      action: PayloadAction<{ account: AM.UserAccount; archived?: boolean }>
    ) => {
      if (action.payload.account != null && action.payload.account != undefined) {
          const target = getTargetArray(state, action.payload.archived);
          target.push(action.payload.account);
      }
      else console.warn("the added user is undefined: ", action.payload.account)
    },
    removeUserAccount: (
      state,
      action: PayloadAction<{ uuid: string; archived?: boolean }>
    ) => {
      const target = getTargetArray(state, action.payload.archived);
      const index = target.findIndex(acc => acc.user_account_uuid === action.payload.uuid);
      if (index !== -1) target.splice(index, 1);
    },

    updateUserAccountField: <K extends keyof AM.UserAccount>(
      state: UserAccountsState,
      action: PayloadAction<{
        uuid: string;
        key: K;
        value: AM.UserAccount[K];
        archived?: boolean;
      }>
    ) => {
      const target = getTargetArray(state, action.payload.archived);
      const account = target.find(acc => acc.user_account_uuid === action.payload.uuid);
      if (account) account[action.payload.key] = action.payload.value;
    },

    updateUserAccountSettingsField: <K extends keyof AM.UserSettings>(
      state: UserAccountsState,
      action: PayloadAction<{
        uuid: string;
        key: K;
        value: AM.UserSettings[K];
        archived?: boolean;
      }>
    ) => {
      const target = getTargetArray(state, action.payload.archived);
      const account = target.find(acc => acc.user_account_uuid === action.payload.uuid);
      if (account) account.account_settings[action.payload.key] = action.payload.value;
    },
  },
});

export const {
  setUserAccounts,
  addUserAccount,
  removeUserAccount,
  updateUserAccountField,
  updateUserAccountSettingsField,
} = userAccountsSlice.actions;

export const fetchAllUsers = createAsyncThunk<
  AM.UserAccount[],
  boolean | undefined,
  { dispatch: AppDispatch; state: RootState }
>(
  "userAccounts/fetchAllUsers",
  async (getArchived = false, thunkAPI) => {
    const { dispatch } = thunkAPI;
    const users = await AM.getAllUsers(getArchived);
    const settings = await AM.getAllUserSettings(getArchived);
    const combined = await AM.combineUserAccountsData(users, settings);
    dispatch(setUserAccounts({ accounts: combined, archived: getArchived }));
    return combined;
  }
);

//-------------------------------------------------------------------------------------------


export interface ParentAccountsState {
  activeAccounts: AM.ParentAccount[];
  archivedAccounts: AM.ParentAccount[];
}

const parentInitialState: ParentAccountsState = {
  activeAccounts: [],
  archivedAccounts: [],
};

// Helper specific to parents
const getParentTargetArray = (state: ParentAccountsState, archived?: boolean) =>
  archived ? state.archivedAccounts : state.activeAccounts;

// ---------------- SLICE ----------------
export const parentAccountsSlice = createSlice({
  name: "parentAccounts",
  initialState: parentInitialState,
  reducers: {
    setParentAccounts: (
      state,
      action: PayloadAction<{ accounts: AM.ParentAccount[]; archived?: boolean }>
    ) => {
      const target = getParentTargetArray(state, action.payload.archived);
      target.splice(0, target.length, ...action.payload.accounts);
    },

    addParentAccount: (
      state,
      action: PayloadAction<{ account: AM.ParentAccount; archived?: boolean }>
    ) => {
      if (action.payload.account != null && action.payload.account != undefined) {
        const target = getParentTargetArray(state, action.payload.archived);
        target.push(action.payload.account);
      }
      else console.warn("the added parent is undefined: ", action.payload.account)
    },

    removeParentAccount: (
      state,
      action: PayloadAction<{ uuid: string; archived?: boolean }>
    ) => {
      const target = getParentTargetArray(state, action.payload.archived);
      const index = target.findIndex(
        acc => acc.parent_account_uuid === action.payload.uuid
      );
      if (index !== -1) target.splice(index, 1);
    },

    updateParentAccountField: <K extends keyof AM.ParentAccount>(
      state: ParentAccountsState,
      action: PayloadAction<{
        uuid: string;
        key: K;
        value: AM.ParentAccount[K];
        archived?: boolean;
      }>
    ) => {
      const target = getParentTargetArray(state, action.payload.archived);
      const account = target.find(
        acc => acc.parent_account_uuid === action.payload.uuid
      );
      if (account) {
        account[action.payload.key] = action.payload.value;
      }
    },
  },
});

// ---------------- ACTIONS ----------------
export const {
  setParentAccounts,
  addParentAccount,
  removeParentAccount,
  updateParentAccountField,
} = parentAccountsSlice.actions;

// ---------------- THUNK ----------------
export const fetchAllParents = createAsyncThunk<
  AM.ParentAccount[],
  boolean | undefined,
  { dispatch: AppDispatch; state: RootState }
>(
  "parentAccounts/fetchAllParents",
  async (getArchived = false, thunkAPI) => {
    const { dispatch } = thunkAPI;
    const parents = await AM.getAllParents(getArchived); // ensure exists in AM
    dispatch(setParentAccounts({ accounts: parents, archived: getArchived }));
    return parents;
  }
);

type UserParentActionType = "add" | "update" | "remove";

export const syncUserWithParent = ( user: AM.UserAccount, actionType: UserParentActionType, archived: boolean = false
 ) => (dispatch: AppDispatch, getState: () => RootState) => {
  const state = getState();

  // Pick the right parent slice array based on archived flag
  const parentAccounts = archived ? state.parentAccounts.archivedAccounts : state.parentAccounts.activeAccounts;

  const parent = parentAccounts.find( p => p.parent_account_uuid === user.parent_account_uuid );

  const userArray = archived ? state.userAccounts.archivedAccounts : state.userAccounts.activeAccounts;

  switch (actionType) {
    case "add":
      dispatch(addUserAccount({ account: user, archived }));

      if (parent) {
        const updatedChildren = [...(parent.children || []), user];
        dispatch( updateParentAccountField({ uuid: parent.parent_account_uuid, key: "children", value: updatedChildren, archived,}));
      }
      break;

    case "update":
      // Update user fields
      Object.keys(user).forEach(key => {
        dispatch(updateUserAccountField({uuid: user.user_account_uuid, key: key as keyof AM.UserAccount,
            value: user[key as keyof AM.UserAccount],archived,}));
      });

      if (parent) {
        const updatedChildren = (parent.children || []).map(u =>u.user_account_uuid === user.user_account_uuid ? user : u);
        dispatch(updateParentAccountField({uuid: parent.parent_account_uuid, key: "children", value: updatedChildren, archived,}));
      }
      break;

    case "remove":
      dispatch(removeUserAccount({ uuid: user.user_account_uuid, archived }));

      if (parent) {
        const updatedChildren = (parent.children || []).filter(u => u.user_account_uuid !== user.user_account_uuid);
        dispatch(updateParentAccountField({ uuid: parent.parent_account_uuid, key: "children", value: updatedChildren, archived, })
        );
      }
      break;
  }
};


export const userAccountsReducer = userAccountsSlice.reducer;
export const parentAccountsReducer = parentAccountsSlice.reducer;

// ---------------- SELECTOR ----------------
//not used
export const selectParentsWithChildren = (state: RootState) => {
  return state.parentAccounts.activeAccounts.map(parent => ({
    ...parent,
    children: state.userAccounts.activeAccounts.filter(
      u => u.parent_account_uuid === parent.parent_account_uuid
    )
  }));
};
//not used
export const selectParentsWithArchivedChildren = (state: RootState) => {
  return state.parentAccounts.activeAccounts.map(parent => ({
    ...parent,
    archivedChildren: state.userAccounts.archivedAccounts.filter(
      u => u.parent_account_uuid === parent.parent_account_uuid
    )
  }));
};