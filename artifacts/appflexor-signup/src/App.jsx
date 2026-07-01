import React, { useState } from 'react'
import {
  User, Building2, Globe, Mail, Phone, Users, Link2, ChevronDown,
  LayoutDashboard, CheckSquare, Zap, Move, BarChart3,
  Shield, Cloud, Briefcase,
} from 'lucide-react'

// ── AppFlexor Logo ─────────────────────────────────────────────────────────────
function Logo({ size = 28 }) {
  return (
    <div className="flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 44 44" fill="none">
        <polygon points="22,2 43,43 1,43" fill="#7C3AED" />
        <polygon points="22,13 34,40 10,40" fill="white" opacity="0.22" />
      </svg>
      <span className="font-bold text-gray-900" style={{ fontSize: `${Math.round(size * 0.64)}px` }}>
        appflexor
      </span>
    </div>
  )
}

// ── Static data ────────────────────────────────────────────────────────────────
const FEATURES = [
  { Icon: LayoutDashboard, title: 'Build UI',        desc: 'Pages, Posts, Forms, Data Tables',      ic: 'text-blue-600',   bg: 'bg-blue-50'   },
  { Icon: CheckSquare,     title: 'Manage Tasks',    desc: 'Complete work with Task inbox',          ic: 'text-orange-500', bg: 'bg-orange-50' },
  { Icon: Zap,             title: 'Automate',        desc: 'Link forms with workflows',              ic: 'text-green-600',  bg: 'bg-green-50'  },
  { Icon: Move,            title: 'Drag-n-Drop',     desc: 'Design faster. Deploy quicker.',         ic: 'text-pink-500',   bg: 'bg-pink-50'   },
  { Icon: BarChart3,       title: 'Analyze',         desc: 'Interactive Pivot & Powerful Insights',  ic: 'text-indigo-600', bg: 'bg-indigo-50' },
]
const BOTTOM_BADGES = [
  { Icon: Shield,    label: 'Enterprise Ready',    sub: 'Secure. Scalable. Reliable.',               cls: 'text-gray-600'   },
  { Icon: Cloud,     label: 'Cloud Platform',      sub: 'Accessible Anytime, Anywhere.',              cls: 'text-blue-500'   },
  { Icon: Briefcase, label: 'Built for Business',  sub: 'IT Teams. Citizen Developers. Business Users.', cls: 'text-orange-500' },
]
const COUNTRIES  = ['United States','United Kingdom','Canada','Australia','Germany','France','India','Singapore','UAE','Other']
const EMPLOYEES  = ['1-10','11-50','51-200','201-500','501-1000','1000+']
const DIAL_CODES = [
  { f: '🇺🇸', c: '+1'  }, { f: '🇬🇧', c: '+44' },
  { f: '🇮🇳', c: '+91' }, { f: '🇦🇺', c: '+61' },
  { f: '🇩🇪', c: '+49' }, { f: '🇫🇷', c: '+33' },
]

// ── Shared base class ──────────────────────────────────────────────────────────
const inputBase = (hasIcon) =>
  `w-full border border-gray-200 rounded-lg py-2.5 text-sm text-gray-700 placeholder-gray-400 bg-white
   focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition
   ${hasIcon ? 'pl-9 pr-3' : 'px-3'}`

// ── Tiny label ─────────────────────────────────────────────────────────────────
function Lbl({ children, required }) {
  return (
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}

// ── Text input field ───────────────────────────────────────────────────────────
function TxtInput({ label, required, icon: Icon, ...p }) {
  return (
    <div>
      {label && <Lbl required={required}>{label}</Lbl>}
      <div className="relative">
        {Icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <Icon size={15} />
          </span>
        )}
        <input {...p} className={inputBase(!!Icon)} />
      </div>
    </div>
  )
}

// ── Select field ───────────────────────────────────────────────────────────────
function SelInput({ label, required, icon: Icon, children, ...p }) {
  return (
    <div>
      {label && <Lbl required={required}>{label}</Lbl>}
      <div className="relative">
        {Icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10">
            <Icon size={15} />
          </span>
        )}
        <select {...p} className={`${inputBase(!!Icon)} appearance-none pr-8`}>
          {children}
        </select>
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          <ChevronDown size={14} />
        </span>
      </div>
    </div>
  )
}

// ── App mockup illustration ────────────────────────────────────────────────────
function AppMockup() {
  return (
    <div className="mt-5 rounded-xl overflow-hidden border border-gray-200 shadow-md bg-white">
      {/* browser chrome */}
      <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-2 border-b border-gray-200">
        <span className="w-2.5 h-2.5 rounded-full bg-red-400 block" />
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 block" />
        <span className="w-2.5 h-2.5 rounded-full bg-green-400 block" />
        <span className="ml-2 flex-1 bg-white rounded text-xs text-gray-400 px-2 py-0.5 block">appflexor.com</span>
      </div>
      <div className="flex h-32">
        {/* sidebar */}
        <div className="w-9 bg-indigo-700 flex flex-col items-center py-3 gap-2 shrink-0">
          {[...Array(5)].map((_, i) => (
            <span key={i} className="w-5 h-5 rounded bg-white opacity-20 block" />
          ))}
        </div>
        {/* canvas */}
        <div className="flex-1 bg-gray-50 p-2.5 flex flex-col gap-2">
          <div className="flex gap-2">
            {[...Array(3)].map((_, i) => (
              <span key={i} className="flex-1 h-5 rounded bg-white border border-gray-200 block" />
            ))}
          </div>
          <div className="flex gap-2 flex-1 min-h-0">
            <div className="flex-1 bg-white rounded border border-gray-200 p-2 flex flex-col gap-1.5">
              <span className="w-3/4 h-1.5 rounded bg-gray-200 block" />
              <span className="w-1/2 h-1.5 rounded bg-gray-200 block" />
              <span className="w-full h-1.5 rounded bg-gray-100 block mt-auto" />
            </div>
            <div className="flex-1 bg-white rounded border border-gray-200 flex items-center justify-center">
              <div className="flex flex-col items-center gap-1.5">
                <span className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center">
                  <span className="w-4 h-4 rounded-full bg-violet-400 block" />
                </span>
                <span className="w-10 h-1.5 rounded bg-gray-200 block" />
              </div>
            </div>
            <div className="flex-1 bg-white rounded border border-gray-200 p-2 flex flex-col gap-1.5">
              {[...Array(3)].map((_, i) => (
                <span key={i} className="w-full h-1.5 rounded bg-gray-200 block" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Signup form (shared by both layouts) ──────────────────────────────────────
function SignupForm({ withIcons = false }) {
  const [form, setForm] = useState({
    firstName: '', lastName: '', company: '', siteName: '',
    email: '', dialCode: '+1', phone: '',
    employees: '', website: '', country: '', agree: false,
  })

  const set = (e) => {
    const { name, value, type, checked } = e.target
    setForm(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }))
  }

  const ic = (I) => withIcons ? I : null

  return (
    <form className="space-y-3.5" onSubmit={e => e.preventDefault()}>
      <div className="grid grid-cols-2 gap-3">
        <TxtInput label="First Name" required icon={ic(User)}
          name="firstName" value={form.firstName} onChange={set}
          placeholder="Enter your first name" />
        <TxtInput label="Last Name" required icon={ic(User)}
          name="lastName" value={form.lastName} onChange={set}
          placeholder="Enter your last name" />
      </div>

      <TxtInput label="Company / Business Name" required icon={ic(Building2)}
        name="company" value={form.company} onChange={set}
        placeholder="Enter your company or business name" />

      <TxtInput label="Site Name" required icon={ic(Globe)}
        name="siteName" value={form.siteName} onChange={set}
        placeholder="Enter your site name" />

      <TxtInput label="Email" required type="email" icon={ic(Mail)}
        name="email" value={form.email} onChange={set}
        placeholder="Enter your email" />

      {/* Phone with country code */}
      <div>
        <Lbl required>Phone</Lbl>
        <div className="flex gap-2">
          <select
            name="dialCode"
            value={form.dialCode}
            onChange={set}
            className="shrink-0 border border-gray-200 rounded-lg px-2 py-2.5 text-sm bg-white
                       focus:outline-none focus:ring-2 focus:ring-violet-400 w-[88px]"
          >
            {DIAL_CODES.map(({ f, c }) => (
              <option key={c} value={c}>{f} {c}</option>
            ))}
          </select>
          <div className="relative flex-1">
            {withIcons && (
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <Phone size={15} />
              </span>
            )}
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={set}
              placeholder="Enter your phone number"
              className={inputBase(withIcons)}
            />
          </div>
        </div>
      </div>

      <SelInput label="No of Employees" required icon={ic(Users)}
        name="employees" value={form.employees} onChange={set}>
        <option value="">Select number of employees</option>
        {EMPLOYEES.map(e => <option key={e} value={e}>{e}</option>)}
      </SelInput>

      <TxtInput label="Web Site (Optional)" type="url" icon={ic(Link2)}
        name="website" value={form.website} onChange={set}
        placeholder="Enter your website" />

      <SelInput label="Country" required icon={ic(Globe)}
        name="country" value={form.country} onChange={set}>
        <option value="">Select your country</option>
        {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
      </SelInput>

      {/* Terms checkbox */}
      <label className="flex items-start gap-2.5 cursor-pointer select-none">
        <input
          type="checkbox"
          name="agree"
          checked={form.agree}
          onChange={set}
          className="mt-0.5 w-4 h-4 rounded border-gray-300 accent-violet-600"
        />
        <span className="text-sm text-gray-600">
          I have read and agree with the{' '}
          <a href="#" className="text-violet-600 font-medium hover:underline">Terms of Use</a>.
          <span className="text-red-500 ml-0.5">*</span>
        </span>
      </label>

      <button
        type="submit"
        className="w-full bg-indigo-700 hover:bg-indigo-800 active:bg-indigo-900
                   text-white font-semibold py-3 rounded-lg transition-colors"
      >
        Sign up
      </button>

      <p className="text-center text-sm text-gray-500">
        Already have an account?{' '}
        <a href="#" className="text-violet-600 font-medium hover:underline">Sign in</a>
      </p>
    </form>
  )
}

// ── Left branding panel (desktop only) ────────────────────────────────────────
function BrandingPanel() {
  return (
    <div className="flex flex-col p-8 xl:p-10 h-full">
      <Logo size={30} />
      <p className="text-[10px] font-bold tracking-widest text-violet-600 mt-1 uppercase">
        Build. Automate. Accelerate.
      </p>

      <div className="mt-8">
        <h1 className="text-3xl xl:text-4xl font-extrabold text-gray-900 leading-snug">
          Build powerful apps.<br />
          Automate processes.<br />
          <span className="text-violet-600">Without code.</span>
        </h1>
        <p className="mt-4 text-sm text-gray-500 leading-relaxed max-w-xs">
          Appflexor is a low-code platform to build business apps, automate
          workflows, manage tasks and analyze data – all with drag-n-drop.
        </p>
      </div>

      {/* Feature cards */}
      <div className="mt-7 grid grid-cols-2 gap-2.5">
        {FEATURES.map(({ Icon, title, desc, ic, bg }) => (
          <div key={title} className="flex items-start gap-2.5 bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
            <div className={`shrink-0 p-1.5 rounded-lg ${bg}`}>
              <Icon size={15} className={ic} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-800">{title}</p>
              <p className="text-[11px] text-gray-500 mt-0.5 leading-tight">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      <AppMockup />

      {/* Bottom badges */}
      <div className="mt-6 flex flex-wrap gap-x-5 gap-y-3">
        {BOTTOM_BADGES.map(({ Icon, label, sub, cls }) => (
          <div key={label} className="flex items-start gap-2 text-xs">
            <Icon size={15} className={`${cls} mt-0.5 shrink-0`} />
            <div>
              <p className={`font-semibold ${cls}`}>{label}</p>
              <p className="text-gray-400 leading-tight">{sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Page footer ───────────────────────────────────────────────────────────────
function Footer({ className = '' }) {
  return (
    <footer className={`text-[11px] text-gray-400 text-center ${className}`}>
      © 2024 Appflexor Technologies. All rights reserved.&ensp;
      <a href="#" className="hover:text-gray-600">Privacy Policy</a>
      &ensp;|&ensp;
      <a href="#" className="hover:text-gray-600">Terms of Use</a>
    </footer>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <div className="min-h-screen bg-slate-100 flex items-start lg:items-center justify-center py-6 px-3 lg:p-8">
      <div className="w-full max-w-5xl xl:max-w-6xl">

        {/* ══ DESKTOP (lg+): two-column card ══ */}
        <div className="hidden lg:flex rounded-2xl shadow-xl overflow-hidden bg-white">

          {/* Left: branding */}
          <div className="w-[52%] bg-gray-50 border-r border-gray-100 overflow-y-auto" style={{ maxHeight: '95vh' }}>
            <BrandingPanel />
          </div>

          {/* Right: form */}
          <div className="flex-1 flex flex-col overflow-y-auto" style={{ maxHeight: '95vh' }}>
            <div className="flex-1 px-10 py-8">
              <div className="max-w-sm mx-auto">
                <div className="flex justify-center mb-5">
                  <Logo size={30} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 text-center">
                  Create your account
                </h2>
                <p className="text-sm text-gray-400 text-center mt-1 mb-6">
                  Fill in the details below to get started.
                </p>
                <SignupForm withIcons={false} />
              </div>
            </div>
            <Footer className="px-8 py-3 border-t border-gray-100" />
          </div>
        </div>

        {/* ══ MOBILE (< lg): single-column card ══ */}
        <div className="lg:hidden bg-white rounded-2xl shadow-xl p-5">
          <div className="flex justify-center mb-5">
            <Logo size={28} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 text-center">
            Create your account
          </h2>
          <p className="text-sm text-gray-400 text-center mt-1 mb-5">
            Fill in the details below to get started.
          </p>
          <SignupForm withIcons={true} />
          <Footer className="mt-5" />
        </div>

      </div>
    </div>
  )
}