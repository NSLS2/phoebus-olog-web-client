import { Stack, Typography } from "@mui/material";
import { AIAnalysisPanel } from "components/search/AIAnalysisPanel";
import LogDetailsWithReplies from "./LogDetailsWithReplies";
import LogContainer from "components/log/LogContainer";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { AIIntro } from "components/search/AIIntro";
import {
  isAIMode,
  dismissAiIntro,
  useSearchMode
} from "features/searchModeReducer";

const LogDetailsContainer = ({ id }) => {
  const dispatch = useDispatch();
  const { mode, aiIntroDismissed } = useSearchMode();
  const isAiMode = isAIMode(mode);

  useEffect(() => {
    if (id && isAiMode && !aiIntroDismissed) {
      dispatch(dismissAiIntro());
    }
  }, [id, isAiMode, aiIntroDismissed, dispatch]);

  return (
    <Stack sx={{ minHeight: 0, minWidth: 0, overflow: "auto" }}>
      {isAiMode && <AIAnalysisPanel />}
      {id ? (
        <LogContainer
          id={id}
          renderLog={({ log }) => <LogDetailsWithReplies log={log} />}
        />
      ) : isAiMode && !aiIntroDismissed ? (
        <AIIntro onDismiss={() => dispatch(dismissAiIntro())} />
      ) : (
        <Stack p={4}>
          <Typography>Select a log to view its details</Typography>
        </Stack>
      )}
    </Stack>
  );
};

export default LogDetailsContainer;
