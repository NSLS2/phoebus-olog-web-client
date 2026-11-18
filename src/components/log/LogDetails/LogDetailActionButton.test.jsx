import { afterEach, describe, expect, test } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import LogDetailActionButton from "./LogDetailActionButton";
import { setupStore } from "features/store";

const SEARCH = "?tags=alarm&searchMode=ai&aiQuery=A%26B";

const renderAt = (url) =>
  render(
    <Provider
      store={setupStore({
        auth: { user: { userName: "jsmith" }, showLogin: false }
      })}
    >
      <MemoryRouter initialEntries={[url]}>
        <LogDetailActionButton log={{ id: 103 }} />
      </MemoryRouter>
    </Provider>
  );

afterEach(cleanup);

describe("edit and reply keep the search of the page they start from", () => {
  test("reply", () => {
    renderAt(`/logs/103${SEARCH}`);

    expect(screen.getByRole("link").getAttribute("href")).toBe(
      `/logs/103/reply${SEARCH}`
    );
  });

  test("edit", () => {
    renderAt(`/logs/103${SEARCH}`);

    fireEvent.click(screen.getByRole("button"));

    expect(
      screen.getByRole("menuitem", { name: /Edit log/ }).getAttribute("href")
    ).toBe(`/logs/103/edit${SEARCH}`);
  });

  test("without a search the links are as before", () => {
    renderAt("/logs/103");

    expect(screen.getByRole("link").getAttribute("href")).toBe(
      "/logs/103/reply"
    );
  });
});
