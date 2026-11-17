import { Stack } from "@mui/material";
import SimpleSearch from "components/search/SimpleSearch";
import AISearch from "components/search/AISearch";
import { SearchModeToggle } from "components/search/SearchModeToggle";
import { AIAnalysisSwitch } from "components/search/AIAnalysisSwitch";
import { isAiSearchEnabled } from "config/customization";
import {
  SEARCH_MODES,
  isAIMode,
  useSearchMode
} from "features/searchModeReducer";

const SearchBar = ({ actions }) => {
  const { mode, setMode, toggleAnalysis } = useSearchMode();
  const isAiMode = isAIMode(mode);

  // without AI search this is the plain search box, as it always was
  if (!isAiSearchEnabled()) {
    return (
      <>
        <SimpleSearch />
        {actions}
      </>
    );
  }

  return (
    <Stack
      gap={0.5}
      sx={{ flex: 3 }}
    >
      {/* row: search input + (in AI mode) the analysis switch */}
      <Stack
        flexDirection="row"
        alignItems="center"
        gap={1}
      >
        {isAiMode ? <AISearch /> : <SimpleSearch />}
        {isAiMode && (
          <AIAnalysisSwitch
            enabled={mode === SEARCH_MODES.AI_ANALYSIS}
            onToggle={toggleAnalysis}
          />
        )}
        {actions}
      </Stack>
      {/* rectangles under the input */}
      <Stack
        alignItems="center"
        sx={{ padding: "0 14px 0 30px" }}
      >
        <SearchModeToggle
          mode={mode}
          onChange={setMode}
        />
      </Stack>
    </Stack>
  );
};

export default SearchBar;
