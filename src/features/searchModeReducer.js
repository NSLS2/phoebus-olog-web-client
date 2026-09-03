import { createSlice } from "@reduxjs/toolkit";
import { useSelector } from "react-redux";

export const SEARCH_MODES = {
  QUERY: "query",
  AI: "ai",
  AI_ANALYSIS: "ai_analysis"
};

export const isAIMode = (mode) =>
  mode === SEARCH_MODES.AI || mode === SEARCH_MODES.AI_ANALYSIS;

export const defaultSearchModeState = {
  mode: SEARCH_MODES.QUERY,
  aiQuery: "",
  aiIntroDismissed: false
};

export const searchModeSlice = createSlice({
  name: "searchMode",
  initialState: defaultSearchModeState,
  reducers: {
    setSearchMode: (state, action) => ({
      ...state,
      mode: action.payload,
      aiIntroDismissed: false
    }),
    toggleAiAnalysis: (state) => {
       if (!isAIMode(state.mode)) return state;
      return {
        ...state,
        mode:
          state.mode === SEARCH_MODES.AI_ANALYSIS
            ? SEARCH_MODES.AI
            : SEARCH_MODES.AI_ANALYSIS
      };
    },
    setAiQuery: (state, action) => ({
        ...state,
      aiQuery: action.payload,
      aiIntroDismissed: state.aiIntroDismissed || Boolean(action.payload)
    }),
    dismissAiIntro: (state) => ({ ...state, aiIntroDismissed: true })
  }
});

export const { setSearchMode, toggleAiAnalysis, setAiQuery, dismissAiIntro } =
  searchModeSlice.actions;

export const useSearchMode = () => useSelector((state) => state.searchMode);

export default searchModeSlice.reducer;