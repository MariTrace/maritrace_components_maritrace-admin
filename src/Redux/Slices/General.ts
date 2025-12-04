import { AppThunk } from "../store";

/**
 * Creates a thunk that fetches from an async function and dispatches a given action.
 * @param fetchFn The async function that fetches your data.
 * @param actionCreator The slice action to call with the fetched data.
 */
export function createFetchThunk<TParams extends any[], TResult>(
  fetchFn: (...params: TParams) => Promise<TResult>,
  actionCreator: (payload: TResult) => any
) {
  return (...params: TParams): AppThunk => {
    return async (dispatch) => {
      try {
        const data = await fetchFn(...params);
        dispatch(actionCreator(data));
      } catch (error) {
        console.error("Thunk fetch failed:", error);
      }
    };
  };
}
