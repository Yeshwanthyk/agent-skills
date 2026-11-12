// diff: a call tree with +/−/~ markers in palette colours and a line-number gutter (the .viz source line of each call).
// Same rows, keys and folding as tree.ts.
import { createTreeChart } from "./tree";
export default createTreeChart({ gutter: true });
