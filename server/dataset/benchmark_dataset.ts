/**
 * PS-03 Ad-to-Landing-Page Benchmark Dataset
 * 60 Search Ads paired with 15 Brand Landing Pages
 */

export interface BenchmarkAdPair {
  pairId: string;
  advertiser: string;
  vertical: 'financial services' | 'SaaS' | 'consumer e-commerce';
  headline_1: string;
  headline_2: string;
  headline_3: string;
  description_1: string;
  description_2: string;
  finalUrl: string;
  snapshotFile: string;
  landingPageHtml: string;
}

// Brand Landing Page HTML Snapshots from the PS-03 Dataset
export const BRAND_PAGES: Record<string, string> = {
  kestrel: `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Kestrel Business Funding — Small Business Loans</title>
<style>body{margin:0;font-family:Helvetica,Arial,sans-serif;color:#1f2933;line-height:1.55}.hero{padding:60px 48px;background:#0B4F6C;color:#fff}.hero h1{font-size:38px;margin:0 0 14px}.btn{background:#fff;color:#111;padding:12px 24px;border-radius:6px;font-weight:700;text-decoration:none;display:inline-block}</style></head>
<body><header><h2>Kestrel Business Funding</h2></header>
<div class="hero"><h1>Rates from 6.9% APR for qualified borrowers.</h1><p>We consider all credit profiles, including scores below 600. Most of our loans require no collateral.</p><a class="btn" href="#">Apply Now</a></div>
<section><h2>Why Kestrel</h2><p>Most applicants get a decision the same business day.</p><p>Our online application takes about 10 minutes. Borrow from $10,000 up to $500,000.</p></section>
<footer>© 2026 Kestrel Business Funding. All rights reserved.</footer></body></html>`,

  harborline: `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Harborline Equipment Finance — Equipment Financing</title>
<style>body{margin:0;font-family:Helvetica,Arial,sans-serif;color:#1f2933}.hero{padding:60px 48px;background:#1D3557;color:#fff}.hero h1{font-size:38px}.btn{background:#fff;color:#111;padding:12px 24px;border-radius:6px;font-weight:700;display:inline-block}</style></head>
<body><header><h2>Harborline Equipment Finance</h2></header>
<div class="hero"><h1>There is no penalty for paying off your loan early.</h1><p>Startups and businesses under 2 years are welcome to apply. Receive a credit decision within 24 hours.</p><a class="btn" href="#">Get My Quote</a></div>
<section><h2>Why Harborline</h2><p>Finance up to 100% of the equipment price. We finance both new and used equipment.</p><p>Repayment terms from 2 to 7 years.</p></section>
<footer>© 2026 Harborline Equipment Finance. All rights reserved.</footer></body></html>`,

  cobalt: `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Cobalt Line of Credit — Business Lines Of Credit</title>
<style>body{margin:0;font-family:Helvetica,Arial,sans-serif;color:#1f2933}.hero{padding:60px 48px;background:#2A3D8F;color:#fff}.hero h1{font-size:38px}.btn{background:#fff;color:#111;padding:12px 24px;border-radius:6px;font-weight:700;display:inline-block}</style></head>
<body><header><h2>Cobalt Line of Credit</h2></header>
<div class="hero"><h1>There is no annual fee.</h1><p>Credit lines from $5,000 to $250,000. Checking your rate uses a soft pull and will not affect your credit score.</p><a class="btn" href="#">Check My Rate</a></div>
<section><h2>Why Cobalt</h2><p>Draw funds to your bank account instantly, 24/7. You only pay interest on the amount you draw.</p><p>Approval subject to underwriting. No guaranteed approval.</p></section>
<footer>© 2026 Cobalt Line of Credit. All rights reserved.</footer></body></html>`,

  meridian: `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Meridian Merchant Capital — Merchant Cash Advances</title>
<style>body{margin:0;font-family:Helvetica,Arial,sans-serif;color:#1f2933}.hero{padding:60px 48px;background:#5C2A9D;color:#fff}.hero h1{font-size:38px}.btn{background:#fff;color:#111;padding:12px 24px;border-radius:6px;font-weight:700;display:inline-block}</style></head>
<body><header><h2>Meridian Merchant Capital</h2></header>
<div class="hero"><h1>Receive funds within 24 hours of approval.</h1><p>There is no minimum credit score requirement. Repay automatically as a small share of daily card sales.</p><a class="btn" href="#">Get Funded</a></div>
<section><h2>Why Meridian</h2><p>Advances from $5,000 up to $300,000. Businesses with 3 or more months of sales history qualify.</p></section>
<footer>© 2026 Meridian Merchant Capital. All rights reserved.</footer></body></html>`,

  pinecrest: `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Pinecrest SBA Lending — Sba 7(A) Loans</title>
<style>body{margin:0;font-family:Helvetica,Arial,sans-serif;color:#1f2933}.hero{padding:60px 48px;background:#2E6B3F;color:#fff}.hero h1{font-size:38px}.btn{background:#fff;color:#111;padding:12px 24px;border-radius:6px;font-weight:700;display:inline-block}</style></head>
<body><header><h2>Pinecrest SBA Lending</h2></header>
<div class="hero"><h1>Down payments as low as 10%.</h1><p>Close in as little as 30 days. We are an SBA Preferred Lender.</p><a class="btn" href="#">Start Application</a><div class="badges"><span>✓ SBA 7(a) loans up to $5 million</span></div></div>
<section><h2>Why Pinecrest</h2><p>Pre-qualify for free in about 5 minutes.</p><p>Terms up to 25 years for real estate and 10 years for working capital.</p></section>
<footer>© 2026 Pinecrest SBA Lending. All rights reserved.</footer></body></html>`,

  quillstack: `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Quillstack — Invoicing Software</title>
<style>body{margin:0;font-family:Helvetica,Arial,sans-serif;color:#1f2933}.hero{padding:60px 48px;background:#3B5BDB;color:#fff}.hero h1{font-size:38px}.btn{background:#fff;color:#111;padding:12px 24px;border-radius:6px;font-weight:700;display:inline-block}</style></head>
<body><header><h2>Quillstack</h2></header>
<div class="hero"><h1>Customers get paid twice as fast on average, based on 2025 data.</h1><p>Automatic reminders chase late payments for you. No credit card required.</p><a class="btn" href="#">Start Free Trial</a></div>
<section><h2>Why Quillstack</h2><p>Two-way sync with QuickBooks and Xero. Plans start at $12 per user per month.</p><p>Try every feature free for 14 days.</p></section>
<footer>© 2026 Quillstack. All rights reserved.</footer></body></html>`,

  tallyroute: `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Tallyroute — Fleet Route Planning Software</title>
<style>body{margin:0;font-family:Helvetica,Arial,sans-serif;color:#1f2933}.hero{padding:60px 48px;background:#0F766E;color:#fff}.hero h1{font-size:38px}.btn{background:#fff;color:#111;padding:12px 24px;border-radius:6px;font-weight:700;display:inline-block}</style></head>
<body><header><h2>Tallyroute</h2></header>
<div class="hero"><h1>Free for 30 days with all features.</h1><p>Pricing from $29 per vehicle per month. Customers cut fuel costs by an average of 20%.</p><a class="btn" href="#">Start Free Trial</a></div>
<section><h2>Why Tallyroute</h2><p>Real-time GPS tracking is included on every plan. Most fleets are fully set up within one day.</p></section>
<footer>© 2026 Tallyroute. All rights reserved.</footer></body></html>`,

  brightdesk: `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Brightdesk — Customer Support Helpdesk Software</title>
<style>body{margin:0;font-family:Helvetica,Arial,sans-serif;color:#1f2933}.hero{padding:60px 48px;background:#C2410C;color:#fff}.hero h1{font-size:38px}.btn{background:#fff;color:#111;padding:12px 24px;border-radius:6px;font-weight:700;display:inline-block}</style></head>
<body><header><h2>Brightdesk</h2></header>
<div class="hero"><h1>Connect your support inbox in about 15 minutes.</h1><p>Unlimited agents on every paid plan. Live chat support from our team 24/7.</p><a class="btn" href="#">Start Free Trial</a></div>
<section><h2>Why Brightdesk</h2><p>AI resolves up to 60% of tickets automatically. Paid plans from $19 per agent per month.</p><p>Free forever for teams of up to 3 agents.</p></section>
<footer>© 2026 Brightdesk. All rights reserved.</footer></body></html>`,

  ledgerly: `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Ledgerly HR — Payroll And Hr Software</title>
<style>body{margin:0;font-family:Helvetica,Arial,sans-serif;color:#1f2933}.hero{padding:60px 48px;background:#7C3AED;color:#fff}.hero h1{font-size:38px}.btn{background:#fff;color:#111;padding:12px 24px;border-radius:6px;font-weight:700;display:inline-block}</style></head>
<body><header><h2>Ledgerly HR</h2></header>
<div class="hero"><h1>Run payroll in about 5 minutes.</h1><p>Federal, state and local tax filings are handled for you. Next-day direct deposit is included.</p><a class="btn" href="#">Book a Demo</a></div>
<section><h2>Why Ledgerly</h2><p>Free setup and data migration from your old provider. Plans from $6 per employee per month plus a $40 base fee.</p></section>
<footer>© 2026 Ledgerly HR. All rights reserved.</footer></body></html>`,

  signalforge: `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Signalforge — Product Analytics Software</title>
<style>body{margin:0;font-family:Helvetica,Arial,sans-serif;color:#1f2933}.hero{padding:60px 48px;background:#BE185D;color:#fff}.hero h1{font-size:38px}.btn{background:#fff;color:#111;padding:12px 24px;border-radius:6px;font-weight:700;display:inline-block}</style></head>
<body><header><h2>Signalforge</h2></header>
<div class="hero"><h1>Unlimited seats on every plan.</h1><p>Try the Growth plan free for 21 days. Ask questions in plain English and get answers in seconds.</p><a class="btn" href="#">Start Free Trial</a></div>
<section><h2>Why Signalforge</h2><p>Free for up to 1 million events per month. SOC 2 Type II certified. Autocapture means no code is needed.</p></section>
<footer>© 2026 Signalforge. All rights reserved.</footer></body></html>`,

  halcyon: `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Halcyon Bottles — Insulated Water Bottles</title>
<style>body{margin:0;font-family:Helvetica,Arial,sans-serif;color:#1f2933}.hero{padding:60px 48px;background:#0E7490;color:#fff}.hero h1{font-size:38px}.btn{background:#fff;color:#111;padding:12px 24px;border-radius:6px;font-weight:700;display:inline-block}</style></head>
<body><header><h2>Halcyon Bottles</h2></header>
<div class="hero"><h1>Bottles from $24.</h1><p>Our lid is 100% leakproof when closed. Free shipping on all orders over $25.</p><a class="btn" href="#">Shop Now</a></div>
<section><h2>Why Halcyon</h2><p>Keeps drinks cold for 24 hours and hot for 12. Every bottle is backed by a lifetime warranty.</p><p>Save 30% today with code COLD30.</p></section>
<footer>© 2026 Halcyon Bottles. All rights reserved.</footer></body></html>`,

  fernway: `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Fernway Skincare — Skincare Serums</title>
<style>body{margin:0;font-family:Helvetica,Arial,sans-serif;color:#1f2933}.hero{padding:60px 48px;background:#4D7C0F;color:#fff}.hero h1{font-size:38px}.btn{background:#fff;color:#111;padding:12px 24px;border-radius:6px;font-weight:700;display:inline-block}</style></head>
<body><header><h2>Fernway Skincare</h2></header>
<div class="hero"><h1>Buy one, get one free on all serums this week.</h1><p>In a 2025 study, 82% saw brighter skin in 7 days. Free returns within 60 days, even if opened.</p><a class="btn" href="#">Shop Now</a></div>
<section><h2>Why Fernway</h2><p>Dermatologist tested for sensitive skin. Certified cruelty free — never tested on animals.</p><p>Made with 100% natural ingredients.</p></section>
<footer>© 2026 Fernway Skincare. All rights reserved.</footer></body></html>`,

  northpaw: `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Northpaw Pet Food — Fresh Dog Food Subscriptions</title>
<style>body{margin:0;font-family:Helvetica,Arial,sans-serif;color:#1f2933}.hero{padding:60px 48px;background:#B45309;color:#fff}.hero h1{font-size:38px}.btn{background:#fff;color:#111;padding:12px 24px;border-radius:6px;font-weight:700;display:inline-block}</style></head>
<body><header><h2>Northpaw Pet Food</h2></header>
<div class="hero"><h1>Get 50% off your first box.</h1><p>Fresh meals delivered every week. Skip, pause or cancel anytime online.</p><a class="btn" href="#">Get Started</a></div>
<section><h2>Why Northpaw</h2><p>Every recipe is formulated by board-certified veterinary nutritionists. Plans from $2 a day for small dogs.</p><p>Made with human-grade meat and vegetables.</p></section>
<footer>© 2026 Northpaw Pet Food. All rights reserved.</footer></body></html>`,

  loomhaus: `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Loomhaus Bedding — Linen Bedding</title>
<style>body{margin:0;font-family:Helvetica,Arial,sans-serif;color:#1f2933}.hero{padding:60px 48px;background:#6B4F3A;color:#fff}.hero h1{font-size:38px}.btn{background:#fff;color:#111;padding:12px 24px;border-radius:6px;font-weight:700;display:inline-block}</style></head>
<body><header><h2>Loomhaus Bedding</h2></header>
<div class="hero"><h1>25% off every sheet set this week.</h1><p>Try our sheets for 100 nights — free returns if you are not happy. Free shipping and returns on every order.</p><a class="btn" href="#">Shop Sheets</a></div>
<section><h2>Why Loomhaus</h2><p>Our linen gets softer with every wash. Sheet sets from $129. Woven from 100% European flax grown in France.</p></section>
<footer>© 2026 Loomhaus Bedding. All rights reserved.</footer></body></html>`,

  trailmark: `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Trailmark Gear — Hiking Backpacks</title>
<style>body{margin:0;font-family:Helvetica,Arial,sans-serif;color:#1f2933}.hero{padding:60px 48px;background:#365314;color:#fff}.hero h1{font-size:38px}.btn{background:#fff;color:#111;padding:12px 24px;border-radius:6px;font-weight:700;display:inline-block}</style></head>
<body><header><h2>Trailmark Gear</h2></header>
<div class="hero"><h1>Now $149 — was $199.</h1><p>Weighs just 2 lb (907 g). Guaranteed for life against defects. Free 2-day shipping on all orders.</p><a class="btn" href="#">Shop Packs</a></div>
<section><h2>Why Trailmark</h2><p>Fully waterproof, seam-sealed fabric. Back in stock — ships in 1 business day.</p></section>
<footer>© 2026 Trailmark Gear. All rights reserved.</footer></body></html>`,
};

// 60 Ads mapped to their exact respective snapshot
export const RAW_60_AD_DATA = [
  { id: "P01", adv: "Kestrel Business Funding", vert: "financial services", h1: "Rates From 6.9% APR", h2: "Apply in 10 Minutes", h3: "Same-Day Approval", d1: "Rates starting at 6.9% APR for qualified businesses. All credit types considered.", d2: "Simple online application, about 10 minutes. Apply Now.", url: "https://www.kestrelfunding.example/apply?utm_source=google&utm_medium=cpc", file: "pair_01.html", brand: "kestrel", cta: "Apply Now" },
  { id: "P02", adv: "Kestrel Business Funding", vert: "financial services", h1: "Apply in 10 Minutes", h2: "Bad Credit Considered", h3: "Funding Up to $500K", d1: "Simple online application, about 10 minutes. No collateral required on most loans.", d2: "All credit types considered. Apply Now.", url: "https://www.kestrelfunding.example/apply?utm_source=google&utm_medium=cpc", file: "pair_02.html", brand: "kestrel", cta: "Apply Now" },
  { id: "P03", adv: "Kestrel Business Funding", vert: "financial services", h1: "Funding Up to $500K", h2: "No Collateral Needed", h3: "Apply in 10 Minutes", d1: "Borrow up to $500,000 for your business. All credit types considered.", d2: "No collateral required on most loans. Apply Now.", url: "https://www.kestrelfunding.example/apply?utm_source=google&utm_medium=cpc", file: "pair_03.html", brand: "kestrel", cta: "Apply Now" },
  { id: "P04", adv: "Kestrel Business Funding", vert: "financial services", h1: "Funding Up to $500K", h2: "Bad Credit Considered", h3: "No Collateral Needed", d1: "Borrow up to $500,000 for your business. Rates starting at 6.9% APR for qualified business", d2: "All credit types considered. Apply Now.", url: "https://www.kestrelfunding.example/apply?utm_source=google&utm_medium=cpc", file: "pair_04.html", brand: "kestrel", cta: "Apply Now" },
  { id: "P05", adv: "Harborline Equipment Finance", vert: "financial services", h1: "Approval in 24 Hours", h2: "Startups Welcome", h3: "100% Equipment Financing", d1: "Credit decision within 24 hours. New and used equipment both qualify.", d2: "Businesses under 2 years welcome. Get My Quote.", url: "https://www.harborline.example/equipment-loans?utm_source=google&utm_medium=cpc", file: "pair_05.html", brand: "harborline", cta: "Get My Quote" },
  { id: "P06", adv: "Harborline Equipment Finance", vert: "financial services", h1: "Startups Welcome", h2: "New & Used Equipment", h3: "No Prepayment Penalty", d1: "Businesses under 2 years welcome. Credit decision within 24 hours.", d2: "New and used equipment both qualify. Get My Quote.", url: "https://www.harborline.example/equipment-loans?utm_source=google&utm_medium=cpc", file: "pair_06.html", brand: "harborline", cta: "Get My Quote" },
  { id: "P07", adv: "Harborline Equipment Finance", vert: "financial services", h1: "No Prepayment Penalty", h2: "100% Equipment Financing", h3: "Terms Up to 7 Years", d1: "Pay off early with no penalty. New and used equipment both qualify.", d2: "Finance 100% of the equipment cost. Get My Quote.", url: "https://www.harborline.example/equipment-loans?utm_source=google&utm_medium=cpc", file: "pair_07.html", brand: "harborline", cta: "Get My Quote" },
  { id: "P08", adv: "Harborline Equipment Finance", vert: "financial services", h1: "100% Equipment Financing", h2: "Terms Up to 7 Years", h3: "No Prepayment Penalty", d1: "Finance 100% of the equipment cost. New and used equipment both qualify.", d2: "Flexible terms up to 7 years. Get My Quote.", url: "https://www.harborline.example/equipment-loans?utm_source=google&utm_medium=cpc", file: "pair_08.html", brand: "harborline", cta: "Get My Quote" },
  { id: "P09", adv: "Cobalt Line of Credit", vert: "financial services", h1: "Guaranteed Approval", h2: "No Hard Credit Pull", h3: "No Annual Fee", d1: "Approval guaranteed for every business. Interest only on what you draw.", d2: "Checking your rate will not affect your score. Check My Rate.", url: "https://www.cobaltcredit.example/line-of-credit?utm_source=google&utm_medium=cpc", file: "pair_09.html", brand: "cobalt", cta: "Check My Rate" },
  { id: "P10", adv: "Cobalt Line of Credit", vert: "financial services", h1: "Guaranteed Approval", h2: "Draw Funds Instantly", h3: "Pay Only What You Use", d1: "Approval guaranteed for every business. Revolving lines up to $250,000.", d2: "Draw funds instantly, any time. Check My Rate.", url: "https://www.cobaltcredit.example/line-of-credit?utm_source=google&utm_medium=cpc", file: "pair_10.html", brand: "cobalt", cta: "Check My Rate" },
  { id: "P11", adv: "Cobalt Line of Credit", vert: "financial services", h1: "Pay Only What You Use", h2: "Credit Lines to $250K", h3: "No Hard Credit Pull", d1: "Interest only on what you draw. Draw funds instantly, any time.", d2: "Revolving lines up to $250,000. Check My Rate.", url: "https://www.cobaltcredit.example/line-of-credit?utm_source=google&utm_medium=cpc", file: "pair_11.html", brand: "cobalt", cta: "Check My Rate" },
  { id: "P12", adv: "Cobalt Line of Credit", vert: "financial services", h1: "Guaranteed Approval", h2: "No Annual Fee", h3: "No Hard Credit Pull", d1: "Approval guaranteed for every business. Revolving lines up to $250,000.", d2: "No annual fee, ever. Check My Rate.", url: "https://www.cobaltcredit.example/line-of-credit?utm_source=google&utm_medium=cpc", file: "pair_12.html", brand: "cobalt", cta: "Check My Rate" },
  { id: "P13", adv: "Meridian Merchant Capital", vert: "financial services", h1: "Funds in 24 Hours", h2: "No Credit Score Minimum", h3: "Advances Up to $300K", d1: "Money in your account within 24 hours. The lowest factor rates in the industry.", d2: "No minimum credit score. Get Funded.", url: "https://www.meridianmca.example/cash-advance?utm_source=google&utm_medium=cpc", file: "pair_13.html", brand: "meridian", cta: "Get Funded" },
  { id: "P14", adv: "Meridian Merchant Capital", vert: "financial services", h1: "Funds in 24 Hours", h2: "Repay From Sales", h3: "Lowest Factor Rates", d1: "Money in your account within 24 hours. Only 3 months in business needed.", d2: "Repay as a share of daily card sales. Get Funded.", url: "https://www.meridianmca.example/cash-advance?utm_source=google&utm_medium=cpc", file: "pair_14.html", brand: "meridian", cta: "Get Funded" },
  { id: "P15", adv: "Meridian Merchant Capital", vert: "financial services", h1: "Funds in 24 Hours", h2: "Advances Up to $300K", h3: "3 Months in Business", d1: "Money in your account within 24 hours. Repay as a share of daily card sales.", d2: "Get up to $300,000 based on your sales. Get Funded.", url: "https://www.meridianmca.example/cash-advance?utm_source=google&utm_medium=cpc", file: "pair_15.html", brand: "meridian", cta: "Get Funded" },
  { id: "P16", adv: "Meridian Merchant Capital", vert: "financial services", h1: "Repay From Sales", h2: "Funds in 24 Hours", h3: "No Credit Score Minimum", d1: "Repay as a share of daily card sales. Get up to $300,000 based on your sales.", d2: "Money in your account within 24 hours. Get Funded.", url: "https://www.meridianmca.example/cash-advance?utm_source=google&utm_medium=cpc", file: "pair_16.html", brand: "meridian", cta: "Get Funded" },
  { id: "P17", adv: "Pinecrest SBA Lending", vert: "financial services", h1: "Close in 30 Days", h2: "Terms Up to 25 Years", h3: "Low Down Payment", d1: "Close your SBA loan in as little as 30 days. An SBA Preferred Lender.", d2: "Long terms up to 25 years. Start Application.", url: "https://www.pinecrestsba.example/sba-7a?utm_source=google&utm_medium=cpc", file: "pair_17.html", brand: "pinecrest", cta: "Start Application" },
  { id: "P18", adv: "Pinecrest SBA Lending", vert: "financial services", h1: "Low Down Payment", h2: "Preferred SBA Lender", h3: "Close in 30 Days", d1: "Down payments as low as 10%. SBA 7(a) loans up to $5 million.", d2: "An SBA Preferred Lender. Start Application.", url: "https://www.pinecrestsba.example/sba-7a?utm_source=google&utm_medium=cpc", file: "pair_18.html", brand: "pinecrest", cta: "Start Application" },
  { id: "P19", adv: "Pinecrest SBA Lending", vert: "financial services", h1: "Free Pre-Qualification", h2: "SBA Loans Up to $5M", h3: "Low Down Payment", d1: "Free pre-qualification in minutes. Long terms up to 25 years.", d2: "SBA 7(a) loans up to $5 million. Start Application.", url: "https://www.pinecrestsba.example/sba-7a?utm_source=google&utm_medium=cpc", file: "pair_19.html", brand: "pinecrest", cta: "Start Application" },
  { id: "P20", adv: "Pinecrest SBA Lending", vert: "financial services", h1: "Terms Up to 25 Years", h2: "Close in 30 Days", h3: "Preferred SBA Lender", d1: "Long terms up to 25 years. Down payments as low as 10%.", d2: "Close your SBA loan in as little as 30 days. Start Application.", url: "https://www.pinecrestsba.example/sba-7a?utm_source=google&utm_medium=cpc", file: "pair_20.html", brand: "pinecrest", cta: "Start Application" },
  { id: "P21", adv: "Quillstack", vert: "SaaS", h1: "Free 14-Day Trial", h2: "Works With QuickBooks", h3: "Get Paid 2x Faster", d1: "Try free for 14 days. Automatic reminders chase late payers.", d2: "Syncs with QuickBooks and Xero. Start your free trial today.", url: "https://www.quillstack.example/invoicing?utm_source=google&utm_medium=cpc", file: "pair_21.html", brand: "quillstack", cta: "Start Free Trial" },
  { id: "P22", adv: "Quillstack", vert: "SaaS", h1: "Free 14-Day Trial", h2: "Auto Payment Reminders", h3: "No Credit Card Needed", d1: "Try free for 14 days. Customers get paid twice as fast.", d2: "Automatic reminders chase late payers. Start Free Trial.", url: "https://www.quillstack.example/invoicing?utm_source=google&utm_medium=cpc", file: "pair_22.html", brand: "quillstack", cta: "Start Free Trial" },
  { id: "P23", adv: "Quillstack", vert: "SaaS", h1: "No Credit Card Needed", h2: "Get Paid 2x Faster", h3: "Free 14-Day Trial", d1: "No credit card required to start. Automatic reminders chase late payers.", d2: "Customers get paid twice as fast. Start your free trial today.", url: "https://www.quillstack.example/invoicing?utm_source=google&utm_medium=cpc", file: "pair_23.html", brand: "quillstack", cta: "Start Free Trial" },
  { id: "P24", adv: "Quillstack", vert: "SaaS", h1: "Plans From $12/mo", h2: "Get Paid 2x Faster", h3: "Works With QuickBooks", d1: "Plans start at $12 per month. Automatic reminders chase late payers.", d2: "Customers get paid twice as fast. Start your free trial today.", url: "https://www.quillstack.example/invoicing?utm_source=google&utm_medium=cpc", file: "pair_24.html", brand: "quillstack", cta: "Start Free Trial" },
  { id: "P25", adv: "Tallyroute", vert: "SaaS", h1: "Live GPS Tracking", h2: "Free 30-Day Trial", h3: "From $29 per Vehicle", d1: "Real-time GPS tracking included. Customers cut fuel costs by 20%.", d2: "Free for 30 days, all features. Start your free trial today.", url: "https://www.tallyroute.example/fleet?utm_source=google&utm_medium=cpc", file: "pair_25.html", brand: "tallyroute", cta: "Start Free Trial" },
  { id: "P26", adv: "Tallyroute", vert: "SaaS", h1: "From $29 per Vehicle", h2: "Live GPS Tracking", h3: "Rated #1 by Fleet Pros", d1: "Pricing from $29 per vehicle. Free for 30 days, all features.", d2: "Real-time GPS tracking included. Start your free trial today.", url: "https://www.tallyroute.example/fleet?utm_source=google&utm_medium=cpc", file: "pair_26.html", brand: "tallyroute", cta: "Start Free Trial" },
  { id: "P27", adv: "Tallyroute", vert: "SaaS", h1: "Free 30-Day Trial", h2: "From $29 per Vehicle", h3: "Live GPS Tracking", d1: "Free for 30 days, all features. Customers cut fuel costs by 20%.", d2: "Pricing from $29 per vehicle. Start your free trial today.", url: "https://www.tallyroute.example/fleet?utm_source=google&utm_medium=cpc", file: "pair_27.html", brand: "tallyroute", cta: "Start Free Trial" },
  { id: "P28", adv: "Tallyroute", vert: "SaaS", h1: "Rated #1 by Fleet Pros", h2: "Set Up in 1 Day", h3: "From $29 per Vehicle", d1: "Rated number one by fleet managers. Customers cut fuel costs by 20%.", d2: "Live in a single day. Start your free trial today.", url: "https://www.tallyroute.example/fleet?utm_source=google&utm_medium=cpc", file: "pair_28.html", brand: "tallyroute", cta: "Start Free Trial" },
  { id: "P29", adv: "Brightdesk", vert: "SaaS", h1: "24/7 Live Support", h2: "Unlimited Agents", h3: "Set Up in 15 Minutes", d1: "Real humans, 24/7. AI resolves 60% of tickets automatically.", d2: "Unlimited agents on every plan. Start your free trial today.", url: "https://www.brightdesk.example/helpdesk?utm_source=google&utm_medium=cpc", file: "pair_29.html", brand: "brightdesk", cta: "Start Free Trial" },
  { id: "P30", adv: "Brightdesk", vert: "SaaS", h1: "Unlimited Agents", h2: "Free Forever Plan", h3: "Set Up in 15 Minutes", d1: "Unlimited agents on every plan. Real humans, 24/7.", d2: "Free forever for small teams. Start your free trial today.", url: "https://www.brightdesk.example/helpdesk?utm_source=google&utm_medium=cpc", file: "pair_30.html", brand: "brightdesk", cta: "Start Free Trial" },
  { id: "P31", adv: "Brightdesk", vert: "SaaS", h1: "AI Answers 60% of Tickets", h2: "Unlimited Agents", h3: "Plans From $19/agent", d1: "AI resolves 60% of tickets automatically. Connect your inbox in 15 minutes.", d2: "Unlimited agents on every plan. Start your free trial today.", url: "https://www.brightdesk.example/helpdesk?utm_source=google&utm_medium=cpc", file: "pair_31.html", brand: "brightdesk", cta: "Start Free Trial" },
  { id: "P32", adv: "Brightdesk", vert: "SaaS", h1: "Unlimited Agents", h2: "Plans From $19/agent", h3: "Set Up in 15 Minutes", d1: "Unlimited agents on every plan. Free forever for small teams.", d2: "Paid plans from $19 per agent. Start your free trial today.", url: "https://www.brightdesk.example/helpdesk?utm_source=google&utm_medium=cpc", file: "pair_32.html", brand: "brightdesk", cta: "Start Free Trial" },
  { id: "P33", adv: "Ledgerly HR", vert: "SaaS", h1: "Free Setup & Migration", h2: "Tax Filing Included", h3: "Run Payroll in 5 Min", d1: "We move your data over for free. Next-day direct deposit for your team.", d2: "Federal and state tax filing included. Book a Demo.", url: "https://www.ledgerlyhr.example/payroll?utm_source=google&utm_medium=cpc", file: "pair_33.html", brand: "ledgerly", cta: "Book a Demo" },
  { id: "P34", adv: "Ledgerly HR", vert: "SaaS", h1: "Next-Day Direct Deposit", h2: "From $6 per Employee", h3: "Zero Payroll Errors", d1: "Next-day direct deposit for your team. Run payroll in about five minutes.", d2: "Plans from $6 per employee. Book a Demo.", url: "https://www.ledgerlyhr.example/payroll?utm_source=google&utm_medium=cpc", file: "pair_34.html", brand: "ledgerly", cta: "Book a Demo" },
  { id: "P35", adv: "Ledgerly HR", vert: "SaaS", h1: "Tax Filing Included", h2: "Free Setup & Migration", h3: "Zero Payroll Errors", d1: "Federal and state tax filing included. Next-day direct deposit for your team.", d2: "We move your data over for free. Book a Demo.", url: "https://www.ledgerlyhr.example/payroll?utm_source=google&utm_medium=cpc", file: "pair_35.html", brand: "ledgerly", cta: "Book a Demo" },
  { id: "P36", adv: "Ledgerly HR", vert: "SaaS", h1: "Run Payroll in 5 Min", h2: "From $6 per Employee", h3: "Tax Filing Included", d1: "Run payroll in about five minutes. Guaranteed error-free payroll.", d2: "Plans from $6 per employee. Book a Demo.", url: "https://www.ledgerlyhr.example/payroll?utm_source=google&utm_medium=cpc", file: "pair_36.html", brand: "ledgerly", cta: "Book a Demo" },
  { id: "P37", adv: "Signalforge", vert: "SaaS", h1: "Answers in Seconds", h2: "Free 21-Day Trial", h3: "No Code Setup", d1: "Ask questions, get answers in seconds. SOC 2 Type II certified.", d2: "Try Growth free for 21 days. Start your free trial today.", url: "https://www.signalforge.example/analytics?utm_source=google&utm_medium=cpc", file: "pair_37.html", brand: "signalforge", cta: "Start Free Trial" },
  { id: "P38", adv: "Signalforge", vert: "SaaS", h1: "Free Up to 1M Events", h2: "No Code Setup", h3: "Free 21-Day Trial", d1: "Free for up to 1 million events a month. SOC 2 Type II certified.", d2: "Set up without writing code. Start your free trial today.", url: "https://www.signalforge.example/analytics?utm_source=google&utm_medium=cpc", file: "pair_38.html", brand: "signalforge", cta: "Start Free Trial" },
  { id: "P39", adv: "Signalforge", vert: "SaaS", h1: "Free 21-Day Trial", h2: "Unlimited Seats", h3: "Answers in Seconds", d1: "Try Growth free for 21 days. Free for up to 1 million events a month.", d2: "Unlimited team seats on all plans. Start your free trial today.", url: "https://www.signalforge.example/analytics?utm_source=google&utm_medium=cpc", file: "pair_39.html", brand: "signalforge", cta: "Start Free Trial" },
  { id: "P40", adv: "Signalforge", vert: "SaaS", h1: "Free Up to 1M Events", h2: "SOC 2 Compliant", h3: "Answers in Seconds", d1: "Free for up to 1 million events a month. Unlimited team seats on all plans.", d2: "SOC 2 Type II certified. Start your free trial today.", url: "https://www.signalforge.example/analytics?utm_source=google&utm_medium=cpc", file: "pair_40.html", brand: "signalforge", cta: "Start Free Trial" },
  { id: "P41", adv: "Halcyon Bottles", vert: "consumer e-commerce", h1: "Free Shipping Over $25", h2: "100% Leakproof", h3: "Cold for 24 Hours", d1: "Free shipping on orders over $25. Backed by a lifetime warranty.", d2: "A lid that never leaks. Shop Now.", url: "https://www.halcyonbottles.example/insulated-bottle?utm_source=google&utm_medium=cpc", file: "pair_41.html", brand: "halcyon", cta: "Shop Now" },
  { id: "P42", adv: "Halcyon Bottles", vert: "consumer e-commerce", h1: "From $24", h2: "100% Leakproof", h3: "Free Shipping Over $25", d1: "Bottles from $24. Keeps drinks ice cold for 24 hours.", d2: "A lid that never leaks. Shop Now.", url: "https://www.halcyonbottles.example/insulated-bottle?utm_source=google&utm_medium=cpc", file: "pair_42.html", brand: "halcyon", cta: "Shop Now" },
  { id: "P43", adv: "Halcyon Bottles", vert: "consumer e-commerce", h1: "Free Shipping Over $25", h2: "100% Leakproof", h3: "Lifetime Warranty", d1: "Free shipping on orders over $25. Bottles from $24.", d2: "A lid that never leaks. Shop Now.", url: "https://www.halcyonbottles.example/insulated-bottle?utm_source=google&utm_medium=cpc", file: "pair_43.html", brand: "halcyon", cta: "Shop Now" },
  { id: "P44", adv: "Halcyon Bottles", vert: "consumer e-commerce", h1: "From $24", h2: "Lifetime Warranty", h3: "Free Shipping Over $25", d1: "Bottles from $24. Keeps drinks ice cold for 24 hours.", d2: "Backed by a lifetime warranty. Shop Now.", url: "https://www.halcyonbottles.example/insulated-bottle?utm_source=google&utm_medium=cpc", file: "pair_44.html", brand: "halcyon", cta: "Shop Now" },
  { id: "P45", adv: "Fernway Skincare", vert: "consumer e-commerce", h1: "Free 60-Day Returns", h2: "Visible Results in 7 Days", h3: "Cruelty Free", d1: "Love it or return it free in 60 days. Buy one serum, get one free.", d2: "See brighter skin in 7 days. Shop Now.", url: "https://www.fernway.example/vitamin-c-serum?utm_source=google&utm_medium=cpc", file: "pair_45.html", brand: "fernway", cta: "Shop Now" },
  { id: "P46", adv: "Fernway Skincare", vert: "consumer e-commerce", h1: "100% Natural", h2: "Buy 1 Get 1 Free", h3: "Free 60-Day Returns", d1: "Made with 100% natural ingredients. Dermatologist tested and approved.", d2: "Buy one serum, get one free. Shop Now.", url: "https://www.fernway.example/vitamin-c-serum?utm_source=google&utm_medium=cpc", file: "pair_46.html", brand: "fernway", cta: "Shop Now" },
  { id: "P47", adv: "Fernway Skincare", vert: "consumer e-commerce", h1: "Visible Results in 7 Days", h2: "Buy 1 Get 1 Free", h3: "100% Natural", d1: "See brighter skin in 7 days. Love it or return it free in 60 days.", d2: "Buy one serum, get one free. Shop Now.", url: "https://www.fernway.example/vitamin-c-serum?utm_source=google&utm_medium=cpc", file: "pair_47.html", brand: "fernway", cta: "Shop Now" },
  { id: "P48", adv: "Fernway Skincare", vert: "consumer e-commerce", h1: "Cruelty Free", h2: "Free 60-Day Returns", h3: "100% Natural", d1: "Never tested on animals. Dermatologist tested and approved.", d2: "Love it or return it free in 60 days. Shop Now.", url: "https://www.fernway.example/vitamin-c-serum?utm_source=google&utm_medium=cpc", file: "pair_48.html", brand: "fernway", cta: "Shop Now" },
  { id: "P49", adv: "Northpaw Pet Food", vert: "consumer e-commerce", h1: "Delivered Fresh Weekly", h2: "Plans From $2/day", h3: "Cancel Anytime", d1: "Fresh food delivered every week. Half off your first box.", d2: "Plans from $2 a day. Get Started.", url: "https://www.northpaw.example/fresh-dog-food?utm_source=google&utm_medium=cpc", file: "pair_49.html", brand: "northpaw", cta: "Get Started" },
  { id: "P50", adv: "Northpaw Pet Food", vert: "consumer e-commerce", h1: "Vet-Formulated Recipes", h2: "Plans From $2/day", h3: "50% Off First Box", d1: "Recipes formulated by vets. No commitment, cancel anytime.", d2: "Plans from $2 a day. Get Started.", url: "https://www.northpaw.example/fresh-dog-food?utm_source=google&utm_medium=cpc", file: "pair_50.html", brand: "northpaw", cta: "Get Started" },
  { id: "P51", adv: "Northpaw Pet Food", vert: "consumer e-commerce", h1: "Plans From $2/day", h2: "Human-Grade Ingredients", h3: "Delivered Fresh Weekly", d1: "Plans from $2 a day. No commitment, cancel anytime.", d2: "Made with human-grade ingredients. Get Started.", url: "https://www.northpaw.example/fresh-dog-food?utm_source=google&utm_medium=cpc", file: "pair_51.html", brand: "northpaw", cta: "Get Started" },
  { id: "P52", adv: "Northpaw Pet Food", vert: "consumer e-commerce", h1: "Cancel Anytime", h2: "Delivered Fresh Weekly", h3: "Human-Grade Ingredients", d1: "No commitment, cancel anytime. Recipes formulated by vets.", d2: "Fresh food delivered every week. Get Started.", url: "https://www.northpaw.example/fresh-dog-food?utm_source=google&utm_medium=cpc", file: "pair_52.html", brand: "northpaw", cta: "Get Started" },
  { id: "P53", adv: "Loomhaus Bedding", vert: "consumer e-commerce", h1: "100% French Flax Linen", h2: "Gets Softer Every Wash", h3: "Sets From $129", d1: "Made from 100% French flax. Free shipping and free returns.", d2: "Gets softer with every wash. Shop Sheets.", url: "https://www.loomhaus.example/linen-sheets?utm_source=google&utm_medium=cpc", file: "pair_53.html", brand: "loomhaus", cta: "Shop Sheets" },
  { id: "P54", adv: "Loomhaus Bedding", vert: "consumer e-commerce", h1: "Free Shipping & Returns", h2: "100% French Flax Linen", h3: "100-Night Free Trial", d1: "Free shipping and free returns. 25% off all sheet sets.", d2: "Made from 100% French flax. Shop Sheets.", url: "https://www.loomhaus.example/linen-sheets?utm_source=google&utm_medium=cpc", file: "pair_54.html", brand: "loomhaus", cta: "Shop Sheets" },
  { id: "P55", adv: "Loomhaus Bedding", vert: "consumer e-commerce", h1: "Sets From $129", h2: "Gets Softer Every Wash", h3: "25% Off Sheet Sets", d1: "Sheet sets from $129. Sleep on it for 100 nights, risk free.", d2: "Gets softer with every wash. Shop Sheets.", url: "https://www.loomhaus.example/linen-sheets?utm_source=google&utm_medium=cpc", file: "pair_55.html", brand: "loomhaus", cta: "Shop Sheets" },
  { id: "P56", adv: "Loomhaus Bedding", vert: "consumer e-commerce", h1: "Gets Softer Every Wash", h2: "100-Night Free Trial", h3: "100% French Flax Linen", d1: "Gets softer with every wash. 25% off all sheet sets.", d2: "Sleep on it for 100 nights, risk free. Shop Sheets.", url: "https://www.loomhaus.example/linen-sheets?utm_source=google&utm_medium=cpc", file: "pair_56.html", brand: "loomhaus", cta: "Shop Sheets" },
  { id: "P57", adv: "Trailmark Gear", vert: "consumer e-commerce", h1: "Lifetime Guarantee", h2: "Now $149 (Was $199)", h3: "Free 2-Day Shipping", d1: "Guaranteed for life. Ultralight at just 2 lb.", d2: "Now $149, was $199. Shop Packs.", url: "https://www.trailmarkgear.example/hiking-backpack?utm_source=google&utm_medium=cpc", file: "pair_57.html", brand: "trailmark", cta: "Shop Packs" },
  { id: "P58", adv: "Trailmark Gear", vert: "consumer e-commerce", h1: "Free 2-Day Shipping", h2: "Lifetime Guarantee", h3: "Fully Waterproof", d1: "Free 2-day shipping. Now $149, was $199.", d2: "Guaranteed for life. Shop Packs.", url: "https://www.trailmarkgear.example/hiking-backpack?utm_source=google&utm_medium=cpc", file: "pair_58.html", brand: "trailmark", cta: "Shop Packs" },
  { id: "P59", adv: "Trailmark Gear", vert: "consumer e-commerce", h1: "Only 2 lb Ultralight", h2: "Lifetime Guarantee", h3: "Now $149 (Was $199)", d1: "Ultralight at just 2 lb. Back in stock and shipping now.", d2: "Guaranteed for life. Shop Packs.", url: "https://www.trailmarkgear.example/hiking-backpack?utm_source=google&utm_medium=cpc", file: "pair_59.html", brand: "trailmark", cta: "Shop Packs" },
  { id: "P60", adv: "Trailmark Gear", vert: "consumer e-commerce", h1: "Only 2 lb Ultralight", h2: "Now $149 (Was $199)", h3: "Lifetime Guarantee", d1: "Ultralight at just 2 lb. Back in stock and shipping now.", d2: "Now $149, was $199. Shop Packs.", url: "https://www.trailmarkgear.example/hiking-backpack?utm_source=google&utm_medium=cpc", file: "pair_60.html", brand: "trailmark", cta: "Shop Packs" },
];

export function getFullBenchmarkDataset(): BenchmarkAdPair[] {
  return RAW_60_AD_DATA.map((row) => ({
    pairId: row.id,
    advertiser: row.adv,
    vertical: row.vert as any,
    headline_1: row.h1,
    headline_2: row.h2,
    headline_3: row.h3,
    description_1: row.d1,
    description_2: row.d2,
    finalUrl: row.url,
    snapshotFile: row.file,
    landingPageHtml: BRAND_PAGES[row.brand] || BRAND_PAGES.kestrel,
  }));
}
