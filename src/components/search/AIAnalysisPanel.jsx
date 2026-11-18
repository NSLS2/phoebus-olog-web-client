import { useMemo } from "react";
import { Alert, Box, Button, Typography } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import {
  aiErrorMessage,
  isRetryable,
  useAiSearch
} from "components/search/useAiSearch";
import { renderAnalysis } from "components/search/renderAnalysis";

export const AIAnalysisPanel = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { analysis, analysisRequested } = useAiSearch();
  const { currentData, isFetching, error, refetch } = analysis;

  const analysisHtml = useMemo(
    () =>
      currentData?.analysis
        ? renderAnalysis(currentData.analysis, currentData.hits ?? [])
        : null,
    [currentData]
  );

  // a citation opens the entry it cites, like clicking that search result
  const onAnalysisClick = (e) => {
    const target = e.target;
    if (!(target instanceof Element)) {
      return;
    }
    const entryId = target.closest("a[data-entry-id]")?.dataset.entryId;
    if (entryId) {
      e.preventDefault();
      navigate(`/logs/${encodeURIComponent(entryId)}${location.search}`);
    }
  };

  if (!analysisRequested) {
    return null;
  }

  return (
    <Box
      component="section"
      aria-label="AI analysis"
      sx={{
        m: 2,
        p: 2,
        backgroundColor: "#f5f9fc",
        borderRadius: "8px",
        border: "1px solid #d6e7f2",
        flexShrink: 0,
        // leave room below for the entry a citation opens
        maxHeight: "40vh",
        overflow: "auto",
        "& a": { color: "#0099dc", fontWeight: 600 }
      }}
    >
      <Typography
        fontWeight={600}
        gutterBottom
      >
        Analysis
      </Typography>
      {isFetching && (
        <Typography
          variant="body2"
          color="text.secondary"
        >
          Analyzing results…
        </Typography>
      )}
      {error && !isFetching && (
        <Alert
          severity="warning"
          action={
            isRetryable(error) ? (
              <Button
                color="inherit"
                size="small"
                onClick={() => refetch()}
              >
                Retry
              </Button>
            ) : null
          }
        >
          {aiErrorMessage(error, "AI analysis")}
        </Alert>
      )}
      {analysisHtml && !isFetching && !error && (
        <Box
          onClick={onAnalysisClick}
          sx={{ fontSize: "0.9rem", "& p": { my: 0.5 } }}
          dangerouslySetInnerHTML={{ __html: analysisHtml }}
        />
      )}
    </Box>
  );
};
