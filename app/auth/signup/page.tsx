"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "next-auth/react";
import Link from "next/link";
import {
  Brain,
  Mail,
  Lock,
  User,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Code2,
} from "lucide-react";

// ─── Schemas ────────────────────────────────────────────────────────────────

const step1Schema = z
  .object({
    name: z.string().min(1, "Full name is required").trim(),
    email: z.string().min(1, "Email is required").email("Enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const step2Schema = z.object({
  experienceLevel: z.string().min(1, "Select your experience level"),
  goal: z.string().min(1, "Select your goal"),
  targetCompanies: z.array(z.string()).optional(),
  leetcodeUsername: z.string().optional(),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;

// ─── Constants ───────────────────────────────────────────────────────────────

const EXPERIENCE_LEVELS = [
  { value: "Beginner", label: "Complete Beginner", desc: "New to coding or algorithms" },
  { value: "SomeExperience", label: "Some Experience", desc: "Know basics, limited DS&A" },
  { value: "Intermediate", label: "Intermediate", desc: "Can solve Easy–Medium problems" },
  { value: "Advanced", label: "Advanced", desc: "Comfortable with Hard problems" },
];

const GOALS = [
  { value: "faang", label: "Get a FAANG job" },
  { value: "any_job", label: "Get any software job" },
  { value: "improve", label: "Improve my skills" },
  { value: "interviews", label: "Prepare for interviews" },
];

const COMPANIES = [
  { name: "Google", color: "#4285F4" },
  { name: "Meta", color: "#0866FF" },
  { name: "Amazon", color: "#FF9900" },
  { name: "Apple", color: "#555555" },
  { name: "Microsoft", color: "#00A4EF" },
  { name: "Netflix", color: "#E50914" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const inputClass =
  "w-full px-4 py-3 rounded-xl border text-sm text-white placeholder-slate-500 outline-none transition-all focus:ring-2 focus:ring-indigo-500/50";
const inputStyle = (hasError: boolean) => ({
  background: "rgba(15, 23, 42, 0.6)",
  borderColor: hasError ? "#ef4444" : "rgba(100, 116, 139, 0.4)",
});

// ─── Component ───────────────────────────────────────────────────────────────

export default function SignupPage() {
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Collected data across steps
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);
  const [step2Data, setStep2Data] = useState<Step2Data>({
    experienceLevel: "SomeExperience",
    goal: "faang",
    targetCompanies: [],
    leetcodeUsername: "",
  });

  // ── Step 1 form ──
  const {
    register: reg1,
    handleSubmit: handleStep1,
    formState: { errors: err1 },
  } = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: step1Data ?? undefined,
  });

  // ── Step 2 local state (simple — no hook-form needed) ──
  const toggleCompany = (name: string) => {
    setStep2Data((prev) => {
      const current = prev.targetCompanies ?? [];
      return {
        ...prev,
        targetCompanies: current.includes(name)
          ? current.filter((c) => c !== name)
          : [...current, name],
      };
    });
  };

  // ── Submit ──
  const onFinalSubmit = async () => {
    if (!step1Data) return;
    setIsLoading(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: step1Data.email,
          name: step1Data.name,
          password: step1Data.password,
          experienceLevel: step2Data.experienceLevel,
          goal: step2Data.goal,
          targetCompanies: step2Data.targetCompanies ?? [],
          leetcodeUsername: step2Data.leetcodeUsername ?? "",
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setSubmitError(json.error ?? "Registration failed. Please try again.");
        setIsLoading(false);
        return;
      }

      // Auto sign-in
      const result = await signIn("credentials", {
        email: step1Data.email,
        password: step1Data.password,
        callbackUrl: "/onboarding",
        redirect: false,
      });

      if (result?.url) {
        window.location.href = result.url;
      } else {
        window.location.href = "/onboarding";
      }
    } catch {
      setSubmitError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  // ── Shared card wrapper ──
  const Card = ({ children }: { children: React.ReactNode }) => (
    <div
      className="rounded-2xl border border-slate-700/50 p-8 shadow-2xl"
      style={{ background: "rgba(30, 41, 59, 0.8)", backdropFilter: "blur(12px)" }}
    >
      {children}
    </div>
  );

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)" }}
    >
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" }}
          >
            <Brain className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Algorithm Mentor Academy
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Create your free account and start mastering algorithms
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                style={{
                  background:
                    s < step
                      ? "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
                      : s === step
                      ? "rgba(99, 102, 241, 0.3)"
                      : "rgba(100, 116, 139, 0.2)",
                  color: s <= step ? "#a5b4fc" : "#64748b",
                  border: s === step ? "2px solid #6366f1" : "2px solid transparent",
                }}
              >
                {s < step ? <CheckCircle className="w-4 h-4 text-white" /> : s}
              </div>
              {s < 3 && (
                <div
                  className="w-12 h-0.5 rounded"
                  style={{
                    background: s < step ? "#6366f1" : "rgba(100, 116, 139, 0.2)",
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* ── STEP 1: Basic Info ── */}
        {step === 1 && (
          <Card>
            <h2 className="text-xl font-semibold text-white mb-1">Create your account</h2>
            <p className="text-sm text-slate-400 mb-6">Step 1 of 3 — Basic information</p>

            <form
              onSubmit={handleStep1((data) => {
                setStep1Data(data);
                setStep(2);
              })}
              className="space-y-5"
              noValidate
            >
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Full name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    {...reg1("name")}
                    type="text"
                    placeholder="Jane Smith"
                    autoComplete="name"
                    className={`${inputClass} pl-10`}
                    style={inputStyle(!!err1.name)}
                  />
                </div>
                {err1.name && (
                  <p className="mt-1.5 text-xs text-red-400">{err1.name.message}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    {...reg1("email")}
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    className={`${inputClass} pl-10`}
                    style={inputStyle(!!err1.email)}
                  />
                </div>
                {err1.email && (
                  <p className="mt-1.5 text-xs text-red-400">{err1.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    {...reg1("password")}
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimum 8 characters"
                    autoComplete="new-password"
                    className={`${inputClass} pl-10 pr-10`}
                    style={inputStyle(!!err1.password)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {err1.password && (
                  <p className="mt-1.5 text-xs text-red-400">{err1.password.message}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Confirm password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    {...reg1("confirmPassword")}
                    type={showConfirm ? "text" : "password"}
                    placeholder="Repeat your password"
                    autoComplete="new-password"
                    className={`${inputClass} pl-10 pr-10`}
                    style={inputStyle(!!err1.confirmPassword)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {err1.confirmPassword && (
                  <p className="mt-1.5 text-xs text-red-400">{err1.confirmPassword.message}</p>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl font-semibold text-white text-sm transition-all flex items-center justify-center gap-2 mt-2"
                style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" }}
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-400">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Sign in
              </Link>
            </p>
          </Card>
        )}

        {/* ── STEP 2: Personalization ── */}
        {step === 2 && (
          <Card>
            <h2 className="text-xl font-semibold text-white mb-1">Personalize your journey</h2>
            <p className="text-sm text-slate-400 mb-6">Step 2 of 3 — Tell us about yourself</p>

            <div className="space-y-6">
              {/* Experience Level */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  I am...
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {EXPERIENCE_LEVELS.map((level) => (
                    <button
                      key={level.value}
                      type="button"
                      onClick={() =>
                        setStep2Data((p) => ({ ...p, experienceLevel: level.value }))
                      }
                      className="rounded-xl p-3 text-left transition-all border"
                      style={{
                        background:
                          step2Data.experienceLevel === level.value
                            ? "rgba(99, 102, 241, 0.2)"
                            : "rgba(15, 23, 42, 0.4)",
                        borderColor:
                          step2Data.experienceLevel === level.value
                            ? "#6366f1"
                            : "rgba(100, 116, 139, 0.3)",
                      }}
                    >
                      <p className="text-sm font-semibold text-white">{level.label}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{level.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Goal */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  My goal is to...
                </label>
                <div className="space-y-2">
                  {GOALS.map((g) => (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => setStep2Data((p) => ({ ...p, goal: g.value }))}
                      className="w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition-all border flex items-center gap-3"
                      style={{
                        background:
                          step2Data.goal === g.value
                            ? "rgba(99, 102, 241, 0.2)"
                            : "rgba(15, 23, 42, 0.4)",
                        borderColor:
                          step2Data.goal === g.value
                            ? "#6366f1"
                            : "rgba(100, 116, 139, 0.3)",
                        color: step2Data.goal === g.value ? "#a5b4fc" : "#94a3b8",
                      }}
                    >
                      <div
                        className="w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0"
                        style={{
                          borderColor: step2Data.goal === g.value ? "#6366f1" : "#475569",
                        }}
                      >
                        {step2Data.goal === g.value && (
                          <div className="w-2 h-2 rounded-full bg-indigo-500" />
                        )}
                      </div>
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Companies */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Target companies{" "}
                  <span className="text-slate-500 font-normal">(optional)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {COMPANIES.map((c) => {
                    const selected = (step2Data.targetCompanies ?? []).includes(c.name);
                    return (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => toggleCompany(c.name)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all border"
                        style={{
                          background: selected
                            ? `${c.color}20`
                            : "rgba(15, 23, 42, 0.5)",
                          borderColor: selected ? c.color : "rgba(100, 116, 139, 0.3)",
                          color: selected ? "#f1f5f9" : "#94a3b8",
                        }}
                      >
                        <div
                          className="w-3 h-3 rounded-sm shrink-0"
                          style={{ background: c.color }}
                        />
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* LeetCode username */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  LeetCode username{" "}
                  <span className="text-slate-500 font-normal">(optional, sync later)</span>
                </label>
                <div className="relative">
                  <Code2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={step2Data.leetcodeUsername ?? ""}
                    onChange={(e) =>
                      setStep2Data((p) => ({ ...p, leetcodeUsername: e.target.value }))
                    }
                    placeholder="your_leetcode_handle"
                    className={`${inputClass} pl-10`}
                    style={inputStyle(false)}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-600 text-slate-300 text-sm font-medium hover:border-slate-500 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex-1 py-3 px-4 rounded-xl font-semibold text-white text-sm transition-all flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" }}
                >
                  Review & Confirm <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </Card>
        )}

        {/* ── STEP 3: Confirmation ── */}
        {step === 3 && step1Data && (
          <Card>
            <h2 className="text-xl font-semibold text-white mb-1">You&apos;re all set!</h2>
            <p className="text-sm text-slate-400 mb-6">Step 3 of 3 — Confirm your details</p>

            {submitError && (
              <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                <p className="text-sm text-red-400">{submitError}</p>
              </div>
            )}

            <div className="space-y-3 mb-6">
              {/* Summary rows */}
              {[
                { label: "Name", value: step1Data.name },
                { label: "Email", value: step1Data.email },
                {
                  label: "Experience",
                  value:
                    EXPERIENCE_LEVELS.find((l) => l.value === step2Data.experienceLevel)?.label ??
                    step2Data.experienceLevel,
                },
                {
                  label: "Goal",
                  value:
                    GOALS.find((g) => g.value === step2Data.goal)?.label ?? step2Data.goal,
                },
                ...(step2Data.targetCompanies && step2Data.targetCompanies.length > 0
                  ? [{ label: "Companies", value: step2Data.targetCompanies.join(", ") }]
                  : []),
                ...(step2Data.leetcodeUsername
                  ? [{ label: "LeetCode", value: step2Data.leetcodeUsername }]
                  : []),
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="flex items-start gap-4 px-4 py-3 rounded-xl"
                  style={{ background: "rgba(15, 23, 42, 0.5)" }}
                >
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide w-24 shrink-0 pt-0.5">
                    {label}
                  </span>
                  <span className="text-sm text-slate-200">{value}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-600 text-slate-300 text-sm font-medium hover:border-slate-500 transition-all"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button
                type="button"
                onClick={onFinalSubmit}
                disabled={isLoading}
                className="flex-1 py-3 px-4 rounded-xl font-semibold text-white text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{
                  background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Create Account
                  </>
                )}
              </button>
            </div>
          </Card>
        )}

        <p className="mt-6 text-center text-xs text-slate-600">
          Algorithm Mentor Academy &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
