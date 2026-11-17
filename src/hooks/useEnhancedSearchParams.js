import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import queryStringParser from "query-string";

const options = {
  arrayFormat: "comma",
  sort: false,
  encode: false,
  skipNull: true,
  types: {
    level: "string[]",
    logbooks: "string[]",
    tags: "string[]"
  }
};

/**
 * URL params that hold the AI search state (mode, question, analysis switch).
 * They are not log search filters: they are left out of searchParams and
 * setSearchParams keeps them as they are.
 */
export const AI_PARAMS = {
  MODE: "searchMode",
  QUERY: "aiQuery",
  ANALYSIS: "aiAnalysis"
};
const AI_PARAM_KEYS = Object.values(AI_PARAMS);

export function withoutParams(searchParams) {
  const copy = { ...searchParams };
  delete copy.query;
  delete copy.groupedReplies;
  delete copy.condensedEntries;
  return copy;
}

const isEmptyObject = (obj) => {
  return Object.keys(obj).length === 0;
};

export const removeEmptyKeys = (params) => {
  const cleanedParams = {};

  Object.entries(withoutParams(params)).forEach(([key, value]) => {
    if (
      value === null ||
      value === undefined ||
      (Array.isArray(value) && value.length === 0)
    ) {
      return;
    }

    if (typeof value === "string" && value.trim() === "") {
      return;
    }

    cleanedParams[key] = value;
  });

  return cleanedParams;
};

export const useEnhancedSearchParams = () => {
  const [params, setParams] = useSearchParams();

  const toSearchParams = useCallback((searchParams) => {
    return queryStringParser.parse(searchParams, options);
  }, []);

  const toQueryString = useCallback((searchParams) => {
    return queryStringParser.stringify(searchParams, options);
  }, []);

  const searchParams = useMemo(() => {
    const filterParams = new URLSearchParams(params);
    AI_PARAM_KEYS.forEach((key) => filterParams.delete(key));
    return queryStringParser.parse(
      decodeURIComponent(filterParams.toString()),
      options
    );
  }, [params]);

  const setSearchParams = useCallback(
    (newParams) => {
      setParams((prev) => {
        const next = new URLSearchParams(
          toQueryString(removeEmptyKeys(newParams))
        );
        AI_PARAM_KEYS.forEach((key) => {
          next.delete(key);
          if (prev.has(key)) {
            next.set(key, prev.get(key));
          }
        });
        return next;
      });
    },
    [setParams, toQueryString]
  );

  const isSearchActive = useMemo(() => {
    return !isEmptyObject(searchParams);
  }, [searchParams]);

  return {
    searchParams,
    toSearchParams,
    toQueryString,
    setSearchParams,
    isSearchActive
  };
};
