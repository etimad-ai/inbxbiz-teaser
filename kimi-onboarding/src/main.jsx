import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://nayma-unified-leads-capture-795256461991.me-central1.run.app/";

const formSteps = [
  { key: "name", title: "Please share your full name", hint: "Full name", type: "text", required: true },
  { key: "email", title: "Where can we reach you?", hint: "you@company.com", type: "email", required: true },
  { key: "phone", title: "A phone number for event updates.", hint: "WhatsApp number works best", type: "tel", required: true },
  { key: "city", title: "Which city are you based in?", hint: "City", type: "text", required: true },
  { key: "business", title: "What's your business called?", hint: "Business or practice name", type: "text", required: true },
  {
    key: "category",
    title: "What does your business do?",
    hint: "e.g. chartered accountancy, IT services, manufacturing, interior design",
    type: "text",
    required: true,
  },
  {
    key: "role",
    title: "And your role there?",
    hint: "Pick the closest fit.",
    type: "choice",
    multiple: false,
    required: true,
    options: ["Founder or co-founder", "Business owner", "Independent consultant", "Working professional", "Other"],
  },
  {
    key: "lookingFor",
    title: "How would you like InBx to support your business?",
    hint: "Select all that apply.",
    type: "choice",
    multiple: true,
    required: true,
    options: ["New clients", "Referral partners", "Collaborations", "Learning sessions", "A local business community"],
  },
  {
    key: "heardFrom",
    title: "How did you hear about us?",
    hint: "Optional — pick one.",
    type: "choice",
    multiple: false,
    required: false,
    options: ["A referral", "LinkedIn", "WhatsApp", "An event", "Other"],
  },
  { key: "note", title: "Anything else we should know?", hint: "Optional", type: "textarea", required: false },
];

async function submitRegistration(answers) {
  const payload = {
    appId: "inbx",
    name: answers.name,
    email: answers.email,
    phone: answers.phone,
    metadata: {
      city: answers.city,
      organization: answers.business,
      category: answers.category,
      role: answers.role,
      lookingFor: answers.lookingFor,
      heardFrom: answers.heardFrom || undefined,
      note: answers.note || undefined,
      source: "inbx-register",
      submittedAt: new Date().toISOString(),
    },
  };
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
}

function Mark() {
  return (
    <span className="brand" aria-label="InBx">
      <img src="../assets/icon.png" alt="" />
      <span className="wordmark">InBx</span>
    </span>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M4 10h11M11 6l4 4-4 4" />
    </svg>
  );
}

function BrandPanel() {
  return (
    <div className="brand-panel" aria-hidden="true">
      <span className="brand-panel__tile brand-panel__tile--navy" />
      <span className="brand-panel__tile brand-panel__tile--blue" />
      <span className="brand-panel__tile brand-panel__tile--teal" />
      <span className="brand-panel__caption">Connect — Refer — Grow</span>
    </div>
  );
}

function Field({ step, value, onChange, invalid }) {
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, [step.key]);

  if (step.type === "choice") {
    const selected = step.multiple ? (Array.isArray(value) ? value : []) : value;
    return (
      <div className="choice-grid" role="group" aria-label={step.title}>
        {step.options.map((option, index) => {
          const active = step.multiple ? selected.includes(option) : selected === option;
          return (
            <button
              className={`choice ${active ? "is-selected" : ""}`}
              type="button"
              aria-pressed={active}
              key={option}
              onClick={() => {
                if (step.multiple) {
                  onChange(active ? selected.filter((item) => item !== option) : [...selected, option]);
                } else {
                  onChange(option);
                }
              }}
            >
              <span>{String.fromCharCode(65 + index)}</span>{option}
            </button>
          );
        })}
      </div>
    );
  }

  if (step.type === "textarea") {
    return (
      <textarea
        ref={inputRef}
        className={invalid ? "is-error" : ""}
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder={step.hint}
        rows="4"
        aria-invalid={invalid}
      />
    );
  }

  return (
    <input
      ref={inputRef}
      className={invalid ? "is-error" : ""}
      type={step.type}
      value={value || ""}
      onChange={(event) => onChange(event.target.value)}
      placeholder={step.hint}
      aria-invalid={invalid}
    />
  );
}

function Registration() {
  const [screen, setScreen] = useState("welcome");
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState({ lookingFor: [] });
  const [invalid, setInvalid] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const step = formSteps[stepIndex];
  const progress = useMemo(() => ((stepIndex + 1) / formSteps.length) * 100, [stepIndex]);

  const validate = () => {
    const value = answers[step.key];
    if (step.type === "choice") {
      if (!step.required) return true;
      return step.multiple ? value.length > 0 : Boolean(value);
    }
    if (!step.required && !String(value || "").trim()) return true;
    if (!String(value || "").trim()) return false;
    if (step.type === "email") return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    if (step.type === "tel") return /^\+?[\d\s-]{8,16}$/.test(value.trim());
    return true;
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      await submitRegistration(answers);
      setScreen("success");
    } catch {
      setScreen("error");
    } finally {
      setSubmitting(false);
    }
  };

  const advance = () => {
    if (!validate()) { setInvalid(true); return; }
    setInvalid(false);
    if (stepIndex < formSteps.length - 1) {
      setStepIndex((index) => index + 1);
      return;
    }
    submit();
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey && step.type !== "textarea") {
      event.preventDefault();
      advance();
    }
  };

  return (
    <div className="registration">
      {screen === "welcome" && (
        <section className="welcome-panel">
          <BrandPanel />
          <div className="welcome-panel__copy">
            <p className="mono-label">INBX · REGISTRATION</p>
            <h1>Register for InBx.</h1>
            <p>
              A business networking and referral community for Indian entrepreneurs, owners and
              professionals. Answer a few questions — about two minutes — and we'll reach out with
              details of the first meet in your city.
            </p>
            <button className="btn btn-primary btn-lg" onClick={() => setScreen("form")}>
              Start registration <ArrowIcon />
            </button>
            <p className="welcome-panel__fine">
              The first 25 registered businesses per city are eligible to display their brand on
              InBx — subject to profile review and category availability.
            </p>
          </div>
        </section>
      )}

      {screen === "form" && (
        <form className="form-shell" onSubmit={(event) => { event.preventDefault(); advance(); }} onKeyDown={handleKeyDown}>
          <div className="form-shell__progress" aria-label={`Question ${stepIndex + 1} of ${formSteps.length}`}>
            <span>{String(stepIndex + 1).padStart(2, "0")} / {String(formSteps.length).padStart(2, "0")}</span>
            <div><i style={{ transform: `scaleX(${progress / 100})` }} /></div>
          </div>
          <div className="form-shell__question" key={step.key}>
            <p className="mono-label">QUESTION {String(stepIndex + 1).padStart(2, "0")}</p>
            <h2>{step.title}</h2>
            {step.type === "choice" && <p className="form-shell__hint">{step.hint}</p>}
            <Field
              step={step}
              value={answers[step.key]}
              invalid={invalid}
              onChange={(value) => { setAnswers((current) => ({ ...current, [step.key]: value })); setInvalid(false); }}
            />
            <p className={`form-shell__error ${invalid ? "is-visible" : ""}`} role="alert" aria-live="polite">
              {invalid ? "Please add a valid answer before continuing." : "\u00A0"}
            </p>
            <div className="form-shell__actions">
              <button
                className="btn"
                type="button"
                style={{background:"#fff",borderColor:"var(--line-strong)",color:"var(--ink)"}}
                onClick={() => stepIndex === 0 ? setScreen("welcome") : setStepIndex((index) => index - 1)}
              >Back</button>
              <button
                className="btn btn-primary"
                type="submit"
                disabled={submitting}
                data-state={submitting ? "loading" : undefined}
              >
                {submitting ? "Sending…" : stepIndex === formSteps.length - 1 ? "Register" : "Continue"}
                {!submitting && <ArrowIcon />}
              </button>
            </div>
          </div>
        </form>
      )}

      {screen === "success" && (
        <section className="success-panel">
          <div className="success-panel__signal" aria-hidden="true"><span>✓</span></div>
          <p className="mono-label">REGISTRATION RECEIVED</p>
          <h2>You're on the list{answers.name ? `, ${String(answers.name).split(" ")[0]}` : ""}.</h2>
          <p>
            We'll review your profile and reach out with details of the first InBx meeting
            {answers.city ? ` in ${answers.city}` : " in your city"}.
          </p>
          <a className="btn btn-primary" href="../">Back to site</a>
        </section>
      )}

      {screen === "error" && (
        <section className="success-panel">
          <div className="success-panel__signal success-panel__signal--error" aria-hidden="true"><span>!</span></div>
          <p className="mono-label">NOT SENT</p>
          <h2>We couldn't send that.</h2>
          <p>Something went wrong while sending your registration. Your answers are still here — try again.</p>
          <div className="success-panel__actions">
            <button className="btn btn-primary" onClick={submit} disabled={submitting}>
              {submitting ? "Sending…" : "Try again"}
            </button>
            <a className="btn" href="../" style={{background:"#fff",borderColor:"var(--line-strong)",color:"var(--ink)"}}>Back to site</a>
          </div>
        </section>
      )}
    </div>
  );
}

function App() {
  return (
    <>
      <header className="nav">
        <div className="nav-inner">
          <a className="brand" href="../" aria-label="Back to the InBx site">
            <img src="../assets/icon.png" alt="" />
            <span className="wordmark">InBx</span>
          </a>
        </div>
      </header>
      <main className="page">
        <Registration />
      </main>
      <footer className="footer">
        <div className="wrap foot">
          <div className="foot-brand"><img src="../assets/icon.png" alt="" /> InBx</div>
          <p>Connect — Refer — Grow.</p>
          <div className="foot-meta">© 2026 InBx</div>
        </div>
        <div className="wrap"><p className="disclaimer">InBX is an independent private business networking and referral-facilitation platform. It does not represent or act on behalf of any government, embassy, chamber, regulator, or other business-networking organisation; it does not guarantee referrals, clients, contracts, revenue, or business outcomes; and every member or participant remains independently responsible for maintaining all required licences, legal permissions, taxes, professional obligations, contracts, and compliance with applicable laws.</p></div>
      </footer>
    </>
  );
}

createRoot(document.getElementById("root")).render(<App />);
