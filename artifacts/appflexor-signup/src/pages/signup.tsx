import React, { useState } from "react";
import { HiInboxArrowDown } from "react-icons/hi2";
import logoSrc from "../assets/appflexor-logo.png";

/* ── Static data ──────────────────────────────────────────────────────────── */
const FEATURES = [
  {
    title: "Build UI",
    desc: "Pages, Posts, Forms, Data Tables",
    bg: "#eff6ff",
    ic: "#3b82f6",
    icon: (
      <svg
        width="15"
        height="15"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    title: "Manage Tasks",
    desc: "Complete work with Task inbox",
    bg: "#fefce8",
    ic: "#eab308",
    icon: (
      <svg
        width="15"
        height="15"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
        />
      </svg>
    ),
  },
  {
    title: "Automate",
    desc: "Link forms with workflows",
    bg: "#f0fdf4",
    ic: "#22c55e",
    icon: (
      <svg
        width="15"
        height="15"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        />
      </svg>
    ),
  },
  {
    title: "Drag-n-Drop",
    desc: "Design faster. Deploy quicker.",
    bg: "#fdf2f8",
    ic: "#ec4899",
    icon: (
      <svg
        width="15"
        height="15"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
        />
      </svg>
    ),
  },
  {
    title: "Analyze",
    desc: "Interactive Pivot & Powerful Insights",
    bg: "#f5f3ff",
    ic: "#8b5cf6",
    icon: (
      <svg
        width="15"
        height="15"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    ),
  },
];

const BOTTOM_BADGES = [
  {
    label: "Enterprise Ready",
    sub: "Secure. Scalable. Reliable.",
    icon: (
      <svg
        width="16"
        height="16"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      </svg>
    ),
    ic: "#6b7280",
  },
  {
    label: "Cloud Platform",
    sub: "Accessible Anytime, Anywhere.",
    icon: (
      <svg
        width="16"
        height="16"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
        />
      </svg>
    ),
    ic: "#3b82f6",
  },
  {
    label: "Built for Business",
    sub: "IT Teams. Citizen Developers. Business Users.",
    icon: (
      <svg
        width="16"
        height="16"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
    ),
    ic: "#f97316",
  },
];

const COUNTRIES = [
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Germany",
  "France",
  "India",
  "Pakistan",
  "Singapore",
  "UAE",
  "Other",
];
const COUNTRY_CODES = [
  { code: "+1", label: "United States", flag: "🇺🇸" },
  { code: "+44", label: "United Kingdom", flag: "🇬🇧" },
  { code: "+1", label: "Canada", flag: "🇨🇦" },
  { code: "+61", label: "Australia", flag: "🇦🇺" },
  { code: "+49", label: "Germany", flag: "🇩🇪" },
  { code: "+33", label: "France", flag: "🇫🇷" },
  { code: "+91", label: "India", flag: "🇮🇳" },
  { code: "+92", label: "Pakistan", flag: "🇵🇰" },
  { code: "+65", label: "Singapore", flag: "🇸🇬" },
  { code: "+971", label: "UAE", flag: "🇦🇪" },
];
const EMPLOYEES = ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"];

/* ── Logo ─────────────────────────────────────────────────────────────────── */
function Logo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <img
        src={logoSrc}
        alt="Appflexor"
        style={{ width: 36, height: 36, objectFit: "contain" }}
      />
      <span
        style={{
          fontSize: 20,
          fontWeight: 700,
          color: "#111827",
          letterSpacing: "-0.3px",
        }}
      >
        appflexor
      </span>
    </div>
  );
}

/* ── App mockup illustration ──────────────────────────────────────────────── */
function AppMockup() {
  return (
    <div
      style={{
        borderRadius: 10,
        border: "1px solid #e5e7eb",
        overflow: "hidden",
        boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
        background: "#fff",
        marginTop: 24,
      }}
    >
      {/* Browser chrome */}
      <div
        style={{
          background: "#f3f4f6",
          borderBottom: "1px solid #e5e7eb",
          padding: "7px 12px",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        {["#f87171", "#fbbf24", "#34d399"].map((c) => (
          <div
            key={c}
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: c,
            }}
          />
        ))}
        <div
          style={{
            marginLeft: 8,
            flex: 1,
            background: "#fff",
            borderRadius: 4,
            padding: "2px 10px",
            fontSize: 11,
            color: "#9ca3af",
            border: "1px solid #e5e7eb",
          }}
        >
          appflexor.com
        </div>
      </div>
      {/* App UI */}
      <div style={{ display: "flex", height: 130 }}>
        {/* Sidebar */}
        <div
          style={{
            width: 36,
            background: "#4f46e5",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "10px 0",
            gap: 10,
          }}
        >
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              style={{
                width: 18,
                height: 18,
                borderRadius: 4,
                background: "rgba(255,255,255,0.2)",
              }}
            />
          ))}
        </div>
        {/* Canvas */}
        <div
          style={{
            flex: 1,
            background: "#f9fafb",
            padding: 10,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {/* Top bar */}
          <div style={{ display: "flex", gap: 6 }}>
            {[80, 60, 40].map((w, i) => (
              <div
                key={i}
                style={{
                  width: w,
                  height: 18,
                  borderRadius: 4,
                  background: "#e5e7eb",
                }}
              />
            ))}
          </div>
          {/* Content area */}
          <div style={{ flex: 1, display: "flex", gap: 8 }}>
            {/* Text block */}
            <div
              style={{
                flex: 1.5,
                background: "#fff",
                borderRadius: 6,
                border: "1px solid #e5e7eb",
                padding: 8,
                display: "flex",
                flexDirection: "column",
                gap: 5,
              }}
            >
              {[70, 50, 85, 40].map((w, i) => (
                <div
                  key={i}
                  style={{
                    width: `${w}%`,
                    height: 6,
                    borderRadius: 3,
                    background: "#e5e7eb",
                  }}
                />
              ))}
            </div>
            {/* Image placeholder */}
            <div
              style={{
                flex: 1,
                background: "#fff",
                borderRadius: 6,
                border: "1px solid #e5e7eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    width: 30,
                    height: 20,
                    background: "#e5e7eb",
                    borderRadius: 4,
                    margin: "0 auto 4px",
                  }}
                />
                <div
                  style={{
                    width: 20,
                    height: 6,
                    background: "#e5e7eb",
                    borderRadius: 3,
                    margin: "0 auto",
                  }}
                />
              </div>
            </div>
            {/* Chart */}
            <div
              style={{
                flex: 1,
                background: "#fff",
                borderRadius: 6,
                border: "1px solid #e5e7eb",
                padding: 8,
                display: "flex",
                alignItems: "flex-end",
                gap: 4,
              }}
            >
              {[
                ["#818cf8", 60],
                ["#34d399", 40],
                ["#fb923c", 75],
                ["#f472b6", 50],
              ].map(([c, h], i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: `${h}%`,
                    background: c as string,
                    borderRadius: "2px 2px 0 0",
                    opacity: 0.8,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Flow diagram row */}
      <div
        style={{
          background: "#fff",
          borderTop: "1px solid #f3f4f6",
          padding: "8px 12px",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        {[
          ["#818cf8", "T"],
          ["#34d399", "→"],
          ["#fb923c", "✓"],
          ["#f472b6", "→"],
          ["#6366f1", "✉"],
        ].map(([c, l], i) => (
          <div
            key={i}
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            {l === "→" ? (
              <span style={{ fontSize: 12, color: "#d1d5db", fontWeight: 700 }}>
                {l}
              </span>
            ) : (
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: c + "22",
                  border: `1.5px solid ${c}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  color: c,
                  fontWeight: 700,
                }}
              >
                {l}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Field wrapper ────────────────────────────────────────────────────────── */
const inp: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  borderRadius: 6,
  border: "1px solid #d1d5db",
  fontSize: 13,
  color: "#374151",
  background: "#fff",
  outline: "none",
  boxSizing: "border-box",
};
const selStyle: React.CSSProperties = {
  ...inp,
  appearance: "none",
  cursor: "pointer",
};

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>
        {label}
        {required && <span style={{ color: "#ef4444", marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────────── */
export default function Signup() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    company: "",
    siteName: "",
    email: "",
    phone: "",
    employees: "",
    website: "",
    country: "",
    agreed: false,
    countryCode: "+1",
  });

  const logoUrl = logoSrc; // Replace with your logo URL or import
  const brandTitle = "appflexor";

  function Delayed({ children, waitBeforeShow = 250 }) {
    const [isShown, setIsShown] = useState(false);
    useEffect(() => {
      const timer = setTimeout(() => setIsShown(true), waitBeforeShow);
      return () => clearTimeout(timer);
    }, [waitBeforeShow]);
    return isShown ? children : null;
  }

  /* ─── Appflexor "A" SVG logo mark ─────────────────────────────────────────── */
  function AppflexorMark({ size = 28 }) {
    return (
      <img
        src={logoSrc}
        alt="AppFlexor"
        width={size}
        height={size}
        className="object-contain"
      />
    );
  }

  /* ─── Dotted arrow between flow steps ─────────────────────────────────────── */
  function DottedArrow() {
    return (
      <div className="flex items-center justify-between mx-2 w-full mb-4">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-indigo-300 opacity-60"
          />
        ))}
        <div className="w-0 h-0 border-y-[5px] border-y-transparent border-l-[8px] border-l-indigo-400 opacity-70" />
      </div>
    );
  }
  const [status, setStatus] = useState<
    null | "idle" | "submitting" | "success" | "error"
  >("idle");

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const t = e.target as HTMLInputElement;
    setForm((p) => ({
      ...p,
      [t.name]: t.type === "checkbox" ? t.checked : t.value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    const webhook = "https://signup.appflexor.com/webhook/appflexor/signup";
    try {
      const res = await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStatus("success");
    } catch (err) {
      console.error("Signup webhook failed:", err);
      setStatus("error");
    }
  }

  /* ── Feature cards data ─────────────────────────────────────── */
  const featureCards = [
    {
      icon: HiInboxArrowDown,
      iconBg: "bg-indigo-100",
      iconColor: "text-indigo-600",
      title: "Business Events",
      titleColor: "text-indigo-600",
      desc: "Receive work from Email, WhatsApp, Forms, APIs and External Systems.",
    },
    {
      icon: "fa-arrows-spin",
      iconBg: "bg-violet-100",
      iconColor: "text-violet-600",
      title: "Business Services",
      titleColor: "text-violet-600",
      desc: "Automate and monitor business processes using AI-powered workflows.",
    },
    {
      icon: "fa-link",
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      title: "Enterprise Systems",
      titleColor: "text-emerald-600",
      desc: "Connect ERP, CRM, Accounting, Ecommerce, and Enterprise Applications.",
    },
  ];

  /* ── Flow steps ─────────────────────────────────────────────── */
  const flowSteps = [
    { icon: HiInboxArrowDown, bg: "bg-indigo-600", label: "Capture" },
    { icon: "fa-arrows-spin", bg: "bg-violet-600", label: "Orchestrate" },
    { icon: "fa-link", bg: "bg-emerald-600", label: "Integrate" },
  ];

  /* ── Supported channels ─────────────────────────────────────── */
  const channels = [
    { icon: "fa-envelope", label: "Email" },
    { icon: "fa-whatsapp", label: "WhatsApp", fab: true },
    { icon: "fa-globe", label: "Forms" },
    { icon: "fa-code", label: "APIs" },
    { icon: "s2a-channel-logo s2a-channel-logo-odoo", label: "Odoo ERP" },
    {
      icon: "s2a-channel-logo s2a-channel-logo-quickbooks",
      label: "QuickBooks",
    },
    { icon: "s2a-channel-logo s2a-channel-logo-xero", label: "Xero" },
    { icon: "s2a-channel-logo s2a-channel-logo-kafka", label: "Connectors" },
  ];

  /* ── Business services ──────────────────────────────────────── */
  const services = [
    { icon: "fa-shield-halved", label: "Compliance Management" },
    { icon: "fa-coins", label: "Financial Reconciliation" },
    { icon: "fa-cart-shopping", label: "Order Fulfillment" },
    { icon: "fa-folder-open", label: "Document Management" },
    { icon: "fa-puzzle-piece", label: "And more..." },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8f8ff",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ flex: 1, display: "flex", minHeight: "100vh" }}>
        {/* ══ LEFT PANEL ══ */}
        <section className="s2a-login-presentation hidden lg:flex w-[58%] flex-col px-14 py-12 relative overflow-hidden">
          {/* Subtle dot grid decoration */}
          <div className="s2a-login-dot-grid absolute top-10 right-10 opacity-20 pointer-events-none select-none">
            {[...Array(6)].map((_, r) => (
              <div key={r} className="flex gap-4 mb-4">
                {[...Array(8)].map((_, c) => (
                  <div key={c} className="w-1 h-1 rounded-full bg-indigo-400" />
                ))}
              </div>
            ))}
          </div>

          {/* Brand logo */}
          <div className="s2a-login-brand flex items-center gap-2.5 mb-10">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={brandTitle}
                className="h-8 object-contain"
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = LOGIN_FALLBACK_LOGO;
                }}
              />
            ) : (
              <AppflexorMark size={30} />
            )}
            <span className="text-lg font-bold text-slate-800 tracking-tight">
              {brandTitle}
            </span>
          </div>

          {/* Headline */}
          <h1 className="s2a-login-headline text-5xl font-extrabold text-slate-900 leading-[1.15] mb-4 tracking-tight">
            Automate Business
            <br />
            Services with <span className="text-indigo-600">AI</span>
          </h1>

          {/* Subtitle */}
          <p className="s2a-login-intro text-sm text-slate-600 mb-8 leading-6">
            Capture business events.
            <br />
            Orchestrate business services.
            <br />
            Integrate enterprise systems.
          </p>

          {/* Flow diagram */}
          <div className="s2a-login-flow flex items-center mb-8">
            {flowSteps.map((step, i) => (
              <React.Fragment key={step.label}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-14 h-14 ${step.bg} rounded-full flex items-center justify-center shadow-md mb-2`}
                  >
                    {typeof step.icon === "string" ? (
                      <i
                        className={`fa-solid ${step.icon} text-white text-xl`}
                      ></i>
                    ) : (
                      <step.icon
                        style={{ color: "#fff", fontSize: "1.25rem" }}
                      />
                    )}
                  </div>
                  <span className="text-xs font-semibold text-slate-700">
                    {step.label}
                  </span>
                </div>
                {i < flowSteps.length - 1 && <DottedArrow />}
              </React.Fragment>
            ))}
          </div>

          {/* Feature cards */}
          <div className="s2a-login-feature-grid grid grid-cols-3 gap-3 mb-8">
            {featureCards.map((f) => (
              <div
                key={f.title}
                className="s2a-login-feature-card bg-white rounded-xl border border-slate-200 p-4 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 ${f.iconBg} rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5`}
                  >
                    {typeof f.icon === "string" ? (
                      <i
                        className={`fa-solid ${f.icon} ${f.iconColor} text-sm`}
                      ></i>
                    ) : (
                      <f.icon
                        className={f.iconColor}
                        style={{ fontSize: "1rem" }}
                      />
                    )}
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${f.titleColor} mb-1`}>
                      {f.title}
                    </p>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {f.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Supported channels */}
          <div className="s2a-login-supported mb-4">
            <p className="text-sm font-semibold text-slate-500 mb-2.5">
              Supported Channels
            </p>
            <div className="flex flex-wrap gap-2">
              {channels.map((ch) => (
                <span
                  key={ch.label}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-full text-sm font-semibold text-slate-700 shadow-sm"
                >
                  {ch.fab ? (
                    <i className={`fa-brands ${ch.icon} text-base`}></i>
                  ) : ch.icon ? (
                    <i
                      className={
                        ch.icon.includes("s2a-channel-logo")
                          ? ch.icon
                          : `fa-solid ${ch.icon} text-base`
                      }
                      aria-hidden="true"
                    ></i>
                  ) : null}
                  {ch.label}
                </span>
              ))}
            </div>
          </div>

          {/* Business services */}
          <div className="s2a-login-services mb-6">
            <p className="text-sm font-semibold text-slate-500 mb-2.5">
              Business Services
            </p>
            <div className="flex flex-wrap gap-2">
              {services.map((svc) => (
                <span
                  key={svc.label}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-full text-sm font-semibold text-slate-700 shadow-sm"
                >
                  <i
                    className={`fa-solid ${svc.icon} text-indigo-500 text-base`}
                    aria-hidden="true"
                  ></i>
                  {svc.label}
                </span>
              ))}
            </div>
          </div>

          {/* Trust badge */}
          {/* <div className="flex items-start gap-3 bg-white/60 border border-slate-200 rounded-xl px-4 py-3 max-w-lg">
                                <i className="fa-solid fa-shield-halved text-indigo-500 mt-0.5 flex-shrink-0"></i>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    Trusted for Customer Service, Employee Services, Finance,<br />
                                    Procurement and Compliance Automation.
                                </p>
                            </div> */}
        </section>

        {/* ══ RIGHT PANEL (form) ══ */}
        <div
          style={{
            flex: 1,
            background: "#fff",
            display: "flex",
            flexDirection: "column",
            borderLeft: "1px solid #e5e7eb",
            overflowY: "auto",
          }}
        >
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "40px 32px",
            }}
          >
            <div style={{ width: "100%", maxWidth: 420 }}>
              {/* Logo */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginBottom: 20,
                }}
              >
                <Logo />
              </div>

              {status !== "success" && (
                <div style={{ textAlign: "center", marginBottom: 24 }}>
                  <h2
                    style={{
                      fontSize: 22,
                      fontWeight: 700,
                      color: "#111827",
                      margin: 0,
                    }}
                  >
                    Create your account
                  </h2>
                  <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 6 }}>
                    Fill in the details below to get started.
                  </p>
                </div>
              )}

              {status === "success" ? (
                <div style={{ textAlign: "center", padding: 24 }}>
                  <h2 style={{ fontSize: 28, margin: 0 }}>🎉 Thank You!</h2>
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 12 }}>
                    Your AppFlexor account request has been received.
                  </h3>
                  <p style={{ marginTop: 12, color: "#374151" }}>
                    We're preparing your workspace and verifying your
                    organization details. You'll receive an email shortly with
                    instructions to activate your account.
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  style={{ display: "flex", flexDirection: "column", gap: 12 }}
                  data-testid="form-signup"
                >
                  <Field label="First Name" required>
                    <input
                      type="text"
                      name="firstName"
                      value={form.firstName}
                      onChange={handleChange}
                      placeholder="Enter your first name"
                      style={inp}
                      data-testid="input-first-name"
                      required
                    />
                  </Field>

                  <Field label="Last Name" required>
                    <input
                      type="text"
                      name="lastName"
                      value={form.lastName}
                      onChange={handleChange}
                      placeholder="Enter your last name"
                      style={inp}
                      data-testid="input-last-name"
                      required
                    />
                  </Field>

                  <Field label="Company / Business Name" required>
                    <input
                      type="text"
                      name="company"
                      value={form.company}
                      onChange={handleChange}
                      placeholder="Enter your company or business name"
                      style={inp}
                      data-testid="input-company"
                      required
                    />
                  </Field>

                  <Field label="Site Name" required>
                    <input
                      type="text"
                      name="siteName"
                      value={form.siteName}
                      onChange={handleChange}
                      placeholder="Enter your site name"
                      style={inp}
                      data-testid="input-site-name"
                      required
                    />
                  </Field>

                  <Field label="Email" required>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="Enter your email"
                      style={inp}
                      data-testid="input-email"
                      required
                    />
                  </Field>

                  <Field label="Phone" required>
                    <div style={{ display: "flex", gap: 8 }}>
                      <div style={{ position: "relative" }}>
                        <select
                          name="countryCode"
                          value={form.countryCode}
                          onChange={handleChange}
                          style={{
                            height: 40,
                            minWidth: 80,
                            padding: "0 10px",
                            border: "1px solid #d1d5db",
                            borderRadius: 6,
                            background: "#fff",
                            fontSize: 13,
                            color: "#374151",
                            cursor: "pointer",
                            appearance: "none",
                          }}
                          data-testid="select-country-code"
                        >
                          {COUNTRY_CODES.map((c) => (
                            <option key={c.code + c.label} value={c.code}>
                              {c.flag} {c.code}
                            </option>
                          ))}
                        </select>
                        <svg
                          style={{
                            position: "absolute",
                            right: 8,
                            top: "50%",
                            transform: "translateY(-50%)",
                            pointerEvents: "none",
                          }}
                          width="12"
                          height="12"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="#9ca3af"
                          strokeWidth="2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                      <input
                        type="tel"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        placeholder="Enter your phone number"
                        style={{ ...inp, flex: 1 }}
                        data-testid="input-phone"
                        required
                      />
                    </div>
                  </Field>

                  <Field label="No of Employees" required>
                    <div style={{ position: "relative" }}>
                      <select
                        name="employees"
                        value={form.employees}
                        onChange={handleChange}
                        style={selStyle}
                        data-testid="select-employees"
                        required
                      >
                        <option value="" disabled>
                          Select number of employees
                        </option>
                        {EMPLOYEES.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                      <svg
                        style={{
                          position: "absolute",
                          right: 10,
                          top: "50%",
                          transform: "translateY(-50%)",
                          pointerEvents: "none",
                        }}
                        width="14"
                        height="14"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="#9ca3af"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </Field>

                  <Field label="Web Site (Optional)">
                    <input
                      type="url"
                      name="website"
                      value={form.website}
                      onChange={handleChange}
                      placeholder="Enter your website"
                      style={inp}
                      data-testid="input-website"
                    />
                  </Field>

                  <Field label="Country" required>
                    <div style={{ position: "relative" }}>
                      <select
                        name="country"
                        value={form.country}
                        onChange={handleChange}
                        style={selStyle}
                        data-testid="select-country"
                        required
                      >
                        <option value="" disabled>
                          Select your country
                        </option>
                        {COUNTRIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                      <svg
                        style={{
                          position: "absolute",
                          right: 10,
                          top: "50%",
                          transform: "translateY(-50%)",
                          pointerEvents: "none",
                        }}
                        width="14"
                        height="14"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="#9ca3af"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </Field>

                  {/* Terms */}
                  <label
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      cursor: "pointer",
                      marginTop: 2,
                    }}
                  >
                    <input
                      type="checkbox"
                      name="agreed"
                      checked={form.agreed}
                      onChange={handleChange}
                      style={{
                        marginTop: 2,
                        width: 14,
                        height: 14,
                        accentColor: "#7c3aed",
                      }}
                      data-testid="checkbox-terms"
                      required
                    />
                    <span style={{ fontSize: 13, color: "#6b7280" }}>
                      I have read and agree with the{" "}
                      <a
                        href="https://appflexor.com/terms-of-use"
                        target="_blank"
                        style={{
                          color: "#7c3aed",
                          fontWeight: 500,
                          textDecoration: "none",
                        }}
                      >
                        Terms of Use
                      </a>
                      . <span style={{ color: "#ef4444" }}>*</span>
                    </span>
                  </label>

                  {/* Sign up button */}
                  <button
                    type="submit"
                    disabled={status === "submitting"}
                    style={{
                      width: "100%",
                      padding: "11px 0",
                      borderRadius: 6,
                      border: "none",
                      background: "#4f46e5",
                      color: "#fff",
                      fontWeight: 600,
                      fontSize: 15,
                      cursor: status === "submitting" ? "default" : "pointer",
                      marginTop: 4,
                      opacity: status === "submitting" ? 0.7 : 1,
                    }}
                    data-testid="button-signup"
                  >
                    {status === "submitting" ? "Signing up..." : "Sign up"}
                  </button>

                  {status === "success" && (
                    <p style={{ color: "#16a34a", fontSize: 13, marginTop: 8 }}>
                      Signup submitted successfully.
                    </p>
                  )}
                  {status === "error" && (
                    <p style={{ color: "#dc2626", fontSize: 13, marginTop: 8 }}>
                      Submission failed. Check console for details.
                    </p>
                  )}

                  {/* <p
                  style={{
                    textAlign: "center",
                    fontSize: 13,
                    color: "#9ca3af",
                    marginTop: 4,
                  }}
                >
                  Already have an account?{" "}
                  <a
                    href="#"
                    style={{
                      color: "#7c3aed",
                      fontWeight: 500,
                      textDecoration: "none",
                    }}
                    data-testid="link-signin"
                  >
                    Sign in
                  </a>
                </p> */}
                </form>
              )}
            </div>
            {/* Mobile footer */}
            <div
              className="lg:hidden"
              style={{
                padding: "14px 24px",
                borderTop: "1px solid #f3f4f6",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                fontSize: 11,
                color: "#9ca3af",
              }}
            >
              <span>
                <a href="https://appflexor.com" target="_blank">
                  AppFlexor
                </a>{" "}
                © <a href="https://step2agility.com">Step 2 Agility</a>. All
                rights reserved.
              </span>
              <div style={{ display: "flex", gap: 10 }}>
                <a
                  href="https://appflexor.com/privacy"
                  target="_blank"
                  style={{ color: "#9ca3af", textDecoration: "none" }}
                >
                  Privacy Policy
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
