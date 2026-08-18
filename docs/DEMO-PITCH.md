# CivicLens — Demo Pitch & Presenter Script

> Your cheat sheet for presenting. Say the **bold lines** out loud; the italics are stage directions / what to click. Lead with outcomes, sprinkle the vocabulary in the [Buzzword bank](#buzzword-bank), and never say "it's just an LLM call."

---

## 0. The 20-second hook (say this first)

> **"Every Indian city runs on complaints it can't read. They come in Tamil, Hindi, English, as voice notes, as blurry WhatsApp photos of the same pothole — and a human has to sort every one by hand. CivicLens is an AI grievance-intelligence layer for Greater Chennai Corporation: one message in, and out comes a translated, sentiment-scored, department-routed ticket with an SLA clock — before a clerk has even opened the inbox."**

*(Then move the spotlight across the hero map.)* **"The whole city, from night into day — every grievance surfacing ward by ward."**

---

## 1. The problem (10 seconds)

> **"Municipal desks drown in unstructured, multilingual complaints, and roughly half land on the wrong department. Manual triage is slow, monolingual, and blind to duplicates — fifty people report one pothole and it becomes fifty tickets nobody connects."**

---

## 2. The solution in one line

> **"A single AI pass does language detection, translation, sentiment analysis, multi-class department classification, severity and urgency scoring, computer-vision on photos, geospatial ward routing, and semantic de-duplication — then a human officer stays in the loop to confirm or override before anything ships."**

That sentence is the whole pitch. Everything below is you *proving* it live.

---

## 3. Live demo walkthrough

Three roles, three logins (all password `demo123`): **Citizen**, **Officer**, **Supervisor**.

### A. The citizen portal — *"intake"*
*Log in as Citizen (Meena).* You land on **File a grievance** — full-page, deliberately simple.

- **Say:** *"A citizen just types in plain language — any language. Watch."* Click the **Tamil** or **Hindi** example, hit **Submit**.
- **Say while it thinks:** *"That one call is running the NLP pipeline — detecting the language, translating to English, analysing sentiment, classifying the department, scoring severity, and checking it against open tickets for duplicates."*
- **When the confirmation lands:** *"Filed, classified, routed — with a plain-English reason an officer can audit, and a confidence score. Ninety-plus percent confidence here."* Point at the **reasoning** + **confidence** on the card.
- **Show the channels:** *"Same pipeline, four ways in — typed text, **voice** (speech-to-text in the browser), a **photo** where computer vision reads the scene, and **WhatsApp**."* Tap the Voice / Photo buttons to show they're real.
- **Switch to the "My activity" tab:** *"The citizen tracks everything here — live status, the evidence photo, officer updates as notifications, and 'Me Too' to pile onto a neighbour's issue. That's the de-duplication working as civic pressure: one pothole, one master ticket, a rising count of affected citizens."*
- **Whistleblower angle:** *"Corruption reports can be filed anonymously — identity stripped, tracked by token only."*

### B. The officer console — *"triage & close the loop"*
*Log in as Officer (R. Sharma).* You open on **your queue**.

- **Say:** *"Officers get a filtered queue of only what's routed to them, sorted by urgency and SLA. Every card shows the AI's call, the confidence, and a live SLA countdown that turns red on breach."*
- **Open a ticket → the drawer:** *"Here's the human-in-the-loop. The AI proposes; the officer disposes. If confidence is low it lands in review first. The officer can override the department, priority, or category in one click — and that correction is exactly the feedback signal you'd use to fine-tune routing over time."*
- **Move the status:** *"Assign it, mark it in progress, resolve it with a before/after photo."* **Key line:** *"The moment I change status here, the citizen sees it on their side — same shared datastore, near real-time."*
- **The WhatsApp button (show this — it's a crowd-pleaser):** *"People also file over WhatsApp. One click — 'Fetch WhatsApp grievances' — pulls those messages in, runs them through the same OpenAI classification, and drops them straight into the queue."* Click it; watch it import and auto-jump to the all-city view.

### C. The supervisor command view — *"the city at a glance"*
*Log in as Supervisor (Anand Rao).* You land on the city overview.

- **Say:** *"The supervisor runs the whole city. KPIs up top — open load, urgent count, SLA breaches, and the AI's average confidence, so they can watch the model's health, not just the tickets."*
- **The live incident map:** *"Every complaint geolocated by ward. Click a hotspot — the ticket drawer opens right over the map."* *(Click a dot.)*
- **Analytics:** *"Department load, priority mix, channel split, a seven-day intake-vs-resolved trend, and an officer scorecard. And the cluster view — the issues affecting the most people, ranked, so leadership fixes what actually moves the needle."*

---

## 4. The architecture (say this if a judge asks "is this real?")

> **"Fully deployed, not a mockup. A Next.js front end on Vercel does the AI inference where the model is reachable; a Node backend on our own Azure VM persists everything to SQLite; WhatsApp intake runs through Twilio. The classification is a real GPT call with a strict JSON schema and a keyword-based fallback classifier, so intake never goes down even if the AI does."**

One honest, confidence-building detail to drop: *"When OpenAI's region blocked our server, we moved inference to the edge and kept storage on the VM — so it degrades gracefully instead of breaking."*

---

## 5. Buzzword bank

Drop these naturally — each maps to something the product genuinely does:

| Say this | It actually means |
|---|---|
| Natural-language processing (NLP) pipeline | the model reads free-text complaints |
| Sentiment / distress analysis | it tags tone: distress, anger, neutral, hopeful |
| Multi-class classification | picks 1 of 7 departments |
| Named-entity / location extraction | pulls the landmark + ward from the text |
| Computer vision intake | classifies from an attached photo |
| Geospatial routing | GPS/ward → the right desk |
| Semantic de-duplication / clustering | merges reports of the same issue |
| Severity & urgency scoring | 1–10 severity, priority, emergency flag |
| SLA orchestration | per-priority clocks + breach prediction |
| Human-in-the-loop (HITL) | officer confirms/overrides low-confidence calls |
| Confidence-gated automation | <70% confidence routes to human review |
| Graceful degradation / fallback classifier | heuristic keeps intake alive if the AI fails |
| Omnichannel intake | text, voice, photo, WhatsApp → one pipeline |
| Closed-loop feedback | citizen ratings + officer overrides train routing |

---

## 6. Anticipated questions (and confident answers)

- **"Is the AI actually classifying or is it hardcoded?"** → *"Real GPT calls with a JSON-schema'd prompt — file anything you want, in any language, live."* *(Then let them type something.)*
- **"What if the AI is wrong?"** → *"Confidence-gated. Below 70% it goes to human review, and officers can override any field — that's the human-in-the-loop by design."*
- **"How does it scale to 200 wards?"** → *"The routing is data-driven — add wards and departments in config; the classifier already generalises from the prompt."*
- **"What about duplicates flooding the system?"** → *"Semantic clustering. Fifty reports of one pothole become one master ticket with an impact count — which also tells leadership what's most urgent."*
- **"Privacy?"** → *"Anonymous whistleblower filing with PII stripped; no data leaves the deployment in the demo."*
- **"Why not the existing government portal?"** → *"Those are monolingual web forms with manual routing. We're multilingual, multimodal, auto-routing, and de-duplicating — minutes to set up, not a vendor lock-in."*

---

## 7. One-line closer

> **"CivicLens turns the noisiest thing in local government — a flood of messy, multilingual complaints — into a clean, ranked, accountable work queue. The city finally sees itself in a new light."**
