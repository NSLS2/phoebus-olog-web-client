import { useEffect, useRef } from "react";
import {
  Alert,
  Button,
  LinearProgress,
  Stack,
  Typography
} from "@mui/material";
import { Link as RouterLink, useLocation, useParams } from "react-router-dom";
import {
  aiErrorMessage,
  isRetryable,
  useAiSearch
} from "components/search/useAiSearch";

const formatDate = (ms) => (ms ? new Date(Number(ms)).toLocaleString() : null);

export const AISearchResults = () => {
  const location = useLocation();
  const { id: currentLogEntryId } = useParams();
  const { aiQuery, search, hits } = useAiSearch();
  const { isFetching, error, refetch } = search;
  const selectedRef = useRef(null);

  // bring the open entry into view, e.g. after following a citation
  useEffect(() => {
    selectedRef.current?.scrollIntoView?.({ block: "nearest" });
  }, [currentLogEntryId, hits]);

  if (!aiQuery) {
    return (
      <Stack
        p={4}
        sx={{ backgroundColor: "#fafafa" }}
      >
        <Typography color="text.secondary">
          Ask a question above to search with AI
        </Typography>
      </Stack>
    );
  }

  return (
    <Stack
      sx={{
        minWidth: 0,
        minHeight: 0,
        overflow: "auto",
        backgroundColor: "#fafafa"
      }}
    >
      {isFetching && <LinearProgress />}
      {error && !isFetching && (
        <Alert
          severity="error"
          sx={{ m: 2 }}
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
          {aiErrorMessage(error, "AI search")}
        </Alert>
      )}

      {!isFetching && !error && hits?.length === 0 && (
        <Typography
          p={4}
          color="text.secondary"
        >
          No results found
        </Typography>
      )}

      {hits?.map((hit, i) => {
        const id = hit.metadata?.id;
        const hasEntry = id !== undefined && id !== null;
        const selected = hasEntry && `${id}` === `${currentLogEntryId}`;
        // a real link, so a hit can be reached and opened from the keyboard
        const linkProps = hasEntry
          ? { component: RouterLink, to: `/logs/${id}${location.search}` }
          : {};
        return (
          <Stack
            key={id ?? i}
            id={`ai-search-result-${id ?? i}`}
            ref={selected ? selectedRef : null}
            aria-current={selected ? "true" : undefined}
            {...linkProps}
            p={2}
            gap={0.5}
            sx={{
              color: "inherit",
              textDecoration: "none",
              borderBottom: "1px solid #eee",
              backgroundColor: selected ? "#0099dc24" : "inherit",
              "&:hover": {
                backgroundColor: selected ? "#0099dc24" : "#f5f5f5"
              },
              "&:focus-visible": {
                outline: "2px solid #0099dc",
                outlineOffset: "-2px"
              }
            }}
          >
            <Typography
              fontWeight={600}
              fontSize="0.9rem"
            >
              #{i + 1} · {hit.metadata?.title ?? "Untitled"}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical"
              }}
            >
              {hit.content}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
            >
              {hit.metadata?.owner}
              {formatDate(hit.metadata?.createdDate) &&
                ` • ${formatDate(hit.metadata.createdDate)}`}
            </Typography>
          </Stack>
        );
      })}
    </Stack>
  );
};
