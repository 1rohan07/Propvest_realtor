# PropVest — New Gurgaon Real Estate Investment Platform

## Project Overview
Single-page website for a data-first real estate brokerage focused exclusively on
investor buyers in New Gurgaon's emerging sectors. No home buyers. No broad Gurgaon
coverage. One niche, one geography, one buyer type.

## Brand Identity
- Name: PropVest
- Instagram: @PropVest_Realtor
- Tagline: "New Gurgaon Investment Intelligence"
- Subline: "Data-first. Investor-only. Emerging sectors."
- Primary color: #0D1B2A (dark navy)
- Accent color: #C9A84C (gold)
- Body text: #FFFFFF (white)
- Muted text: #AAAAAA (grey)
- Background: #0D1B2A
- Card background: #1A2B3C
- Font: Inter or Montserrat (Google Fonts, free)
- Tone: Professional, data-driven, no hype. Like a Bloomberg terminal for real estate.

## Tech Stack
- Single HTML file with embedded CSS and JS
- No frameworks, no external dependencies except Google Fonts
- Mobile responsive (works perfectly on phone)
- No backend needed — forms show success message on submit
- Fast loading, minimal, clean

## Website Structure (single page, scroll-based)

### Section 1 — Hero
- Dark navy full-screen hero
- Headline: "New Gurgaon Investment Intelligence"
- Subline: "Data-first. Investor-only. Emerging sectors."
- CTA button: "View Investment Data" (scrolls to price tracker)
- Small text below: "Tracking New Gurgaon's emerging sectors — weekly"

### Section 2 — Price Tracker Table
- Section heading: "New Gurgaon Sector Watch"
- Subheading: "Last updated: May 2026"
- Clean dark table with gold header row
- Columns: Sector | Corridor | Price/sqft | 3yr Appreciation | Rental Yield | Risk Level
- Data rows:

| Sector | Corridor | Price/sqft | 3yr Appreciation | Rental Yield | Risk |
|--------|----------|------------|-----------------|--------------|------|
| Sector 84 | Dwarka Expressway | Rs.12,000 | 18% | 3.5% | Medium |
| Sector 113 | Dwarka Expressway | Rs.8,500 | 22% | 4.0% | Medium-High |
| Sector 71 | SPR Corridor | Rs.17,000 | 13% | 4.2% | Low-Medium |
| Sector 93-95 | New Gurgaon | Rs.5,500 | 16% | 3.8% | Medium |
| Manesar GIC | KMP Expressway | Rs.10,000 | 20% | 4.5% | Medium |

- Small disclaimer below table: "Data sourced from market reports and transaction data.
  Updated monthly. Not financial advice."

### Section 3 — Investor Lead Form
- Section heading: "Get Curated Investment Options"
- Subheading: "Tell us your goal. We'll show you the top 3 projects that match."
- Form fields:
  - Full Name (text input, required)
  - Phone Number (tel input, required)
  - Investment Budget (dropdown, required):
    - Under Rs.50 Lakh
    - Rs.50L - Rs.1 Crore
    - Rs.1 Crore - Rs.3 Crore
    - Above Rs.3 Crore
  - Investment Timeline (dropdown, required):
    - 1 Year
    - 3 Years
    - 5+ Years
  - Primary Goal (dropdown, required):
    - Capital Appreciation
    - Rental Yield
    - Both
  - Submit button: "Get My Top 3 Projects" (gold button)
- On submit: show success message "We'll reach out within 24 hours with your
  curated project list."
- Store form data in localStorage as JSON for now

### Section 4 — Builder / Developer Form
- Section heading: "Are You a Developer or Builder?"
- Subheading: "List your project for free. Reach qualified investors actively
  looking in New Gurgaon."
- Form fields:
  - Company Name (text input, required)
  - Contact Person Name (text input, required)
  - Phone Number (tel input, required)
  - Project Name (text input, required)
  - Sector / Location (text input, required)
  - Submit button: "List My Project" (gold outline button)
- On submit: show success message "Thank you. We'll review your project and
  reach out within 48 hours."
- Store form data in localStorage as JSON

### Section 5 — Footer
- Dark navy background
- Left: PropVest logo text + tagline
- Center: "Tracking New Gurgaon's emerging sectors weekly"
- Right: Instagram link @PropVest_Realtor
- Bottom: "Data for informational purposes only. Not financial advice. All
  investments carry risk."

## Design Details
- All section headings: white, bold, large
- All subheadings: gold (#C9A84C), medium weight
- Cards/containers: slightly lighter navy (#1A2B3C) with subtle gold border
- Buttons: gold background (#C9A84C) with dark navy text, rounded corners
- Table: dark background, gold header, alternating row colors
- Hover effects on buttons and table rows
- Smooth scroll between sections
- Mobile: stack all columns, full-width forms, readable font sizes

## Form Behavior
- Validate all required fields before submit
- Show inline error messages in red if fields are empty
- On successful submit: hide form, show success message in gold
- Save to localStorage with timestamp

## What NOT to include
- No images or photos (keep it data/text only for now)
- No pricing or "call now" pushy CTAs
- No testimonials (no social proof yet)
- No chatbot or popups
- No animations that slow loading

## File Output
- Single file: index.html
- All CSS inside <style> tags in <head>
- All JS inside <script> tags before </body>
- No separate files needed
