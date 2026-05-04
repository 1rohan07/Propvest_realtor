# PropVest Website Update — Data-First Investment Intelligence Platform

Update the existing single-page HTML website.

Do NOT change layout, colors, typography, or structure. Only update content and form logic.

---

## 1. HERO SECTION

Keep headline:
"New Gurgaon Investment Intelligence"

Keep subline:
"Data-first. Investor-only. Emerging sectors."

CTA Button:
"Get Early Access"

Remove all brokerage / selling language.

---

## 2. PRICE TRACKER SECTION

Keep existing table UI.

Modify:
- Show price ranges instead of exact values
  Example: ₹11,500–12,500

Add line below:
"Full dataset unlocks on launch"

---

## 3. ADD SECTION — THIS WEEK’S INSIGHTS

Add 3 short insights:

- "Sector 113 increased ~₹800/sqft due to Dwarka Expressway progress"
- "SPR corridor showing stronger rental stability vs appreciation-led sectors"
- "Manesar GIC behaving like early-stage Dwarka Expressway (high risk, high upside)"

Keep text minimal and sharp.

---

## 4. INVESTOR FORM (WAITLIST)

Replace any existing investor form with:

Heading:
"Get Early Access to Investment Insights"

Fields:
- Name (required)
- Phone (required)

Add field:
Investment Budget (dropdown)
Options:
- ₹50L – ₹1.5Cr
- ₹1.5Cr – ₹3Cr
- ₹3Cr – ₹5Cr
- ₹5Cr+

Add field:
Source (dropdown)
Options:
- Instagram
- AI
- Reddit
- LinkedIn
- YouTube
- Other

Button:
"Get Early Access"

Success message:
"You're on the early access list. We'll notify you when the dataset goes live."

---

## 5. LAUNCH CONTEXT (IMPORTANT)

Add section below form:

"🚀 Full Investment Insights Launching on 1st June

We’re currently building a sector-level intelligence layer for New Gurgaon.

All submissions are being onboarded for early access.

You’ll receive:
• First access to sector-wise insights  
• Market signals based on your investment profile  
• Select opportunities aligned with timing  

Early access to investment insights begins 1st June."

Add small line below button:
"Early access batch closes soon — access begins 1st June"

---

## 6. INVESTOR FORM SUBMISSION LOGIC

Remove any localStorage usage.

Send POST request to:
INVESTOR_WEBHOOK_URL

Use:

fetch(INVESTOR_WEBHOOK_URL, {
  method: "POST",
  mode: "no-cors",
  body: JSON.stringify({
    name: name,
    phone: phone,
    budget: budget,
    source: source
  })
})

---

## 7. BUILDER SECTION

Heading:
"Access Qualified Investor Demand"

Subtext:
"List your project to reach investors actively tracking New Gurgaon sectors"

---

## 8. BUILDER FORM

Fields:
- Company Name
- Contact Person
- Phone
- Project Name
- Location

Form ID:
builderForm

---

## 9. BUILDER FORM SUBMISSION

Send POST request to:
BUILDER_WEBHOOK_URL

Use:

fetch(BUILDER_WEBHOOK_URL, {
  method: "POST",
  mode: "no-cors",
  body: JSON.stringify({
    company: company,
    contact: contact,
    phone: phone,
    project: project,
    location: location
  })
})

Success message:
"Project submitted. We'll review and connect with relevant investor demand."

---

## 10. REMOVE BROKERAGE LANGUAGE

Remove:
- "We will contact you"
- "Top 3 projects"
- "Best investment options"

Keep positioning:
Data → Insights → Decision

---

## 11. DISCLAIMER

Add below table or footer:

"Data based on market observations, listings, and reported transactions. For informational purposes only."

---

## 12. DESIGN RULES

- Dark, minimal, Bloomberg-style UI
- No images
- No animations
- Clean spacing
- Mobile responsive

---

## OUTPUT

Return FULL updated HTML file.
