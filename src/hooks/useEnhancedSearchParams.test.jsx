import { afterEach, describe, expect, test } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { useEnhancedSearchParams } from "src/hooks/useEnhancedSearchParams";

const renderAt = (url) =>
  renderHook(
    () => ({ ...useEnhancedSearchParams(), search: useLocation().search }),
    {
      wrapper: ({ children }) => (
        <MemoryRouter initialEntries={[url]}>{children}</MemoryRouter>
      )
    }
  );

afterEach(cleanup);

describe("useEnhancedSearchParams and the AI search params", () => {
  test("AI params are not search filters", () => {
    const { result } = renderAt(
      "/?tags=a,b&searchMode=ai&aiQuery=What%20about%20A%26B%2C%20C%3F&aiAnalysis=true"
    );

    expect(result.current.searchParams).toEqual({ tags: ["a", "b"] });
  });

  test("an AI-only URL is not an active search", () => {
    const { result } = renderAt("/?searchMode=ai&aiQuery=alarm");

    expect(result.current.isSearchActive).toBe(false);
  });

  test("changing the filters keeps the AI params", () => {
    const { result } = renderAt("/?tags=a&searchMode=ai&aiQuery=A%26B");

    act(() => result.current.setSearchParams({ title: "beam" }));

    const params = new URLSearchParams(result.current.search);
    expect(Object.fromEntries(params)).toEqual({
      title: "beam",
      searchMode: "ai",
      aiQuery: "A&B"
    });
    expect(result.current.searchParams).toEqual({ title: "beam" });
  });

  test("resetting the filters keeps the AI params", () => {
    const { result } = renderAt("/?tags=a&owner=me&searchMode=ai");

    act(() => result.current.setSearchParams({}));

    expect(result.current.search).toBe("?searchMode=ai");
  });

  test("filters cannot set AI params", () => {
    const { result } = renderAt("/?tags=a");

    act(() =>
      result.current.setSearchParams({ tags: ["a"], searchMode: "ai" })
    );

    expect(result.current.search).toBe("?tags=a");
  });

  test("without AI params the URL is written as before", () => {
    const { result } = renderAt("/");

    act(() =>
      result.current.setSearchParams({ tags: ["a", "b"], title: "beam dump" })
    );

    expect(result.current.search).toBe("?tags=a%2Cb&title=beam+dump");
  });
});
