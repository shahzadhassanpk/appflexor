const noop = () => {};
const Plotly = new Proxy(
  { newPlot: noop, purge: noop, react: noop },
  { get: (t, k) => (k in t ? t[k] : noop) }
);
export default Plotly;
export const s = noop;
export const name = "";
export const newPlot = noop;
export const purge = noop;
