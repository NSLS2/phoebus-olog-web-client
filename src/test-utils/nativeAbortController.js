// eslint-disable-next-line import/no-unresolved -- Node built-in, tests only
import { transferableAbortController } from "node:util";

// jsdom replaces AbortController with its own, and Node's Request (which RTK
// Query uses for every call) rejects that one's signals. Put Node's back.
const NodeAbortController = transferableAbortController().constructor;
globalThis.AbortController = NodeAbortController;
globalThis.AbortSignal = new NodeAbortController().signal.constructor;
