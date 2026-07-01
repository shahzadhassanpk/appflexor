import { useState } from "react";
import logoSrc from "../assets/appflexor-logo.png";

const EMPLOYEES_OPTIONS = ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"];

const COUNTRIES = [
  "United States", "United Kingdom", "Canada", "Australia",
  "Germany", "France", "India", "Pakistan", "Singapore", "UAE", "Other",
];

const DARK_BG = "linear-gradient(160deg, #1a1a3e 0%, #0f0f2d 100%)";

function AppflexorLogo({ dark = false }: { dark?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <img src={logoSrc} alt="Appflexor" style={{ width: 40, height: 40, objectFit: "contain" }} />
      <span style={{
        fontSize: 20, fontWeight: 700, letterSpacing: "-0.3px",
        color: dark ? "#ffffff" : "#1a1a2e",
      }}>
        appflexor
      </span>
    </div>
  );
}

function FeatureCard({ icon, color, title, desc }: { icon: React.ReactNode; color: string; title: string; desc: string }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.07)",
      borderRadius: 10,
      padding: "12px 14px",
      display: "flex",
      alignItems: "flex-start",
      gap: 10,
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: 8, flexShrink: 0,
        background: color + "22",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div>
        <p style={{ color: "#ffffff", fontSize: 13, fontWeight: 600, margin: 0, lineHeight: 1.3 }}>{title}</p>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, margin: "2px 0 0", lineHeight: 1.4 }}>{desc}</p>
      </div>
    </div>
  );
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-indigo-500 transition bg-white";
const selectClass =
  "w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-800 outline-none focus:border-indigo-500 transition bg-white appearance-none cursor-pointer";

export default function Signup() {
  const [form, setForm] = useState({
    firstName: "", lastName: "", company: "", siteName: "",
    email: "", phone: "", employees: "", website: "", country: "", agreed: false,
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const target = e.target as HTMLInputElement;
    setForm(prev => ({
      ...prev,
      [target.name]: target.type === "checkbox" ? target.checked : target.value,
    }));
  }

  function handleSubmit(e: React.FormEvent) { e.preventDefault(); }

  const ChevronDown = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "#f0f2f8" }}>

      {/* ── LEFT PANEL ── */}
      <div className="signup-left-panel hidden lg:flex" style={{
        width: "45%",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
      }}>

        {/* Dot pattern */}
        <div style={{
          position: "absolute", inset: 0, opacity: 0.15,
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          pointerEvents: "none",
        }} />

        {/* Content */}
        <div style={{ position: "relative", zIndex: 1, padding: "40px 44px", flex: 1, display: "flex", flexDirection: "column" }}>

          {/* Logo + tagline */}
          <AppflexorLogo dark />
          <p style={{ color: "#a78bfa", fontSize: 12, fontWeight: 600, marginTop: 6, letterSpacing: "0.5px", textTransform: "uppercase" }}>
            Build. Automate. Accelerate.
          </p>

          {/* Headline */}
          <div style={{ marginTop: 48 }}>
            <h1 style={{ color: "#ffffff", fontSize: 36, fontWeight: 800, lineHeight: 1.2, margin: 0 }}>
              Build powerful apps.<br />
              Automate processes.<br />
              <span style={{ color: "#a78bfa" }}>Without code.</span>
            </h1>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 14, marginTop: 20, lineHeight: 1.7, maxWidth: 300 }}>
              Appflexor is a low-code platform to build business apps, automate workflows,
              manage tasks and analyze data — all with drag-n-drop.
            </p>
          </div>

          {/* Illustration placeholder */}
          <div style={{
            margin: "32px 0",
            background: "rgba(255,255,255,0.06)",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.1)",
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}>
            {/* Fake browser bar */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {["#ff5f57","#febc2e","#28c840"].map(c => (
                <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />
              ))}
              <div style={{ marginLeft: 8, background: "rgba(255,255,255,0.1)", borderRadius: 4, padding: "2px 12px", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                appflexor.com
              </div>
            </div>
            {/* Fake UI grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {[["#a78bfa",65],["#34d399",40],["#fb923c",80]].map(([c,h],i) => (
                <div key={i} style={{ background: (c as string)+"22", borderRadius: 6, height: 48, display: "flex", alignItems: "flex-end", padding: 4 }}>
                  <div style={{ width: "100%", background: c as string, borderRadius: 3, height: `${h}%` }} />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[70,50,85].map((w,i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#a78bfa", opacity: 0.6 }} />
                  <div style={{ height: 6, borderRadius: 4, background: "rgba(255,255,255,0.15)", width: `${w}%` }} />
                </div>
              ))}
            </div>
          </div>

          {/* Feature cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <FeatureCard color="#818cf8" title="Build UI" desc="Pages, Posts, Forms, Data Tables"
              icon={<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>}
            />
            <FeatureCard color="#fbbf24" title="Manage Tasks" desc="Complete work with Task inbox"
              icon={<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>}
            />
            <FeatureCard color="#34d399" title="Automate" desc="Link forms with workflows"
              icon={<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>}
            />
            <FeatureCard color="#f472b6" title="Drag-n-Drop" desc="Design faster, Deploy quicker"
              icon={<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>}
            />
            <FeatureCard color="#38bdf8" title="Analyze" desc="Interactive Pivot & Powerful Insights"
              icon={<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>}
            />
          </div>
        </div>

        {/* Bottom badges */}
        <div style={{
          position: "relative", zIndex: 1,
          borderTop: "1px solid rgba(255,255,255,0.1)",
          padding: "20px 44px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 16,
        }}>
          {[
            { label: "Enterprise Ready", sub: "Secure. Scalable. Reliable.", icon: "🛡️" },
            { label: "Cloud Platform", sub: "Accessible Anytime, Anywhere.", icon: "☁️" },
            { label: "Built for Business", sub: "IT Teams. Citizen Developers. Business Users.", icon: "💼" },
          ].map(b => (
            <div key={b.label} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <p style={{ color: "#ffffff", fontSize: 12, fontWeight: 600, margin: 0 }}>{b.icon} {b.label}</p>
              <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, margin: 0, lineHeight: 1.4 }}>{b.sub}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          position: "relative", zIndex: 1,
          borderTop: "1px solid rgba(255,255,255,0.08)",
          padding: "12px 44px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: 11,
          color: "rgba(255,255,255,0.35)",
        }}>
          <span>© 2024 Appflexor Technologies. All rights reserved.</span>
          <div style={{ display: "flex", gap: 12 }}>
            <a href="#" style={{ color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>Privacy Policy</a>
            <span>|</span>
            <a href="#" style={{ color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>Terms of Use</a>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL (form) ── */}
      <div style={{
        flex: 1,
        minHeight: "100vh",
        background: "#ffffff",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
      }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
          <div style={{ width: "100%", maxWidth: 440 }}>

            {/* Logo */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
              <AppflexorLogo />
            </div>

            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <h2 style={{ fontSize: 26, fontWeight: 700, color: "#111827", margin: 0 }}>Create your account</h2>
              <p style={{ fontSize: 14, color: "#6b7280", marginTop: 6 }}>Fill in the details below to get started.</p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }} data-testid="form-signup">

              {/* First + Last name side by side */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <FormField label="First Name" required>
                  <input type="text" name="firstName" value={form.firstName}
                    onChange={handleChange} placeholder="Enter your first name"
                    className={inputClass} data-testid="input-first-name" required />
                </FormField>
                <FormField label="Last Name" required>
                  <input type="text" name="lastName" value={form.lastName}
                    onChange={handleChange} placeholder="Enter your last name"
                    className={inputClass} data-testid="input-last-name" required />
                </FormField>
              </div>

              <FormField label="Company / Business Name" required>
                <input type="text" name="company" value={form.company}
                  onChange={handleChange} placeholder="Enter your company or business name"
                  className={inputClass} data-testid="input-company" required />
              </FormField>

              <FormField label="Site Name" required>
                <input type="text" name="siteName" value={form.siteName}
                  onChange={handleChange} placeholder="Enter your site name"
                  className={inputClass} data-testid="input-site-name" required />
              </FormField>

              <FormField label="Email" required>
                <input type="email" name="email" value={form.email}
                  onChange={handleChange} placeholder="Enter your email"
                  className={inputClass} data-testid="input-email" required />
              </FormField>

              <FormField label="Phone" required>
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 6, padding: "0 10px",
                    border: "1px solid #e5e7eb", borderRadius: 8, background: "#fff",
                    fontSize: 13, color: "#374151", whiteSpace: "nowrap", cursor: "default",
                  }}>
                    <span>🇺🇸</span><span>+1</span>
                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ color: "#9ca3af" }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  <input type="tel" name="phone" value={form.phone}
                    onChange={handleChange} placeholder="Enter your phone number"
                    className={inputClass} data-testid="input-phone" required />
                </div>
              </FormField>

              <FormField label="No of Employees" required>
                <div style={{ position: "relative" }}>
                  <select name="employees" value={form.employees} onChange={handleChange}
                    className={selectClass} data-testid="select-employees" required>
                    <option value="" disabled>Select number of employees</option>
                    {EMPLOYEES_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                  <div style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#9ca3af" }}>
                    <ChevronDown />
                  </div>
                </div>
              </FormField>

              <FormField label="Web Site (Optional)">
                <input type="url" name="website" value={form.website}
                  onChange={handleChange} placeholder="Enter your website"
                  className={inputClass} data-testid="input-website" />
              </FormField>

              <FormField label="Country" required>
                <div style={{ position: "relative" }}>
                  <select name="country" value={form.country} onChange={handleChange}
                    className={selectClass} data-testid="select-country" required>
                    <option value="" disabled>Select your country</option>
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <div style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#9ca3af" }}>
                    <ChevronDown />
                  </div>
                </div>
              </FormField>

              {/* Terms */}
              <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
                <input type="checkbox" name="agreed" checked={form.agreed} onChange={handleChange}
                  style={{ marginTop: 2, width: 15, height: 15, accentColor: "#6C5CE7" }}
                  data-testid="checkbox-terms" required />
                <span style={{ fontSize: 13, color: "#6b7280" }}>
                  I have read and agree with the{" "}
                  <a href="#" style={{ color: "#6C5CE7", fontWeight: 600, textDecoration: "none" }}>Terms of Use</a>. *
                </span>
              </label>

              {/* Submit */}
              <button type="submit"
                style={{
                  width: "100%", padding: "12px 0", borderRadius: 8, border: "none",
                  background: "linear-gradient(90deg, #6C5CE7 0%, #a78bfa 100%)",
                  color: "#ffffff", fontWeight: 600, fontSize: 15, cursor: "pointer",
                  marginTop: 4,
                }}
                data-testid="button-signup">
                Sign up
              </button>

              <p style={{ textAlign: "center", fontSize: 13, color: "#6b7280", marginTop: 4 }}>
                Already have an account?{" "}
                <a href="#" style={{ color: "#6C5CE7", fontWeight: 600, textDecoration: "none" }} data-testid="link-signin">
                  Sign in
                </a>
              </p>
            </form>
          </div>
        </div>

        {/* Mobile footer */}
        <div className="lg:hidden" style={{
          padding: "16px 24px", borderTop: "1px solid #f3f4f6",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
          fontSize: 11, color: "#9ca3af",
        }}>
          <span>© 2024 Appflexor Technologies. All rights reserved.</span>
          <div style={{ display: "flex", gap: 12 }}>
            <a href="#" style={{ color: "#9ca3af", textDecoration: "none" }}>Privacy Policy</a>
            <span>|</span>
            <a href="#" style={{ color: "#9ca3af", textDecoration: "none" }}>Terms of Use</a>
          </div>
        </div>
      </div>
    </div>
  );
}
