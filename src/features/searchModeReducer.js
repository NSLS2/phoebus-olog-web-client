import { useCallback } from "react";
import { createSlice } from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { isAiSearchEnabled } from "config/customization";
import { AI_PARAMS } from "src/hooks/useEnhancedSearchParams";

export const SEARCH_MODES = {
  QUERY: "query",
  AI: "ai",
  AI_ANALYSIS: "ai_analysis"
};

export const isAIMode = (mode) =>
  mode === SEARCH_MODES.AI || mode === SEARCH_MODES.AI_ANALYSIS;

const INTRO_DISMISSED_KEY = "olog.aiIntroDismissed";

const readIntroDismissed = () => {
  try {
    return window.localStorage.getItem(INTRO_DISMISSED_KEY) === "true";
  } catch {
    return false;
  }
};

const storeIntroDismissed = () => {
  try {
    window.localStorage.setItem(INTRO_DISMISSED_KEY, "true");
  } catch {
    // storage is not available: the dismissal lasts until the page reloads
  }
};

export const searchModeSlice = createSlice({
  name: "searchMode",
  initialState: () => ({ aiIntroDismissed: readIntroDismissed() }),
  reducers: {
    dismissAiIntro: (state) => ({ ...state, aiIntroDismissed: true })
  }
});

export const { dismissAiIntro } = searchModeSlice.actions;

/**
 * The search mode, the AI question and the analysis switch live in the URL
 * (see AI_PARAMS), like the search filters do, so they survive a reload, a
 * shared link and the Back button. Only the intro dismissal is in the store.
 */
export const useSearchMode = () => {
  const dispatch = useDispatch();
  const [params, setParams] = useSearchParams();
  const aiIntroDismissed = useSelector(
    (state) => state.searchMode.aiIntroDismissed
  );

  const enabled = isAiSearchEnabled();
  const analysisOn = params.get(AI_PARAMS.ANALYSIS) === "true";
  let mode = SEARCH_MODES.QUERY;
  if (enabled && params.get(AI_PARAMS.MODE) === "ai") {
    mode = analysisOn ? SEARCH_MODES.AI_ANALYSIS : SEARCH_MODES.AI;
  }
  const aiQuery = enabled ? (params.get(AI_PARAMS.QUERY) ?? "") : "";

  const updateParams = useCallback(
    (changes, navigateOptions) => {
      setParams((prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(changes).forEach(([key, value]) => {
          if (value) {
            next.set(key, value);
          } else {
            next.delete(key);
          }
        });
        return next;
      }, navigateOptions);
    },
    [setParams]
  );

  const dismissIntro = useCallback(() => {
    storeIntroDismissed();
    dispatch(dismissAiIntro());
  }, [dispatch]);

  const setMode = useCallback(
    (newMode) =>
      updateParams({ [AI_PARAMS.MODE]: isAIMode(newMode) ? "ai" : null }),
    [updateParams]
  );

  const toggleAnalysis = useCallback(
    () =>
      updateParams(
        { [AI_PARAMS.ANALYSIS]: analysisOn ? null : "true" },
        { replace: true }
      ),
    [analysisOn, updateParams]
  );

  const setAiQuery = useCallback(
    (question) => {
      const trimmed = (question ?? "").trim();
      if (trimmed) {
        dismissIntro();
      }
      updateParams({ [AI_PARAMS.QUERY]: trimmed || null });
    },
    [dismissIntro, updateParams]
  );

  return {
    mode,
    aiQuery,
    aiIntroDismissed,
    setMode,
    toggleAnalysis,
    setAiQuery,
    dismissIntro
  };
};

export default searchModeSlice.reducer;
