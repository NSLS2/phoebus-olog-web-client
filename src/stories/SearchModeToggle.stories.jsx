import { useState } from "react";
import { SearchModeToggle } from "components/search/SearchModeToggle";
import { AIAnalysisSwitch } from "components/search/AIAnalysisSwitch";
import { SEARCH_MODES } from "features/searchModeReducer";

export default {
  title: "Search/SearchModeToggle"
};

// interactive version with local state so you can click it
export const Default = () => {
  const [mode, setMode] = useState(SEARCH_MODES.QUERY);
  return <SearchModeToggle mode={mode} onChange={setMode} />;
};

// frozen snapshots of each state
export const QuerySelected = () => (
  <SearchModeToggle mode={SEARCH_MODES.QUERY} onChange={() => {}} />
);

export const AISelected = () => (
  <SearchModeToggle mode={SEARCH_MODES.AI} onChange={() => {}} />
);

export const AIAnalysisSelected = () => (
  <SearchModeToggle mode={SEARCH_MODES.AI_ANALYSIS} onChange={() => {}} />
);

export const AnalysisSwitch = () => {
  const [mode, setMode] = useState(SEARCH_MODES.AI);
  return (
    <AIAnalysisSwitch
      enabled={mode === SEARCH_MODES.AI_ANALYSIS}
      onToggle={() =>
        setMode(
          mode === SEARCH_MODES.AI_ANALYSIS
            ? SEARCH_MODES.AI
            : SEARCH_MODES.AI_ANALYSIS
        )
      }
    />
  );
};