import * as cheerio from 'cheerio';
import crypto from 'crypto';
import { EvidenceSourceType, ExtractedPageContent, ExtractedSection, PositionCategory, SourceMode } from '../../src/types.js';

export interface ExtractionOptions {
  sourceMode: SourceMode;
  sourceUrl?: string;
  sourceFilename?: string;
}

/**
 * Robust HTML extraction engine for landing pages.
 * Extracts structured sections, headings, CTAs, offers, prices, and builds canonical text with character offsets.
 */
export function extractLandingPageContent(rawHtml: string, options: ExtractionOptions): ExtractedPageContent {
  const warnings: string[] = [];

  if (!rawHtml || typeof rawHtml !== 'string' || rawHtml.trim().length === 0) {
    return {
      title: '',
      metaDescription: '',
      headings: [],
      heroText: '',
      mainContent: '',
      productDescriptions: [],
      pricesAndDiscounts: [],
      guaranteesAndConditions: [],
      ctaButtons: [],
      faqItems: [],
      trustSignals: [],
      footerText: '',
      canonicalText: '',
      sections: [],
      contentLength: 0,
      extractedAt: new Date().toISOString(),
      extractionStatus: 'failed',
      sourceMode: options.sourceMode,
      sourceUrl: options.sourceUrl,
      sourceFilename: options.sourceFilename,
      contentHash: crypto.createHash('sha256').update('').digest('hex'),
      warnings: ['Supplied HTML or page content was completely empty.'],
    };
  }

  // Load into cheerio without executing any scripts
  const $ = cheerio.load(rawHtml, {
    xml: false,
  });

  // Strip harmful and noisy non-content elements
  $('script, style, noscript, svg, canvas, iframe, object, embed, link, meta:not([name="description"])').remove();
  $('[hidden], [aria-hidden="true"], [style*="display:none"], [style*="display: none"]').remove();

  // Extract Metadata
  const title = ($('title').first().text() || $('meta[property="og:title"]').attr('content') || '').trim();
  const metaDescription = ($('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '').trim();

  // Extract Headings
  const headings: { level: string; text: string }[] = [];
  $('h1, h2, h3, h4, h5, h6').each((_, el) => {
    const text = $(el).text().replace(/\s+/g, ' ').trim();
    if (text) {
      headings.push({
        level: el.tagName.toLowerCase(),
        text,
      });
    }
  });

  // Identify Sections & Position Categories
  const sections: ExtractedSection[] = [];
  let readingOrder = 1;

  // 1. Hero / Above the fold candidate elements
  let heroText = '';
  const heroCandidates = $('[class*="hero"], [id*="hero"], header, section:first-of-type, .banner');
  if (heroCandidates.length > 0) {
    const heroTexts: string[] = [];
    heroCandidates.each((_, el) => {
      const txt = $(el).text().replace(/\s+/g, ' ').trim();
      if (txt && txt.length > 10) {
        heroTexts.push(txt);
      }
    });
    heroText = heroTexts.join(' \n');
  } else {
    // Fallback: First H1 + immediate sibling paragraphs
    const firstH1 = $('h1').first();
    if (firstH1.length > 0) {
      const h1Text = firstH1.text().trim();
      const pText = firstH1.next('p').text().trim();
      heroText = `${h1Text} ${pText}`.trim();
    }
  }

  // 2. Footer extraction
  let footerText = '';
  const footerElements = $('footer, [class*="footer"], [id*="footer"]');
  if (footerElements.length > 0) {
    const footerLines: string[] = [];
    footerElements.each((_, el) => {
      const txt = $(el).text().replace(/\s+/g, ' ').trim();
      if (txt) footerLines.push(txt);
    });
    footerText = footerLines.join(' \n');
  }

  // 3. CTAs
  const ctaButtons: { text: string; href?: string }[] = [];
  $('a, button, [role="button"], input[type="submit"], input[type="button"]').each((_, el) => {
    const text = $(el).text().replace(/\s+/g, ' ').trim() || $(el).attr('value') || '';
    const href = $(el).attr('href');
    if (text && text.length > 1 && text.length < 80) {
      // deduplicate
      if (!ctaButtons.some((c) => c.text.toLowerCase() === text.toLowerCase())) {
        ctaButtons.push({ text, href: href || undefined });
      }
    }
  });

  // 4. FAQ Content
  const faqItems: { question: string; answer: string }[] = [];
  $('[class*="faq"], [id*="faq"], dl, details').each((_, el) => {
    const $faq = $(el);
    if (el.tagName.toLowerCase() === 'details') {
      const q = $faq.find('summary').text().trim();
      const a = $faq.clone().children('summary').remove().end().text().trim();
      if (q && a) faqItems.push({ question: q, answer: a });
    } else if (el.tagName.toLowerCase() === 'dl') {
      $faq.find('dt').each((i, dt) => {
        const q = $(dt).text().trim();
        const a = $(dt).next('dd').text().trim();
        if (q && a) faqItems.push({ question: q, answer: a });
      });
    } else {
      // General FAQ container
      const questions = $faq.find('h3, h4, .question, strong');
      questions.each((_, qEl) => {
        const q = $(qEl).text().trim();
        const a = $(qEl).next('p, div, .answer').text().trim();
        if (q && a && q.length > 5 && a.length > 5) {
          faqItems.push({ question: q, answer: a });
        }
      });
    }
  });

  // 5. Offers, Prices, Guarantees, Trust signals regex scanning on text nodes
  const fullBodyText = $('body').text().replace(/\s+/g, ' ').trim() || rawHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

  const pricesAndDiscounts: string[] = [];
  const guaranteesAndConditions: string[] = [];
  const trustSignals: string[] = [];
  const productDescriptions: string[] = [];

  // Price & Discount patterns ($99, 50% off, free shipping, $0 down, etc.)
  const priceRegex = /(\$\s*\d+(?:\.\d{2})?|\b\d+%\s*(?:off|discount)\b|free\s+trial|free\s+shipping|start\s+free|no\s+credit\s+card\s+required|\b\d+\s*day\s*free\s*trial\b)/gi;
  let priceMatch: RegExpExecArray | null;
  while ((priceMatch = priceRegex.exec(fullBodyText)) !== null) {
    const snippet = fullBodyText.substring(Math.max(0, priceMatch.index - 20), Math.min(fullBodyText.length, priceMatch.index + priceMatch[0].length + 40)).trim();
    if (!pricesAndDiscounts.includes(snippet) && pricesAndDiscounts.length < 15) {
      pricesAndDiscounts.push(snippet);
    }
  }

  // Guarantees, Approval & Conditions
  const guaranteeRegex = /(guarantee[d]?|warranty|same[- ]day\s+approval|instant\s+decision|terms\s+and\s+conditions|eligibility|cancel\s+anytime|money[- ]back)/gi;
  let guaranteeMatch: RegExpExecArray | null;
  while ((guaranteeMatch = guaranteeRegex.exec(fullBodyText)) !== null) {
    const snippet = fullBodyText.substring(Math.max(0, guaranteeMatch.index - 25), Math.min(fullBodyText.length, guaranteeMatch.index + guaranteeMatch[0].length + 50)).trim();
    if (!guaranteesAndConditions.includes(snippet) && guaranteesAndConditions.length < 15) {
      guaranteesAndConditions.push(snippet);
    }
  }

  // Trust signals (ratings, BBB, encrypted, trusted by)
  const trustRegex = /(trusted\s+by|\b\d+(?:\.\d)?\s*(?:\/|\s*out\s*of)\s*5\s*stars\b|rated\s+4\.\d|bbb\s+accredited|ssl\s+secure|soc[- ]2|iso\s*27001|customer\s+reviews)/gi;
  let trustMatch: RegExpExecArray | null;
  while ((trustMatch = trustRegex.exec(fullBodyText)) !== null) {
    const snippet = fullBodyText.substring(Math.max(0, trustMatch.index - 20), Math.min(fullBodyText.length, trustMatch.index + trustMatch[0].length + 40)).trim();
    if (!trustSignals.includes(snippet) && trustSignals.length < 10) {
      trustSignals.push(snippet);
    }
  }

  // Build canonical structured sections with character offsets
  let canonicalAccumulator = '';

  const addCanonicalSection = (
    name: string,
    pos: PositionCategory,
    textContent: string,
    source: EvidenceSourceType,
    selector?: string
  ) => {
    const cleaned = textContent.replace(/\s+/g, ' ').trim();
    if (!cleaned) return;
    const start = canonicalAccumulator.length > 0 ? canonicalAccumulator.length + 1 : 0;
    if (canonicalAccumulator.length > 0) {
      canonicalAccumulator += '\n';
    }
    canonicalAccumulator += cleaned;
    const end = canonicalAccumulator.length;

    sections.push({
      id: `sec-${readingOrder}`,
      sectionName: name,
      evidenceSource: source,
      positionCategory: pos,
      domSelector: selector,
      readingOrder: readingOrder++,
      text: cleaned,
      characterOffsetStart: start,
      characterOffsetEnd: end,
    });
  };

  // Add Metadata sections distinctly (NEVER as Hero)
  if (title) {
    addCanonicalSection('Page Title', 'Metadata: Page Title', title, 'page_title', 'head > title');
  }

  if (metaDescription) {
    addCanonicalSection('Meta Description', 'Metadata: Meta Description', metaDescription, 'meta_description', 'meta[name="description"]');
  }

  // Add Hero section if genuinely identified via DOM
  if (heroText) {
    const isExplicitHero = $('[class*="hero"], [id*="hero"], [class*="banner"], [id*="banner"]').length > 0;
    const heroPos: PositionCategory = isExplicitHero ? 'Above the Fold / Hero' : 'Above the Fold / Hero (Estimated)';
    addCanonicalSection('Hero Section', heroPos, heroText, 'hero_section', isExplicitHero ? '[class*="hero"]' : 'header, h1');
  }

  // Process main body containers
  const mainContainers = $('main, article, section:not([class*="hero"]):not([class*="footer"]):not([class*="faq"]), .content, #content');
  if (mainContainers.length > 0) {
    mainContainers.each((idx, el) => {
      const heading = $(el).find('h1, h2, h3').first().text().trim();
      const txt = $(el).text().replace(/\s+/g, ' ').trim();
      if (txt && txt.length > 20) {
        const pos: PositionCategory = idx < 2 ? 'Primary Content' : 'Secondary Content';
        addCanonicalSection(heading || `Content Block ${idx + 1}`, pos, txt, 'main_body', el.tagName.toLowerCase());
      }
    });
  } else {
    // If no explicit semantic containers, extract top paragraphs/divs
    const paras: string[] = [];
    $('p, li').each((_, el) => {
      const t = $(el).text().replace(/\s+/g, ' ').trim();
      if (t.length > 30) paras.push(t);
    });
    if (paras.length > 0) {
      addCanonicalSection('Main Body Content', 'Primary Content', paras.slice(0, 15).join(' '), 'main_body');
      if (paras.length > 15) {
        addCanonicalSection('Secondary Body Content', 'Secondary Content', paras.slice(15, 35).join(' '), 'main_body');
      }
    }
  }

  if (ctaButtons.length > 0) {
    const ctaText = ctaButtons.map((b) => b.text).join(' | ');
    addCanonicalSection('Action Buttons & CTAs', 'Primary Content', ctaText, 'cta_button', 'button, a');
  }

  if (faqItems.length > 0) {
    const faqSummary = faqItems.map((f) => `Q: ${f.question} A: ${f.answer}`).join(' ');
    addCanonicalSection('FAQ Section', 'FAQ or Supporting Content', faqSummary, 'faq', '[class*="faq"], dl');
  }

  if (footerText) {
    addCanonicalSection('Footer & Legal Disclaimers', 'Footer', footerText, 'footer', 'footer');
  }

  // If canonical text is still empty, fall back to cleaned raw body text
  if (!canonicalAccumulator) {
    canonicalAccumulator = fullBodyText;
    sections.push({
      id: 'sec-1',
      sectionName: 'Full Extracted Body',
      evidenceSource: 'main_body',
      positionCategory: 'Primary Content',
      readingOrder: 1,
      text: fullBodyText,
      characterOffsetStart: 0,
      characterOffsetEnd: fullBodyText.length,
    });
  }

  // Main content summary
  const mainContent = sections
    .filter((s) => s.positionCategory === 'Primary Content' || s.positionCategory === 'Secondary Content')
    .map((s) => s.text)
    .join('\n\n') || fullBodyText.substring(0, 3000);

  const contentHash = crypto.createHash('sha256').update(canonicalAccumulator).digest('hex');

  return {
    title,
    metaDescription,
    headings,
    heroText,
    mainContent,
    productDescriptions,
    pricesAndDiscounts,
    guaranteesAndConditions,
    ctaButtons,
    faqItems,
    trustSignals,
    footerText,
    canonicalText: canonicalAccumulator,
    sections,
    contentLength: canonicalAccumulator.length,
    extractedAt: new Date().toISOString(),
    extractionStatus: canonicalAccumulator.length > 50 ? 'success' : 'partial',
    sourceMode: options.sourceMode,
    sourceUrl: options.sourceUrl,
    sourceFilename: options.sourceFilename,
    contentHash,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}
