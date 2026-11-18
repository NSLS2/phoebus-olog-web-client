import { useMemo } from "react";
import { ologApi } from "api/ologApi";
import { SEARCH_MODES, useSearchMode } from "features/searchModeReducer";
import { useEnhancedSearchParams } from "src/hooks/useEnhancedSearchParams";

const NOT_RETRYABLE = [400, 404];

const httpStatus = (error) =>
  typeof error?.status === "number" ? error.status : error?.originalStatus;

export const isRetryable = (error) =>
  !NOT_RETRYABLE.includes(httpStatus(error));

/**
 * What to tell the user when an AI request fails. `subject` is "AI search" or
 * "AI analysis".
 */
export const aiErrorMessage = (error, subject) => {
  if (error?.status === "FETCH_ERROR") {
    return `${subject} failed: the log service cannot be reached`;
  }
  if (error?.status === "TIMEOUT_ERROR") {
    return `${subject} timed out: the AI service took too long to answer`;
  }
  switch (httpStatus(error)) {
    case 400:
      return `${subject} could not use this question, please rephrase it`;
    case 401:
      return `Sign in to use ${subject}`;
    case 403:
      return `You are not allowed to use ${subject}`;
    case 404:
      return `${subject} is not available on this log service`;
    default:
      return `${subject} failed: the AI service returned an error`;
  }
};

/**
 * The AI search for the question and filters in the URL, and the analysis of
 * its hits. Results and analysis are read with currentData, so nothing from an
 * earlier question or an earlier list of hits is ever returned.
 */
export const useAiSearch = () => {
  const { aiQuery, mode } = useSearchMode();
  const { searchParams } = useEnhancedSearchParams();

  const searchArgs = useMemo(
    () => ({
      query: aiQuery,
      start: searchParams.start,
      end: searchParams.end,
      logbooks: searchParams.logbooks,
      tags: searchParams.tags,
      level: searchParams.level,
      owner: searchParams.owner,
      title: searchParams.title,
      desc: searchParams.desc
    }),
    [aiQuery, searchParams]
  );

  const search = ologApi.endpoints.aiSearch.useQuery(searchArgs, {
    skip: !aiQuery
  });
  // no hits while the search runs or after it failed: a failed repeat of the
  // same question must not leave its earlier answers under the error
  const hits =
    search.isFetching || search.isError ? undefined : search.currentData?.hits;

  const analysisArgs = useMemo(
    () => ({ query: aiQuery, hits }),
    [aiQuery, hits]
  );
  const analysisRequested =
    mode === SEARCH_MODES.AI_ANALYSIS && Boolean(hits?.length);
  const analysis = ologApi.endpoints.aiAnalyze.useQuery(analysisArgs, {
    skip: !analysisRequested
  });

  return { aiQuery, search, hits, analysis, analysisRequested };
};
