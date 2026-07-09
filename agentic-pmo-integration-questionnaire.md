# Agentic PMO — Integration Layer Client Onboarding Questionnaire

> **Purpose:** This questionnaire gathers what we need to design and build the custom sync connector between your scheduling tool (Primavera P6 / MS Project) and Agentic PMO. Your answers scope the work, drive the field mappings, and set the sync cadence. It is also *why this connector is custom-built* — your custom fields and workflow are unique, so a generic off-the-shelf connector won't fit.
>
> **Time to complete:** ~30–45 minutes. Some questions are best answered by your PMO/scheduling lead and your IT/API owner together.
>
> **Confidentiality:** Responses are used only to scope and build your integration. API credentials, when shared later, are stored in environment variables — never hardcoded in source.

---

## About You

- **Client / organisation:**
- **Primary contact (name, role):**
- **Email / phone:**
- **Target project(s) or portfolio:**
- **Date completed:**
- **Completed by (name, role):**

---

## 1. Your PMO / Scheduling Tool Stack

1. **Which tool is your schedule of record?** (Primavera P6, MS Project, MS Planner, Jira, other?)

2. **Version & deployment?** (e.g., Primavera Cloud v4+, Primavera P6 EPPM on-premises, MS Project Online 2019/2021, Project for the Web)

3. **Is REST API access available?** If on-premises, is there an API gateway, or is it cloud-hosted?

4. **Authentication method, and who manages the credentials?** (OAuth 2.0 client credentials, API token, Entra ID app registration, basic auth?)

5. **Do you also use a separate cost/ERP or resource system** that you'd eventually want synced? (Scope-defining — even if the answer is "later, not now")

---

## 2. Scope

6. **Which projects should be synced?** (all active projects, a specific portfolio, or one pilot project first?)

7. **Roughly how many projects, and how many tasks per project?** (e.g., 3 projects × ~800 tasks; or one mega-project with 5000+ tasks). *This drives pagination and the sync interval.*

8. **Which fields should be synced?** (task name, status, dates, assignee, estimated hours, actual hours, custom fields?)

9. **Milestones:** Do you use Primavera/MS Project milestones (start/finish milestones, zero-duration markers), and do you want them tracked in Agentic PMO? *(Agentic PMO has no native milestone type — we model milestones as special tasks. We just need to know whether you want them carried over.)*

10. **Sync direction?** (one-way: scheduling tool → Agentic PMO only; or bidirectional?)

11. **Conflict policy:** when the same field is edited in both systems, who wins? (scheduling tool authoritative; Agentic PMO authoritative; flag for manual review)

---

## 3. Custom Fields  *(the #1 driver of build effort)*

12. **List all custom fields / UDFs** used on the target projects.

13. **For each custom field:** name, data type, which discipline/team uses it, and what it tracks.
    - *Example:* `UDF_Discipline_Code` — text — used by Process Engineering to tag tasks.

> **Why we ask:** custom fields are the main reason a generic connector won't work and the biggest variable in build time. Thorough answers here save the most effort downstream.

---

## 4. Schedule & Cadence

14. **Acceptable sync cadence?** (every 15 min, 30 min, 1 hour, daily?)

15. **Blackout windows?** (month-end close, system maintenance, shift changes — times the sync should pause)

16. **Is this a new project** starting fresh in Agentic PMO, or do you have existing data in both systems that needs reconciling on first sync?

---

## 5. Infrastructure & Network

17. **Where should the sync engine run?** (same server as Agentic PMO, your infrastructure, or cloud?)

18. **Does the sync engine need to traverse a corporate proxy, VPN, or firewall** to reach your Primavera/MS Project/CDE APIs?

19. **Is there a test/staging environment** for your scheduling tool that we can integration-test against?

---

## 6. Notifications & Alerts

20. **Where should sync-failure alerts be sent?** (email, Slack, MS Teams, PagerDuty?)

21. **Want a daily sync summary** of what changed? (yes/no — and to whom)

---

## 7. Document / CDE Integration *(optional)*

22. **Do you use a Common Data Environment (CDE)?** (Autodesk Construction Cloud, Aconex, Procore, SharePoint, other?)

23. **Which document milestones** should Agentic PMO monitor? (permit submissions, drawing approvals, commissioning document sign-offs?)

24. **Does the CDE have API access, and is it enabled?**

---

## What Happens Next

1. We review your answers and confirm **scope, custom-field mappings, and sync direction**.
2. We validate API access with a test call to your tool — *Phase 1: Discovery*.
3. We build and test the connector against sample data from your instance — *Phase 2: Build*.
4. We deploy, run an initial full sync, and monitor for 48 hours — *Phase 3: Deploy*.
5. We hand over the source code and documentation — *Phase 4: Handover*.

> **Estimated build effort: 8–12 days** after this questionnaire is complete and API access is confirmed. The integration-layer code is owned by you.

---

*Agentic PMO by AI Native Organisations — Integration Layer onboarding, v1.0.*
