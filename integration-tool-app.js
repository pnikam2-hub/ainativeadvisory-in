/* ============================================================================
 * Agentic PMO — Integration Layer Client Onboarding (interactive form)
 *
 * DESIGN: a single source of truth — SECTIONS below — drives both the rendered
 * form and the Markdown export, so the two can never drift. Answers live only in
 * the browser (localStorage) until the client exports; nothing is transmitted.
 *
 * This mirrors the Connected Factory Readiness tool's pattern (static site +
 * app.js) but swaps the deterministic assessment engine for a fillable form with
 * autosave + export, which is what an onboarding questionnaire actually needs.
 * ========================================================================== */

const STORAGE_KEY = "agentic_pmo_onboarding_v1";

/* ----------------------------------------------------------------------------
 * Questionnaire model — one place to edit. Mirrors the .md template exactly.
 *   type:  text | email | date | textarea | choice | yesno | yesnosure
 *   options (choice only), why (optional "why we ask" note)
 * ------------------------------------------------------------------------- */
const SECTIONS = [
  {
    title: "About You",
    note: "Who we're building this for. Fill what you can.",
    questions: [
      { id: "org",      type: "text",  label: "Client / organisation" },
      { id: "contact",  type: "text",  label: "Primary contact (name, role)" },
      { id: "email",    type: "email", label: "Email / phone" },
      { id: "project",  type: "text",  label: "Target project(s) or portfolio" },
      { id: "date",     type: "date",  label: "Date completed" },
      { id: "by",       type: "text",  label: "Completed by (name, role)" },
    ],
  },
  {
    num: "1", title: "Your PMO / Scheduling Tool Stack",
    questions: [
      { id: "tool",    n: 1, type: "choice", label: "Which tool is your schedule of record?",
        options: ["Primavera P6", "MS Project", "MS Planner", "Jira", "Other"] },
      { id: "version", n: 2, type: "text", label: "Version & deployment?",
        hint: "e.g., Primavera Cloud v4+, Primavera P6 EPPM on-premises, MS Project Online 2019/2021, Project for the Web" },
      { id: "api",     n: 3, type: "textarea", label: "Is REST API access available?",
        hint: "If on-premises, is there an API gateway, or is it cloud-hosted?" },
      { id: "auth",    n: 4, type: "text", label: "Authentication method, and who manages the credentials?",
        hint: "OAuth 2.0 client credentials, API token, Entra ID app registration, basic auth?" },
      { id: "erp",     n: 5, type: "text", label: "Do you also use a separate cost/ERP or resource system you'd eventually want synced?",
        hint: "Scope-defining — even if the answer is 'later, not now'." },
    ],
  },
  {
    num: "2", title: "Scope",
    questions: [
      { id: "which",   n: 6, type: "text", label: "Which projects should be synced?",
        hint: "All active projects, a specific portfolio, or one pilot project first?" },
      { id: "volume",  n: 7, type: "text", label: "Roughly how many projects, and how many tasks per project?",
        hint: "e.g., 3 projects × ~800 tasks; or one mega-project with 5000+ tasks",
        why: "This drives pagination and the sync interval." },
      { id: "fields",  n: 8, type: "textarea", label: "Which fields should be synced?",
        hint: "Task name, status, dates, assignee, estimated hours, actual hours, custom fields?" },
      { id: "ms",      n: 9, type: "yesnosure", label: "Do you use Primavera/MS Project milestones, and want them tracked in Agentic PMO?",
        hint: "Agentic PMO has no native milestone type — we model milestones as special tasks. We just need to know whether to carry them over." },
      { id: "dir",     n: 10, type: "choice", label: "Sync direction?",
        options: ["One-way (tool → Agentic PMO)", "Bidirectional"] },
      { id: "conflict",n: 11, type: "choice", label: "Conflict policy: when the same field is edited in both systems, who wins?",
        options: ["Scheduling tool authoritative", "Agentic PMO authoritative", "Flag for manual review"] },
    ],
  },
  {
    num: "3", title: "Custom Fields",
    note: "The #1 driver of build effort. Thorough answers here save the most time downstream.",
    questions: [
      { id: "cf_list", n: 12, type: "textarea", label: "List all custom fields / UDFs used on the target projects.",
        why: "Custom fields are the main reason a generic connector won't work and the biggest variable in build time." },
      { id: "cf_detail", n: 13, type: "textarea", label: "For each custom field: name, data type, which team uses it, and what it tracks.",
        hint: "Example: UDF_Discipline_Code — text — used by Process Engineering to tag tasks." },
    ],
  },
  {
    num: "4", title: "Schedule & Cadence",
    questions: [
      { id: "cadence", n: 14, type: "choice", label: "Acceptable sync cadence?",
        options: ["Every 15 min", "Every 30 min", "Every 1 hour", "Daily"] },
      { id: "blackout",n: 15, type: "textarea", label: "Blackout windows?",
        hint: "Month-end close, system maintenance, shift changes — times the sync should pause." },
      { id: "newold",  n: 16, type: "text", label: "New project starting fresh in Agentic PMO, or existing data in both systems to reconcile?" },
    ],
  },
  {
    num: "5", title: "Infrastructure & Network",
    questions: [
      { id: "runwhere",n: 17, type: "text", label: "Where should the sync engine run?",
        hint: "Same server as Agentic PMO, your infrastructure, or cloud?" },
      { id: "proxy",   n: 18, type: "textarea", label: "Does the sync engine need to traverse a corporate proxy, VPN, or firewall to reach your APIs?" },
      { id: "staging", n: 19, type: "text", label: "Is there a test/staging environment for your scheduling tool we can integration-test against?" },
    ],
  },
  {
    num: "6", title: "Notifications & Alerts",
    questions: [
      { id: "alertdest", n: 20, type: "text", label: "Where should sync-failure alerts be sent?",
        hint: "Email, Slack, MS Teams, PagerDuty?" },
      { id: "summary", n: 21, type: "yesno", label: "Want a daily sync summary of what changed?" },
    ],
  },
  {
    num: "7", title: "Document / CDE Integration",
    note: "Optional — skip if not applicable.",
    questions: [
      { id: "cde",   n: 22, type: "yesno", label: "Do you use a Common Data Environment (CDE)?",
        hint: "Autodesk Construction Cloud, Aconex, Procore, SharePoint, other?" },
      { id: "docms", n: 23, type: "textarea", label: "Which document milestones should Agentic PMO monitor?",
        hint: "Permit submissions, drawing approvals, commissioning document sign-offs?" },
      { id: "cdeapi",n: 24, type: "yesnosure", label: "Does the CDE have API access, and is it enabled?" },
    ],
  },
];

/* ----------------------------------------------------------------------------
 * Rendering
 * ------------------------------------------------------------------------- */
const $ = (id) => document.getElementById(id);
const ALL_Q = SECTIONS.flatMap((s) => s.questions);

function controlHTML(q) {
  const ph = q.hint && (q.type === "textarea" || q.type === "text" || q.type === "email")
    ? ` placeholder="${escAttr(q.hint)}"` : "";
  switch (q.type) {
    case "textarea":
      return `<textarea id="${q.id}" name="${q.id}" rows="3"${ph}></textarea>`;
    case "text": case "email": case "date":
      return `<input id="${q.id}" name="${q.id}" type="${q.type}"${ph} />`;
    case "choice": case "yesno": case "yesnosure": {
      const opts = q.options || (q.type === "yesno" ? ["Yes", "No"] : ["Yes", "No", "Not sure"]);
      return `<div class="choices" data-q="${q.id}">` + opts.map((o, i) => `
        <input type="radio" name="${q.id}" id="${q.id}_${i}" value="${escAttr(o)}" />
        <label class="choice" for="${q.id}_${i}">${o}</label>`).join("") + `</div>`;
    }
    default:
      return "";
  }
}

function questionHTML(q) {
  const num = q.n != null ? `<span class="q-num">${q.n}.</span>` : "";
  const hint = q.hint ? `<p class="q-hint">${q.hint}</p>` : "";
  const why = q.why ? `<p class="q-why">${q.why}</p>` : "";
  return `<div class="q" data-q="${q.id}">
    <label class="q-label" for="${q.id}_0">${num}${q.label}</label>
    ${q.type === "choice" || q.type === "yesno" || q.type === "yesnosure" ? "" : hint}
    ${controlHTML(q)}
    ${(q.type === "choice" || q.type === "yesno" || q.type === "yesnosure") ? hint : ""}
    ${why}
  </div>`;
}

function renderForm() {
  $("app").innerHTML = SECTIONS.map((s) => {
    const num = s.num ? `<span class="section-num">§${s.num}</span>` : `<span class="section-num">·</span>`;
    const note = s.note ? `<p class="section-note">${s.note}</p>` : "";
    return `<section class="section">
      <div class="section-head">${num}<h2>${s.title}</h2></div>
      ${note}
      <div class="card accent">${s.questions.map(questionHTML).join("")}</div>
    </section>`;
  }).join("");
}

/* ----------------------------------------------------------------------------
 * Values, progress, autosave
 * ------------------------------------------------------------------------- */
function getValue(q) {
  if (q.type === "choice" || q.type === "yesno" || q.type === "yesnosure") {
    const checked = document.querySelector(`input[name="${q.id}"]:checked`);
    return checked ? checked.value : "";
  }
  const el = $(q.id);
  return el ? el.value.trim() : "";
}

function allAnswers() {
  const o = {};
  ALL_Q.forEach((q) => { o[q.id] = getValue(q); });
  return o;
}

let saveTimer = null;
function updateProgressAndSave() {
  // progress
  const answered = ALL_Q.filter((q) => getValue(q) !== "").length;
  const pct = Math.round((answered / ALL_Q.length) * 100);
  $("progress-fill").style.width = pct + "%";
  $("progress-label").textContent = `${answered} of ${ALL_Q.length} answered`;

  // autosave (debounced)
  const state = $("save-state");
  state.textContent = "Saving…";
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(allAnswers())); } catch (e) { /* quota/private mode */ }
    state.textContent = "Saved · in this browser";
  }, 400);
}

function restore() {
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch (e) { saved = {}; }
  ALL_Q.forEach((q) => {
    const v = saved[q.id];
    if (!v) return;
    if (q.type === "choice" || q.type === "yesno" || q.type === "yesnosure") {
      const radio = document.querySelector(`input[name="${q.id}"][value="${cssEscape(v)}"]`);
      if (radio) radio.checked = true;
    } else {
      const el = $(q.id);
      if (el) el.value = v;
    }
  });
}

/* ----------------------------------------------------------------------------
 * Markdown export — reconstructed from the same SECTIONS model
 * ------------------------------------------------------------------------- */
function buildMarkdown() {
  const a = allAnswers();
  const line = (q) => {
    const v = a[q.id] && a[q.id].length ? a[q.id] : "_(not answered)_";
    return `**${q.n != null ? q.n + ". " : ""}${q.label}**\n${v}\n`;
  };
  let md = `# Agentic PMO — Integration Layer Client Onboarding\n\n> Exported from the onboarding tool · AI Native Organisations · ${today()}\n\n`;
  SECTIONS.forEach((s) => {
    md += `\n## ${s.num ? s.num + ". " : ""}${s.title}\n\n`;
    s.questions.forEach((q) => { md += line(q) + "\n"; });
  });
  return md;
}

function downloadMarkdown() {
  const md = buildMarkdown();
  const a = allAnswers();
  const slug = (a.org || "client").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "client";
  const blob = new Blob([md], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `Agentic_PMO_Onboarding_${slug}.md`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function copyMarkdown() {
  const md = buildMarkdown();
  try {
    await navigator.clipboard.writeText(md);
    toast("Markdown copied to clipboard");
  } catch (e) {
    // fallback
    const ta = document.createElement("textarea");
    ta.value = md; document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); toast("Markdown copied"); }
    catch (e2) { toast("Copy failed — use Download instead"); }
    ta.remove();
  }
}

/* ----------------------------------------------------------------------------
 * Tiny helpers
 * ------------------------------------------------------------------------- */
function escAttr(s) { return String(s).replace(/"/g, "&quot;"); }
function cssEscape(s) { return String(s).replace(/"/g, '\\"'); }
function today() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}
let toastTimer = null;
function toast(msg) {
  let t = $("toast");
  if (!t) { t = document.createElement("div"); t.id = "toast"; t.className = "toast"; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 1800);
}

/* ----------------------------------------------------------------------------
 * Wire up
 * ------------------------------------------------------------------------- */
renderForm();
restore();
updateProgressAndSave();

$("app").addEventListener("input", updateProgressAndSave);
$("app").addEventListener("change", updateProgressAndSave);

$("copy").addEventListener("click", copyMarkdown);
$("download").addEventListener("click", downloadMarkdown);
$("print").addEventListener("click", () => window.print());
$("clear").addEventListener("click", () => {
  if (confirm("Clear all answers? This wipes the saved responses from this browser.")) {
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  }
});
