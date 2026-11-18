import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { http, HttpResponse } from "msw";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within
} from "@testing-library/react";
import { Provider } from "react-redux";
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
  useParams
} from "react-router-dom";
import { ThemeProvider } from "@mui/material";
import SearchBar from "components/search/SearchBar";
import { AISearchResults } from "components/search/AISearchResults";
import LogDetailsContainer from "components/log/LogDetails/LogDetailsContainer";
import { aiErrorMessage } from "components/search/useAiSearch";
import { ologApi } from "api/ologApi";
import customization from "config/customization";
import { setupStore } from "features/store";
import { isAIMode, useSearchMode } from "features/searchModeReducer";
import { server } from "mocks/server";
import { theme } from "src/config/theme";

const hit = (id, title) => ({
  content: `Entry ${id} text`,
  metadata: { id: String(id), title, owner: "jsmith" }
});

const HITS = {
  alarm: [hit(11, "Fill pattern alarm"), hit(12, "Kicker timing")],
  vacuum: [hit(21, "Vacuum leak"), hit(22, "Ion pump spike")]
};

const searchOk = (body) => HttpResponse.json({ hits: HITS[body.query] ?? [] });
const analyzeOk = (body) =>
  HttpResponse.json({
    analysis: `Analysis of "${body.query}" from ${body.hits.map((h) => h.metadata.id)}: see #1 and #2.`,
    hits: body.hits
  });
const serverError = () => new HttpResponse(null, { status: 500 });

/** Mocks the two AI endpoints and records the request bodies they receive. */
const mockAi = ({ search = searchOk, analyze = analyzeOk } = {}) => {
  const calls = { search: [], analyze: [] };
  server.use(
    http.post("*/ai/search/semantic", async ({ request }) => {
      const body = await request.json();
      calls.search.push(body);
      return search(body, calls.search.length);
    }),
    http.post("*/ai/search/analyze", async ({ request }) => {
      const body = await request.json();
      calls.analyze.push(body);
      return analyze(body, calls.analyze.length);
    }),
    // replies of an opened entry
    http.get("*/logs", () => HttpResponse.json([]))
  );
  return calls;
};

const analyzed = (calls) =>
  calls.analyze.map((body) => [
    body.query,
    body.hits.map((h) => h.metadata.id)
  ]);

const Page = () => {
  const { mode } = useSearchMode();
  const location = useLocation();
  const { id } = useParams();
  return (
    <>
      <SearchBar />
      {isAIMode(mode) && <AISearchResults />}
      <LogDetailsContainer id={id} />
      <output data-testid="location">
        {location.pathname + location.search}
      </output>
    </>
  );
};

const renderApp = (url = "/") => {
  const store = setupStore({});
  render(
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <MemoryRouter initialEntries={[url]}>
          <Routes>
            <Route
              path="/"
              element={<Page />}
            />
            <Route
              path="/logs/:id"
              element={<Page />}
            />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    </Provider>
  );
  return store;
};

const AI = "/?searchMode=ai";
const AI_WITH_ANALYSIS = "/?searchMode=ai&aiAnalysis=true";

const location = () => screen.getByTestId("location").textContent;
const questionBox = () => screen.getByPlaceholderText("AI Search");
const analysisSwitch = () =>
  screen.getByRole("checkbox", { name: "toggle ai analysis" });
const analysisPanel = () =>
  screen.queryByRole("region", { name: "AI analysis" });
const ask = (question) => {
  fireEvent.change(questionBox(), { target: { value: question } });
  fireEvent.submit(questionBox().closest("form"));
};
const nextTick = () => new Promise((resolve) => setTimeout(resolve, 50));

afterEach(() => {
  cleanup();
  customization.AI_SEARCH_ENABLED = undefined;
});

describe("AI search is opt-in", () => {
  test.each([undefined, "false", "VITE_APP_AI_SEARCH_ENABLED"])(
    "is not offered when the setting is %s",
    async (setting) => {
      customization.AI_SEARCH_ENABLED = setting;
      const calls = mockAi();

      renderApp(`${AI}&aiQuery=alarm`);
      await nextTick();

      expect(screen.queryByRole("button", { name: "ai search" })).toBeNull();
      expect(screen.getByPlaceholderText("Search").value).toBe("");
      expect(calls.search).toHaveLength(0);
    }
  );
});

describe("AI search", () => {
  beforeEach(() => {
    customization.AI_SEARCH_ENABLED = "true";
  });

  test("keeps the mode, question and analysis switch in the URL", async () => {
    const calls = mockAi();
    renderApp("/");

    fireEvent.click(screen.getByRole("button", { name: "ai search" }));
    ask("  alarm  ");
    await screen.findByText(/Fill pattern alarm/);

    expect(location()).toBe("/?searchMode=ai&aiQuery=alarm");
    expect(calls.search.map((body) => body.query)).toEqual(["alarm"]);
    expect(calls.analyze).toHaveLength(0);

    fireEvent.click(analysisSwitch());
    await screen.findByText(/Analysis of "alarm" from 11,12/);

    expect(location()).toBe("/?searchMode=ai&aiQuery=alarm&aiAnalysis=true");
  });

  test("restores everything from the URL", async () => {
    mockAi();
    renderApp(`${AI_WITH_ANALYSIS}&aiQuery=alarm`);

    await screen.findByText(/Analysis of "alarm" from 11,12/);

    expect(questionBox().value).toBe("alarm");
    expect(analysisSwitch().checked).toBe(true);
    expect(screen.getByText(/Kicker timing/)).toBeTruthy();
  });

  test("a blank question sends nothing", async () => {
    const calls = mockAi();
    renderApp(AI);

    ask("   ");
    await nextTick();

    expect(calls.search).toHaveLength(0);
    expect(screen.getByText(/Ask a question above/)).toBeTruthy();
    expect(location()).toBe(AI);
  });

  test("a new question is analysed once, with its own hits", async () => {
    const calls = mockAi();
    renderApp(`${AI_WITH_ANALYSIS}&aiQuery=alarm`);
    await screen.findByText(/Analysis of "alarm"/);

    ask("vacuum");
    await screen.findByText(/Analysis of "vacuum" from 21,22/);

    expect(analyzed(calls)).toEqual([
      ["alarm", ["11", "12"]],
      ["vacuum", ["21", "22"]]
    ]);
    expect(screen.queryByText(/Fill pattern alarm/)).toBeNull();
  });

  test("a question without hits is not analysed and shows no old analysis", async () => {
    const calls = mockAi();
    renderApp(`${AI_WITH_ANALYSIS}&aiQuery=alarm`);
    await screen.findByText(/Analysis of "alarm"/);

    ask("unknown");
    await screen.findByText("No results found");

    expect(analysisPanel()).toBeNull();
    expect(calls.analyze).toHaveLength(1);
  });

  test("clearing the question removes results and analysis and sends nothing", async () => {
    const calls = mockAi();
    renderApp(`${AI_WITH_ANALYSIS}&aiQuery=alarm`);
    await screen.findByText(/Analysis of "alarm"/);

    fireEvent.click(screen.getByTestId("ClearIcon").closest("button"));
    await screen.findByText(/Ask a question above/);
    await nextTick();

    expect(analysisPanel()).toBeNull();
    expect(location()).toBe(AI_WITH_ANALYSIS);
    expect(calls.search).toHaveLength(1);
    expect(calls.analyze).toHaveLength(1);
  });

  test("a failed search shows no earlier results and can be tried again", async () => {
    const calls = mockAi({
      search: (body) =>
        body.query === "broken" ? serverError() : searchOk(body)
    });
    const brokenCalls = () =>
      calls.search.filter((body) => body.query === "broken").length;
    renderApp(`${AI_WITH_ANALYSIS}&aiQuery=alarm`);
    await screen.findByText(/Analysis of "alarm"/);

    ask("broken");
    await screen.findByText(
      /AI search failed: the AI service returned an error/
    );

    expect(screen.queryByText(/Fill pattern alarm/)).toBeNull();
    expect(analysisPanel()).toBeNull();
    expect(calls.analyze).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await waitFor(() => expect(brokenCalls()).toBe(2));

    await screen.findByText(/AI search failed/);
    ask("broken");
    await waitFor(() => expect(brokenCalls()).toBe(3));
  });

  test("a service without AI search says so and offers no retry", async () => {
    mockAi({ search: () => new HttpResponse(null, { status: 404 }) });
    renderApp(`${AI}&aiQuery=alarm`);

    await screen.findByText(/AI search is not available on this log service/);

    expect(screen.queryByRole("button", { name: "Retry" })).toBeNull();
  });

  test("a failed analysis keeps the results and can be tried again", async () => {
    const calls = mockAi({
      analyze: (body, attempt) =>
        attempt === 1 ? serverError() : analyzeOk(body)
    });
    renderApp(`${AI_WITH_ANALYSIS}&aiQuery=alarm`);

    await screen.findByText(
      /AI analysis failed: the AI service returned an error/
    );
    expect(screen.getByText(/Fill pattern alarm/)).toBeTruthy();

    fireEvent.click(
      within(analysisPanel()).getByRole("button", { name: "Retry" })
    );
    await screen.findByText(/Analysis of "alarm"/);

    expect(calls.analyze).toHaveLength(2);
  });

  test("switching the analysis or the mode off and on asks the service once", async () => {
    const calls = mockAi();
    renderApp(`${AI_WITH_ANALYSIS}&aiQuery=alarm`);
    await screen.findByText(/Analysis of "alarm"/);

    fireEvent.click(analysisSwitch());
    await waitFor(() => expect(analysisPanel()).toBeNull());
    fireEvent.click(analysisSwitch());
    await screen.findByText(/Analysis of "alarm"/);

    fireEvent.click(screen.getByRole("button", { name: "query search" }));
    await screen.findByPlaceholderText("Search");
    fireEvent.click(screen.getByRole("button", { name: "ai search" }));
    await screen.findByText(/Analysis of "alarm"/);

    expect(questionBox().value).toBe("alarm");
    expect(analysisSwitch().checked).toBe(true);
    expect(calls.search).toHaveLength(1);
    expect(calls.analyze).toHaveLength(1);
  });

  test("a citation opens the entry it cites and marks it in the results", async () => {
    mockAi();
    renderApp(`${AI_WITH_ANALYSIS}&aiQuery=alarm`);
    await screen.findByText(/Analysis of "alarm"/);

    fireEvent.click(within(analysisPanel()).getByText("#2"));

    await waitFor(() =>
      expect(location()).toBe(
        "/logs/12?searchMode=ai&aiAnalysis=true&aiQuery=alarm"
      )
    );
    const row = (id) => document.getElementById(`ai-search-result-${id}`);
    expect(row(12).getAttribute("aria-current")).toBe("true");
    expect(row(11).getAttribute("aria-current")).toBeNull();
    expect(analysisPanel()).not.toBeNull();
  });

  test("the intro is shown on every entry to AI mode until it is dismissed", async () => {
    mockAi();
    const intro = () => screen.queryByText(/Introducing Olog/);
    const enterAiMode = () =>
      fireEvent.click(screen.getByRole("button", { name: "ai search" }));
    const leaveAiMode = () =>
      fireEvent.click(screen.getByRole("button", { name: "query search" }));
    renderApp("/");
    expect(intro()).toBeNull();

    enterAiMode();
    expect(intro()).not.toBeNull();
    fireEvent.click(
      screen.getByRole("button", { name: "dismiss introduction" })
    );
    expect(intro()).toBeNull();

    leaveAiMode();
    enterAiMode();
    expect(intro()).not.toBeNull();
    ask("alarm");
    await screen.findByText(/Kicker timing/);
    expect(intro()).toBeNull();

    // back in AI mode the question is kept and the intro is shown again
    leaveAiMode();
    enterAiMode();
    expect(questionBox().value).toBe("alarm");
    expect(intro()).not.toBeNull();

    fireEvent.click(await screen.findByRole("link", { name: /Kicker timing/ }));
    await waitFor(() => expect(location()).toMatch(/^\/logs\/12\?/));
    expect(intro()).toBeNull();
  });

  test("a page opened with a question does not start with the intro", () => {
    window.history.replaceState(null, "", "/?searchMode=ai&aiQuery=alarm");
    try {
      expect(setupStore({}).getState().searchMode.aiIntroDismissed).toBe(true);
    } finally {
      window.history.replaceState(null, "", "/");
    }
    expect(setupStore({}).getState().searchMode.aiIntroDismissed).toBe(false);
  });

  test("a result is a link to its entry", async () => {
    mockAi();
    renderApp(`${AI}&aiQuery=alarm`);
    await screen.findByText(/Kicker timing/);

    const link = screen.getByRole("link", { name: /Kicker timing/ });
    expect(link.getAttribute("href")).toBe(
      "/logs/12?searchMode=ai&aiQuery=alarm"
    );

    fireEvent.click(link);

    await waitFor(() =>
      expect(location()).toBe("/logs/12?searchMode=ai&aiQuery=alarm")
    );
  });

  test("a failed repeat of the same question hides its earlier answers", async () => {
    mockAi({
      search: (body, attempt) =>
        attempt === 1 ? searchOk(body) : serverError()
    });
    renderApp(`${AI_WITH_ANALYSIS}&aiQuery=alarm`);
    await screen.findByText(/Analysis of "alarm"/);

    ask("alarm");
    await screen.findByText(/AI search failed/);

    expect(screen.queryByText(/Fill pattern alarm/)).toBeNull();
    expect(analysisPanel()).toBeNull();
  });

  test("a search refused before signing in is asked again after signing in", async () => {
    let signedIn = false;
    const calls = mockAi({
      search: (body) =>
        signedIn ? searchOk(body) : new HttpResponse(null, { status: 401 })
    });
    server.use(
      http.post("*/login", () => {
        signedIn = true;
        return HttpResponse.json({ userName: "jsmith", roles: [] });
      })
    );
    const store = renderApp(`${AI}&aiQuery=alarm`);

    await screen.findByText(/Sign in to use AI search/);
    expect(screen.getByRole("button", { name: "Retry" })).toBeTruthy();

    store.dispatch(
      ologApi.endpoints.login.initiate({ username: "jsmith", password: "x" })
    );

    await screen.findByText(/Fill pattern alarm/);
    expect(screen.queryByText(/Sign in to use AI search/)).toBeNull();
    expect(calls.search).toHaveLength(2);
  });

  test("asking the same question again keeps the analysis of unchanged hits", async () => {
    const calls = mockAi();
    renderApp(`${AI_WITH_ANALYSIS}&aiQuery=alarm`);
    await screen.findByText(/Analysis of "alarm"/);

    ask("alarm");
    await waitFor(() => expect(calls.search).toHaveLength(2));
    await screen.findByText(/Analysis of "alarm"/);

    expect(calls.analyze).toHaveLength(1);
  });

  test("a change of user asks for the search and the analysis again", async () => {
    const calls = mockAi();
    server.use(
      http.post("*/login", () =>
        HttpResponse.json({ userName: "mdoe", roles: [] })
      )
    );
    const store = renderApp(`${AI_WITH_ANALYSIS}&aiQuery=alarm`);
    await screen.findByText(/Analysis of "alarm"/);

    store.dispatch(
      ologApi.endpoints.login.initiate({ username: "mdoe", password: "x" })
    );

    await waitFor(() => expect(calls.analyze).toHaveLength(2));
    await screen.findByText(/Analysis of "alarm"/);
    expect(calls.search).toHaveLength(2);
  });
});

describe("aiErrorMessage", () => {
  test.each([
    [{ status: "TIMEOUT_ERROR" }, /timed out/],
    [{ status: "FETCH_ERROR" }, /cannot be reached/],
    [{ status: 400 }, /rephrase/],
    [{ status: 401 }, /Sign in/],
    [{ status: 403 }, /not allowed/],
    [{ status: "PARSING_ERROR", originalStatus: 404 }, /not available/],
    [{ status: 502 }, /returned an error/]
  ])("%o", (error, expected) => {
    expect(aiErrorMessage(error, "AI search")).toMatch(expected);
  });
});
