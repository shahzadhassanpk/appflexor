import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
export default function NotFound() {
  return /* @__PURE__ */ React.createElement("div", { className: "min-h-screen w-full flex items-center justify-center bg-gray-50" }, /* @__PURE__ */ React.createElement(Card, { className: "w-full max-w-md mx-4" }, /* @__PURE__ */ React.createElement(CardContent, { className: "pt-6" }, /* @__PURE__ */ React.createElement("div", { className: "flex mb-4 gap-2" }, /* @__PURE__ */ React.createElement(AlertCircle, { className: "h-8 w-8 text-red-500" }), /* @__PURE__ */ React.createElement("h1", { className: "text-2xl font-bold text-gray-900" }, "404 Page Not Found")), /* @__PURE__ */ React.createElement("p", { className: "mt-4 text-sm text-gray-600" }, "Did you forget to add the page to the router?"))));
}
