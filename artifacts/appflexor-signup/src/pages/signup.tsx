import { useState } from "react";
import logoSrc from "../assets/appflexor-logo.png";

/* ── Static data ──────────────────────────────────────────────────────────── */
const FEATURES = [
  {
    title: "Build UI", desc: "Pages, Posts, Forms, Data Tables",
    bg: "#eff6ff", ic: "#3b82f6",
    icon: <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  },
  {
    title: "Manage Tasks", desc: "Complete work with Task inbox",
    bg: "#fefce8", ic: "#eab308",
    icon: <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>,
  },
  {
    title: "Automate", desc: "Link forms with workflows",
    bg: "#f0fdf4", ic: "#22c55e",
    icon: <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>,
  },
  {
    title: "Drag-n-Drop", desc: "Design faster. Deploy quicker.",
    bg: "#fdf2f8", ic: "#ec4899",
    icon: <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"/></svg>,
  },
  {
    title: "Analyze", desc: "Interactive Pivot & Powerful Insights",
    bg: "#f5f3ff", ic: "#8b5cf6",
    icon: <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>,
  },
];

const BOTTOM_BADGES = [
  {
    label: "Enterprise Ready", sub: "Secure. Scalable. Reliable.",
    icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>,
    ic: "#6b7280",
  },
  {
    label: "Cloud Platform", sub: "Accessible Anytime, Anywhere.",
    icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"/></svg>,
    ic: "#3b82f6",
  },
  {
    label: "Built for Business", sub: "IT Teams. Citizen Developers. Business Users.",
    icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>,
    ic: "#f97316",
  },
];

const COUNTRIES = ["United States","United Kingdom","Canada","Australia","Germany","France","India","Pakistan","Singapore","UAE","Other"];
const EMPLOYEES = ["1-10","11-50","51-200","201-500","501-1000","1000+"];

/* ── Logo ─────────────────────────────────────────────────────────────────── */
function Logo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <img src={logoSrc} alt="Appflexor" style={{ width: 36, height: 36, objectFit: "contain" }} />
      <span style={{ fontSize: 20, fontWeight: 700, color: "#111827", letterSpacing: "-0.3px" }}>appflexor</span>
    </div>
  );
}

/* ── App mockup illustration ──────────────────────────────────────────────── */
function AppMockup() {
  return (
    <div style={{
      borderRadius: 10, border: "1px solid #e5e7eb", overflow: "hidden",
      boxShadow: "0 4px 16px rgba(0,0,0,0.08)", background: "#fff",
      marginTop: 24,
    }}>
      {/* Browser chrome */}
      <div style={{
        background: "#f3f4f6", borderBottom: "1px solid #e5e7eb",
        padding: "7px 12px", display: "flex", alignItems: "center", gap: 6,
      }}>
        {["#f87171","#fbbf24","#34d399"].map(c => (
          <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />
        ))}
        <div style={{
          marginLeft: 8, flex: 1, background: "#fff", borderRadius: 4,
          padding: "2px 10px", fontSize: 11, color: "#9ca3af",
          border: "1px solid #e5e7eb",
        }}>appflexor.com</div>
      </div>
      {/* App UI */}
      <div style={{ display: "flex", height: 130 }}>
        {/* Sidebar */}
        <div style={{
          width: 36, background: "#4f46e5",
          display: "flex", flexDirection: "column", alignItems: "center",
          padding: "10px 0", gap: 10,
        }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{ width: 18, height: 18, borderRadius: 4, background: "rgba(255,255,255,0.2)" }} />
          ))}
        </div>
        {/* Canvas */}
        <div style={{ flex: 1, background: "#f9fafb", padding: 10, display: "flex", flexDirection: "column", gap: 8 }}>
          {/* Top bar */}
          <div style={{ display: "flex", gap: 6 }}>
            {[80, 60, 40].map((w, i) => (
              <div key={i} style={{ width: w, height: 18, borderRadius: 4, background: "#e5e7eb" }} />
            ))}
          </div>
          {/* Content area */}
          <div style={{ flex: 1, display: "flex", gap: 8 }}>
            {/* Text block */}
            <div style={{
              flex: 1.5, background: "#fff", borderRadius: 6,
              border: "1px solid #e5e7eb", padding: 8,
              display: "flex", flexDirection: "column", gap: 5,
            }}>
              {[70, 50, 85, 40].map((w, i) => (
                <div key={i} style={{ width: `${w}%`, height: 6, borderRadius: 3, background: "#e5e7eb" }} />
              ))}
            </div>
            {/* Image placeholder */}
            <div style={{
              flex: 1, background: "#fff", borderRadius: 6,
              border: "1px solid #e5e7eb",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ width: 30, height: 20, background: "#e5e7eb", borderRadius: 4, margin: "0 auto 4px" }} />
                <div style={{ width: 20, height: 6, background: "#e5e7eb", borderRadius: 3, margin: "0 auto" }} />
              </div>
            </div>
            {/* Chart */}
            <div style={{
              flex: 1, background: "#fff", borderRadius: 6,
              border: "1px solid #e5e7eb", padding: 8,
              display: "flex", alignItems: "flex-end", gap: 4,
            }}>
              {[["#818cf8",60],["#34d399",40],["#fb923c",75],["#f472b6",50]].map(([c,h],i) => (
                <div key={i} style={{
                  flex: 1, height: `${h}%`, background: c as string,
                  borderRadius: "2px 2px 0 0", opacity: 0.8,
                }} />
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Flow diagram row */}
      <div style={{
        background: "#fff", borderTop: "1px solid #f3f4f6",
        padding: "8px 12px", display: "flex", alignItems: "center", gap: 6,
      }}>
        {[["#818cf8","T"],["#34d399","→"],["#fb923c","✓"],["#f472b6","→"],["#6366f1","✉"]].map(([c,l], i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {l === "→" ? (
              <span style={{ fontSize: 12, color: "#d1d5db", fontWeight: 700 }}>{l}</span>
            ) : (
              <div style={{
                width: 24, height: 24, borderRadius: "50%",
                background: c + "22", border: `1.5px solid ${c}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, color: c, fontWeight: 700,
              }}>{l}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Field wrapper ────────────────────────────────────────────────────────── */
const inp: React.CSSProperties = {
  width: "100%", padding: "9px 12px", borderRadius: 6,
  border: "1px solid #d1d5db", fontSize: 13, color: "#374151",
  background: "#fff", outline: "none", boxSizing: "border-box",
};
const selStyle: React.CSSProperties = {
  ...inp, appearance: "none", cursor: "pointer",
};

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>
        {label}{required && <span style={{ color: "#ef4444", marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────────── */
export default function Signup() {
  const [form, setForm] = useState({
    firstName: "", lastName: "", company: "", siteName: "",
    email: "", phone: "", employees: "", website: "", country: "", agreed: false,
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const t = e.target as HTMLInputElement;
    setForm(p => ({ ...p, [t.name]: t.type === "checkbox" ? t.checked : t.value }));
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8f8ff", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, display: "flex", minHeight: "100vh" }}>

        {/* ══ LEFT PANEL ══ */}
        <div className="hidden lg:flex" style={{
          width: "55%", minHeight: "100vh", background: "#ffffff",
          flexDirection: "column", position: "relative", overflow: "hidden",
        }}>
          {/* Subtle dot pattern */}
          <div style={{
            position: "absolute", inset: 0, opacity: 0.35,
            backgroundImage: "radial-gradient(circle, #c4b5fd 1px, transparent 1px)",
            backgroundSize: "20px 20px", pointerEvents: "none",
          }} />

          <div style={{ position: "relative", zIndex: 1, padding: "36px 40px", flex: 1, display: "flex", flexDirection: "column" }}>

            {/* Logo + tagline */}
            <Logo />
            <p style={{ color: "#7c3aed", fontSize: 12, fontWeight: 600, marginTop: 6, letterSpacing: "0.3px" }}>
              Build. Automate. Accelerate.
            </p>

            {/* Headline */}
            <div style={{ marginTop: 36 }}>
              <h1 style={{ fontSize: 34, fontWeight: 800, color: "#111827", lineHeight: 1.2, margin: 0 }}>
                Build powerful apps.<br />
                Automate processes.<br />
                <span style={{ color: "#7c3aed" }}>Without code.</span>
              </h1>
              <p style={{ fontSize: 13, color: "#6b7280", marginTop: 14, lineHeight: 1.7, maxWidth: 320 }}>
                Appflexor is a low-code platform to build business apps, automate workflows,
                manage tasks and analyze data – all with drag-n-drop.
              </p>
            </div>

            {/* App mockup */}
            <AppMockup />

            {/* Features grid */}
            <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {FEATURES.map(f => (
                <div key={f.title} style={{
                  display: "flex", alignItems: "flex-start", gap: 10,
                  background: "#fff", borderRadius: 10, padding: "10px 12px",
                  border: "1px solid #f3f4f6", boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: 6, flexShrink: 0,
                    background: f.bg, display: "flex", alignItems: "center", justifyContent: "center",
                    color: f.ic,
                  }}>{f.icon}</div>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "#1f2937", margin: 0, lineHeight: 1.3 }}>{f.title}</p>
                    <p style={{ fontSize: 11, color: "#9ca3af", margin: "2px 0 0", lineHeight: 1.4 }}>{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom badges */}
          <div style={{
            position: "relative", zIndex: 1,
            borderTop: "1px solid #f3f4f6",
            padding: "18px 40px",
            display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12,
          }}>
            {BOTTOM_BADGES.map(b => (
              <div key={b.label} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                <span style={{ color: b.ic, flexShrink: 0, marginTop: 1 }}>{b.icon}</span>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: b.ic, margin: 0 }}>{b.label}</p>
                  <p style={{ fontSize: 11, color: "#9ca3af", margin: "2px 0 0", lineHeight: 1.4 }}>{b.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{
            position: "relative", zIndex: 1,
            borderTop: "1px solid #f3f4f6",
            padding: "12px 40px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            fontSize: 11, color: "#9ca3af",
          }}>
            <span>© 2024 Appflexor Technologies. All rights reserved.</span>
            <div style={{ display: "flex", gap: 10 }}>
              <a href="#" style={{ color: "#9ca3af", textDecoration: "none" }}>Privacy Policy</a>
              <span>|</span>
              <a href="#" style={{ color: "#9ca3af", textDecoration: "none" }}>Terms of Use</a>
            </div>
          </div>
        </div>

        {/* ══ RIGHT PANEL (form) ══ */}
        <div style={{
          flex: 1, background: "#fff",
          display: "flex", flexDirection: "column",
          borderLeft: "1px solid #e5e7eb",
          overflowY: "auto",
        }}>
          <div style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            padding: "40px 32px",
          }}>
            <div style={{ width: "100%", maxWidth: 420 }}>

              {/* Logo */}
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
                <Logo />
              </div>

              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: 0 }}>Create your account</h2>
                <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 6 }}>Fill in the details below to get started.</p>
              </div>

              <form
                onSubmit={e => e.preventDefault()}
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
                data-testid="form-signup"
              >
                <Field label="First Name" required>
                  <input type="text" name="firstName" value={form.firstName}
                    onChange={handleChange} placeholder="Enter your first name"
                    style={inp} data-testid="input-first-name" required />
                </Field>

                <Field label="Last Name" required>
                  <input type="text" name="lastName" value={form.lastName}
                    onChange={handleChange} placeholder="Enter your last name"
                    style={inp} data-testid="input-last-name" required />
                </Field>

                <Field label="Company / Business Name" required>
                  <input type="text" name="company" value={form.company}
                    onChange={handleChange} placeholder="Enter your company or business name"
                    style={inp} data-testid="input-company" required />
                </Field>

                <Field label="Site Name" required>
                  <input type="text" name="siteName" value={form.siteName}
                    onChange={handleChange} placeholder="Enter your site name"
                    style={inp} data-testid="input-site-name" required />
                </Field>

                <Field label="Email" required>
                  <input type="email" name="email" value={form.email}
                    onChange={handleChange} placeholder="Enter your email"
                    style={inp} data-testid="input-email" required />
                </Field>

                <Field label="Phone" required>
                  <div style={{ display: "flex", gap: 8 }}>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "0 10px", border: "1px solid #d1d5db", borderRadius: 6,
                      background: "#fff", fontSize: 13, color: "#374151",
                      whiteSpace: "nowrap", userSelect: "none",
                    }}>
                      🇺🇸 +1
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    <input type="tel" name="phone" value={form.phone}
                      onChange={handleChange} placeholder="Enter your phone number"
                      style={{ ...inp, flex: 1 }} data-testid="input-phone" required />
                  </div>
                </Field>

                <Field label="No of Employees" required>
                  <div style={{ position: "relative" }}>
                    <select name="employees" value={form.employees} onChange={handleChange}
                      style={selStyle} data-testid="select-employees" required>
                      <option value="" disabled>Select number of employees</option>
                      {EMPLOYEES.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                    <svg style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
                      width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </Field>

                <Field label="Web Site (Optional)">
                  <input type="url" name="website" value={form.website}
                    onChange={handleChange} placeholder="Enter your website"
                    style={inp} data-testid="input-website" />
                </Field>

                <Field label="Country" required>
                  <div style={{ position: "relative" }}>
                    <select name="country" value={form.country} onChange={handleChange}
                      style={selStyle} data-testid="select-country" required>
                      <option value="" disabled>Select your country</option>
                      {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <svg style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
                      width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </Field>

                {/* Terms */}
                <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", marginTop: 2 }}>
                  <input type="checkbox" name="agreed" checked={form.agreed} onChange={handleChange}
                    style={{ marginTop: 2, width: 14, height: 14, accentColor: "#7c3aed" }}
                    data-testid="checkbox-terms" required />
                  <span style={{ fontSize: 13, color: "#6b7280" }}>
                    I have read and agree with the{" "}
                    <a href="#" style={{ color: "#7c3aed", fontWeight: 500, textDecoration: "none" }}>Terms of Use</a>.{" "}
                    <span style={{ color: "#ef4444" }}>*</span>
                  </span>
                </label>

                {/* Sign up button */}
                <button type="submit"
                  style={{
                    width: "100%", padding: "11px 0", borderRadius: 6, border: "none",
                    background: "#4f46e5", color: "#fff",
                    fontWeight: 600, fontSize: 15, cursor: "pointer", marginTop: 4,
                  }}
                  data-testid="button-signup">
                  Sign up
                </button>

                <p style={{ textAlign: "center", fontSize: 13, color: "#9ca3af", marginTop: 4 }}>
                  Already have an account?{" "}
                  <a href="#" style={{ color: "#7c3aed", fontWeight: 500, textDecoration: "none" }}
                    data-testid="link-signin">Sign in</a>
                </p>
              </form>
            </div>
          </div>

          {/* Mobile footer */}
          <div className="lg:hidden" style={{
            padding: "14px 24px", borderTop: "1px solid #f3f4f6",
            display: "flex", flexDirection: "column", alignItems: "center",
            gap: 4, fontSize: 11, color: "#9ca3af",
          }}>
            <span>© 2024 Appflexor Technologies. All rights reserved.</span>
            <div style={{ display: "flex", gap: 10 }}>
              <a href="#" style={{ color: "#9ca3af", textDecoration: "none" }}>Privacy Policy</a>
              <span>|</span>
              <a href="#" style={{ color: "#9ca3af", textDecoration: "none" }}>Terms of Use</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
