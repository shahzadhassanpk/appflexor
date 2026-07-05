import React from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import Signup from "@/pages/signup";
function Router() {
  return /* @__PURE__ */ React.createElement(Switch, null, /* @__PURE__ */ React.createElement(Route, { path: "/", component: Signup }), /* @__PURE__ */ React.createElement(Route, { path: "*", component: Signup }));
}
export default function App() {
  return /* @__PURE__ */ React.createElement(WouterRouter, { base: import.meta.env.BASE_URL.replace(/\/$/, "") }, /* @__PURE__ */ React.createElement(Router, null));
}
