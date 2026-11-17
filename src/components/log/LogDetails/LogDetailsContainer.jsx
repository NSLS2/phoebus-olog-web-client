import { Stack, Typography } from "@mui/material";
import LogDetailsWithReplies from "./LogDetailsWithReplies";
import LogContainer from "components/log/LogContainer";
import { AIAnalysisPanel } from "components/search/AIAnalysisPanel";
import { AIIntro } from "components/search/AIIntro";
import { isAIMode, useSearchMode } from "features/searchModeReducer";

const LogDetailsContainer = ({ id }) => {
  const { mode, aiQuery, aiIntroDismissed, dismissIntro } = useSearchMode();
  const isAiMode = isAIMode(mode);

  let details;
  if (id) {
    details = (
      <LogContainer
        id={id}
        renderLog={({ log }) => <LogDetailsWithReplies log={log} />}
      />
    );
  } else if (isAiMode && !aiQuery && !aiIntroDismissed) {
    details = <AIIntro onDismiss={dismissIntro} />;
  } else {
    details = (
      <Stack p={4}>
        <Typography>Select a log to view its details</Typography>
      </Stack>
    );
  }

  if (!isAiMode) {
    return details;
  }

  return (
    <Stack sx={{ minHeight: 0, minWidth: 0, overflow: "auto" }}>
      <AIAnalysisPanel />
      {details}
    </Stack>
  );
};

export default LogDetailsContainer;
