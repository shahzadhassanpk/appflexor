import { useState } from "react";

const EMPLOYEES_OPTIONS = [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "501-1000",
  "1000+",
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

function AppflexorLogo({ dark = false }: { dark?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path
          d="M16 2L4 28h5.6L16 13.6 22.4 28H28L16 2z"
          fill={dark ? "#fff" : "#6C5CE7"}
        />
        <path
          d="M10.4 28h11.2l-5.6-12.4L10.4 28z"
          fill={dark ? "rgba(255,255,255,0.4)" : "rgba(108,92,231,0.4)"}
        />
      </svg>
      <span
        className="text-xl font-bold tracking-tight"
        style={{ color: dark ? "#fff" : "#1a1a2e" }}
      >
        appflexor
      </span>
    </div>
  );
}

function FeatureItem({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center bg-white/10">
        {icon}
      </div>
      <div>
        <p className="text-white text-sm font-semibold leading-tight">{title}</p>
        <p className="text-white/60 text-xs leading-snug mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
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
  "w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition bg-white";
const selectClass =
  "w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition bg-white appearance-none cursor-pointer";

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
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const target = e.target as HTMLInputElement;
    setForm((prev) => ({
      ...prev,
      [target.name]: target.type === "checkbox" ? target.checked : target.value,
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#f7f8fc" }}>
      {/* Main content */}
      <div className="flex flex-1 min-h-screen">
        {/* LEFT PANEL — hidden on mobile */}
        <div
          className="hidden lg:flex flex-col justify-between w-[45%] min-h-screen relative overflow-hidden"
          style={{ background: "linear-gradient(160deg, #1a1a3e 0%, #0f0f2d 100%)" }}
        >
          {/* Dotted pattern overlay */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />

          <div className="relative z-10 flex flex-col h-full px-10 py-10">
            {/* Logo */}
            <AppflexorLogo dark />
            <p className="text-indigo-300 text-sm font-medium mt-1">
              Build. Automate. Accelerate.
            </p>

            {/* Headline */}
            <div className="mt-12">
              <h1 className="text-white text-4xl font-extrabold leading-tight">
                Build powerful apps.
                <br />
                Automate processes.
                <br />
                <span style={{ color: "#a78bfa" }}>Without code.</span>
              </h1>
              <p className="text-white/60 text-sm mt-5 leading-relaxed max-w-xs">
                Appflexor is a low-code platform to build business apps, automate
                workflows, manage tasks and analyze data — all with drag-n-drop.
              </p>
            </div>

            {/* App illustration */}
            <div className="mt-8 flex-1 flex items-center justify-center">
              <div
                className="rounded-xl border border-white/10 bg-white/5 p-3 w-full max-w-xs shadow-2xl"
                style={{ backdropFilter: "blur(4px)" }}
              >
                {/* Fake UI wireframe */}
                <div className="bg-white/10 rounded-lg p-3 space-y-2">
                  <div className="flex gap-2">
                    <div className="w-6 h-6 rounded bg-indigo-400/40" />
                    <div className="flex-1 space-y-1">
                      <div className="h-2 bg-white/20 rounded w-3/4" />
                      <div className="h-2 bg-white/10 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {["#a78bfa", "#34d399", "#fb923c"].map((c, i) => (
                      <div key={i} className="rounded h-10" style={{ background: c + "33" }}>
                        <div className="h-full rounded flex items-end p-1">
                          <div
                            className="w-full rounded"
                            style={{
                              background: c,
                              height: `${[60, 40, 75][i]}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-1.5 mt-2">
                    {[70, 50, 85].map((w, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-indigo-400/60" />
                        <div
                          className="h-1.5 rounded bg-white/20"
                          style={{ width: `${w}%` }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                {/* Flow diagram */}
                <div className="mt-3 flex items-center justify-center gap-2">
                  {["#6C5CE7", "#a78bfa", "#34d399"].map((c, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center"
                        style={{ background: c + "33", border: `1.5px solid ${c}` }}
                      >
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ background: c }}
                        />
                      </div>
                      {i < 2 && (
                        <div className="h-px w-4 bg-white/20" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="mt-8 grid grid-cols-2 gap-4">
              <FeatureItem
                icon={
                  <svg className="w-5 h-5 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
                  </svg>
                }
                title="Build UI"
                desc="Pages, Posts, Forms, Data Tables"
              />
              <FeatureItem
                icon={
                  <svg className="w-5 h-5 text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                }
                title="Manage Tasks"
                desc="Complete work with Task inbox"
              />
              <FeatureItem
                icon={
                  <svg className="w-5 h-5 text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                }
                title="Automate"
                desc="Link forms with workflows"
              />
              <FeatureItem
                icon={
                  <svg className="w-5 h-5 text-pink-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM14 5a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM14 11a1 1 0 011-1h4a1 1 0 011 1v8a1 1 0 01-1 1h-4a1 1 0 01-1-1v-8z" />
                  </svg>
                }
                title="Drag-n-Drop"
                desc="Design faster, Deploy quicker"
              />
              <FeatureItem
                icon={
                  <svg className="w-5 h-5 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                }
                title="Analyze"
                desc="Interactive Pivot & Powerful Insights"
              />
            </div>

            {/* Bottom badges */}
            <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-3 gap-4">
              {[
                {
                  icon: (
                    <svg className="w-5 h-5 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  ),
                  title: "Enterprise Ready",
                  desc: "Secure. Scalable. Reliable.",
                },
                {
                  icon: (
                    <svg className="w-5 h-5 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                    </svg>
                  ),
                  title: "Cloud Platform",
                  desc: "Accessible Anytime, Anywhere.",
                },
                {
                  icon: (
                    <svg className="w-5 h-5 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  ),
                  title: "Built for Business",
                  desc: "IT Teams. Citizen Developers. Business Users.",
                },
              ].map((b) => (
                <div key={b.title} className="flex flex-col items-center text-center gap-1">
                  {b.icon}
                  <p className="text-white text-xs font-semibold leading-tight">{b.title}</p>
                  <p className="text-white/50 text-xs leading-tight">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer inside left panel */}
          <div className="relative z-10 px-10 py-4 border-t border-white/10 flex items-center justify-between text-xs text-white/40">
            <span>© 2024 Appflexor Technologies. All rights reserved.</span>
            <div className="flex gap-4">
              <a href="#" className="hover:text-white/70 transition">Privacy Policy</a>
              <span>|</span>
              <a href="#" className="hover:text-white/70 transition">Terms of Use</a>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL — form */}
        <div className="flex-1 flex flex-col min-h-screen bg-white overflow-y-auto">
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">
            <div className="w-full max-w-md">
              {/* Logo (shown on mobile + top of form panel) */}
              <div className="flex justify-center mb-6">
                <AppflexorLogo />
              </div>

              <div className="text-center mb-7">
                <h2 className="text-2xl font-bold text-gray-900">Create your account</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Fill in the details below to get started.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4" data-testid="form-signup">
                <FormField label="First Name" required>
                  <input
                    type="text"
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                    placeholder="Enter your first name"
                    className={inputClass}
                    data-testid="input-first-name"
                    required
                  />
                </FormField>

                <FormField label="Last Name" required>
                  <input
                    type="text"
                    name="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                    placeholder="Enter your last name"
                    className={inputClass}
                    data-testid="input-last-name"
                    required
                  />
                </FormField>

                <FormField label="Company / Business Name" required>
                  <input
                    type="text"
                    name="company"
                    value={form.company}
                    onChange={handleChange}
                    placeholder="Enter your company or business name"
                    className={inputClass}
                    data-testid="input-company"
                    required
                  />
                </FormField>

                <FormField label="Site Name" required>
                  <input
                    type="text"
                    name="siteName"
                    value={form.siteName}
                    onChange={handleChange}
                    placeholder="Enter your site name"
                    className={inputClass}
                    data-testid="input-site-name"
                    required
                  />
                </FormField>

                <FormField label="Email" required>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    className={inputClass}
                    data-testid="input-email"
                    required
                  />
                </FormField>

                <FormField label="Phone" required>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 whitespace-nowrap select-none">
                      <span>🇺🇸</span>
                      <span>+1</span>
                      <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="Enter your phone number"
                      className={inputClass}
                      data-testid="input-phone"
                      required
                    />
                  </div>
                </FormField>

                <FormField label="No of Employees" required>
                  <div className="relative">
                    <select
                      name="employees"
                      value={form.employees}
                      onChange={handleChange}
                      className={selectClass}
                      data-testid="select-employees"
                      required
                    >
                      <option value="" disabled>Select number of employees</option>
                      {EMPLOYEES_OPTIONS.map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </FormField>

                <FormField label="Web Site" required={false}>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                    </span>
                    <input
                      type="url"
                      name="website"
                      value={form.website}
                      onChange={handleChange}
                      placeholder="Enter your website"
                      className={`${inputClass} pl-9`}
                      data-testid="input-website"
                    />
                  </div>
                </FormField>

                <FormField label="Country" required>
                  <div className="relative">
                    <select
                      name="country"
                      value={form.country}
                      onChange={handleChange}
                      className={selectClass}
                      data-testid="select-country"
                      required
                    >
                      <option value="" disabled>Select your country</option>
                      {COUNTRIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </FormField>

                {/* Terms */}
                <label className="flex items-start gap-2.5 cursor-pointer" data-testid="label-terms">
                  <input
                    type="checkbox"
                    name="agreed"
                    checked={form.agreed}
                    onChange={handleChange}
                    className="mt-0.5 w-4 h-4 rounded border-gray-300 accent-indigo-600"
                    data-testid="checkbox-terms"
                    required
                  />
                  <span className="text-sm text-gray-600">
                    I have read and agree with the{" "}
                    <a href="#" className="text-indigo-600 font-medium hover:underline">
                      Terms of Use
                    </a>
                    . *
                  </span>
                </label>

                {/* Submit */}
                <button
                  type="submit"
                  className="w-full py-3 rounded-lg text-white font-semibold text-sm transition hover:opacity-90 active:scale-[0.99] mt-2"
                  style={{
                    background: "linear-gradient(90deg, #6C5CE7 0%, #a78bfa 100%)",
                  }}
                  data-testid="button-signup"
                >
                  Sign up
                </button>

                <p className="text-center text-sm text-gray-500 mt-1">
                  Already have an account?{" "}
                  <a href="#" className="text-indigo-600 font-medium hover:underline" data-testid="link-signin">
                    Sign in
                  </a>
                </p>
              </form>
            </div>
          </div>

          {/* Footer (mobile only) */}
          <div className="lg:hidden px-6 py-4 border-t border-gray-100 flex flex-col items-center gap-1 text-xs text-gray-400">
            <span>© 2024 Appflexor Technologies. All rights reserved.</span>
            <div className="flex gap-3">
              <a href="#" className="hover:text-gray-600">Privacy Policy</a>
              <span>|</span>
              <a href="#" className="hover:text-gray-600">Terms of Use</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
