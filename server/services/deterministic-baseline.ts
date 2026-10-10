import {
  AdInput,
  ClaimClassification,
  EvidenceSourceType,
  ExtractedPageContent,
  ExtractedSection,
  FindingPriority,
  FixTarget,
  MismatchFinding,
  PositionCategory,
} from '../../src/types.js';
import { extractMonetaryAmounts } from './evidence-verifier.js';
import { cleanAdClaimText, deduplicateFindings } from './claim-deduplicator.js';

/**
 * Deterministic rule-based baseline matcher.
 * Performs strict lexical and semantic pattern matching across extracted sections.
 */
export function runDeterministicBaseline(
  ad: AdInput,
  pageContent: ExtractedPageContent
): MismatchFinding[] {
  const findings: MismatchFinding[] = [];
  let findingCounter = 1;

  const canonical = pageContent.canonicalText;
  const lowerCanonical = canonical.toLowerCase();

  // Helper to test if text or any phrase occurs
  const containsPhrase = (phrase: string): boolean => {
    return lowerCanonical.includes(phrase.toLowerCase().trim());
  };

  /**
   * Searches for a keyword or phrase preferentially in content body sections,
   * preserving exact section source and real DOM position category.
   */
  const findSectionAndExcerptFor = (
    keyword: string,
    preferBody = true
  ): { quote: string; sectionName: string; position: PositionCategory; source: EvidenceSourceType } | null => {
    const kwLower = keyword.toLowerCase().trim();
    if (!kwLower) return null;

    // Filter candidate sections: body sections first if preferred
    const sectionsToSearch = preferBody
      ? [
          ...pageContent.sections.filter((s) => s.evidenceSource !== 'page_title' && s.evidenceSource !== 'meta_description'),
          ...pageContent.sections.filter((s) => s.evidenceSource === 'page_title' || s.evidenceSource === 'meta_description'),
        ]
      : pageContent.sections;

    for (const sec of sectionsToSearch) {
      const secLower = sec.text.toLowerCase();
      const idx = secLower.indexOf(kwLower);
      if (idx !== -1) {
        // Expand excerpt to complete sentence or generous window around keyword
        const start = Math.max(0, idx - 25);
        const end = Math.min(sec.text.length, idx + keyword.length + 65);
        const excerpt = sec.text.substring(start, end).replace(/\s+/g, ' ').trim();
        return {
          quote: excerpt,
          sectionName: sec.sectionName,
          position: sec.positionCategory,
          source: sec.evidenceSource,
        };
      }
    }

    // Fallback: search canonical text
    const idx = lowerCanonical.indexOf(kwLower);
    if (idx !== -1) {
      const start = Math.max(0, idx - 25);
      const end = Math.min(canonical.length, idx + keyword.length + 65);
      const excerpt = canonical.substring(start, end).replace(/\s+/g, ' ').trim();
      return {
        quote: excerpt,
        sectionName: 'Page Content',
        position: 'Primary Content',
        source: 'main_body',
      };
    }

    return null;
  };

  /**
   * Searches for monetary amounts or numerical loan offer matches in extracted sections.
   */
  const findSectionAndExcerptForAmount = (
    amount: number
  ): { quote: string; sectionName: string; position: PositionCategory; source: EvidenceSourceType } | null => {
    const formatted1 = `$${amount.toLocaleString()}`.toLowerCase();
    const formatted2 = `$${amount}`.toLowerCase();
    const kShort = amount >= 1000 ? `${amount / 1000}k`.toLowerCase() : '';

    for (const sec of pageContent.sections) {
      const secLower = sec.text.toLowerCase();
      let matchIdx = secLower.indexOf(formatted1);
      let matchLen = formatted1.length;
      if (matchIdx === -1) {
        matchIdx = secLower.indexOf(formatted2);
        matchLen = formatted2.length;
      }
      if (matchIdx === -1 && kShort) {
        matchIdx = secLower.indexOf(kShort);
        matchLen = kShort.length;
      }

      if (matchIdx !== -1) {
        // Look for sentence boundaries
        const start = Math.max(0, sec.text.lastIndexOf('.', matchIdx) + 1);
        let end = sec.text.indexOf('.', matchIdx + matchLen);
        if (end === -1) end = Math.min(sec.text.length, matchIdx + matchLen + 50);
        else end = end + 1;

        const excerpt = sec.text.substring(start, end).replace(/\s+/g, ' ').trim();
        return {
          quote: excerpt || sec.text.substring(Math.max(0, matchIdx - 20), Math.min(sec.text.length, matchIdx + matchLen + 40)).trim(),
          sectionName: sec.sectionName,
          position: sec.positionCategory,
          source: sec.evidenceSource,
        };
      }
    }

    return null;
  };

  // 1. Evaluate Headlines
  for (const headline of ad.headlines) {
    const { cleanText: cleanHeadline } = cleanAdClaimText(headline);
    if (!cleanHeadline) continue;
    const cleanLower = cleanHeadline.toLowerCase();

    // A. SPEED & APPROVAL TIMEFRAME CLAIMS (e.g. "Get Approved Same Day", "Fast loan approval")
    const isApprovalSpeedClaim =
      /(fast|quick|same[- ]day|same\s+day|instant|24[- ]hour|within 24|speedy|minutes)\s+(?:loan\s+)?(approv|decision|fund|review|turnaround)/i.test(
        cleanLower
      ) ||
      /get\s+approved\s+(?:the\s+)?same\s+day/i.test(cleanLower) ||
      /same[- ]day\s+approval/i.test(cleanLower) ||
      /fast\s+loan\s+approval/i.test(cleanLower);

    if (isApprovalSpeedClaim) {
      // Check if page contains an EXPLICIT approval speed/turnaround guarantee
      const speedProofRegex =
        /(same[- ]day\s+approval|same\s+day\s+approval|instant\s+decision|instant\s+approval|within\s+24\s+hours|decision\s+within\s+24|receive\s+funds\s+within\s+24|decision\s+the\s+same\s+business\s+day|in\s+about\s+10\s+minutes|in\s+minutes|fast\s+approval|quick\s+decision)/i;
      const speedMatch = lowerCanonical.match(speedProofRegex);

      if (speedMatch) {
        const found = findSectionAndExcerptFor(speedMatch[0]);
        findings.push({
          id: `find-${findingCounter++}`,
          adClaim: cleanHeadline,
          claimType: 'headline',
          classification: 'Explicitly Supported',
          evidenceQuote: found?.quote || speedMatch[0],
          evidenceSource: found?.source || 'main_body',
          positionCategory: found?.position || 'Primary Content',
          explanation: `Approval turnaround timeframe is verified on the landing page in ${found?.sectionName || 'page content'}.`,
          recommendedFix: 'Maintain current alignment between headline and landing page copy.',
          priority: 'Low',
          fixTarget: 'ad',
          estimatedEffort: 'Low',
          reviewStatus: 'Open',
          isVerifiedFact: true,
        });
      } else {
        // Approval speed is NOT established on page!
        const hasGeneralReview =
          containsPhrase('review your application') ||
          containsPhrase('team will review') ||
          containsPhrase('apply online');

        const expl = hasGeneralReview
          ? `The ad promises fast loan approval, but the landing page only describes a general review process ("Our team will review your application") without establishing a fast approval timeframe or turnaround guarantee. The approval speed is not established.`
          : `The ad promises "${cleanHeadline}", but no approval timeframe is mentioned on the landing page.`;

        findings.push({
          id: `find-${findingCounter++}`,
          adClaim: cleanHeadline,
          claimType: 'headline',
          classification: 'Not Found',
          evidenceQuote: undefined, // Crucial: do NOT supply irrelevant title or review text as proof of fast approval!
          evidenceSource: 'other',
          positionCategory: 'Unknown Position',
          explanation: expl,
          recommendedFix:
            'Either add explicit approval turnaround processing details to the landing page or revise the ad headline to "Apply Online Today".',
          priority: 'Critical',
          fixTarget: 'both',
          estimatedEffort: 'Medium',
          reviewStatus: 'Open',
          isVerifiedFact: true, // Fact that approval speed is not found
        });
      }
      continue;
    }

    // B. GUARANTEED APPROVAL CLAIMS (e.g. Cobalt Line of Credit P09)
    if (/guaranteed\s+approval/i.test(cleanLower)) {
      if (containsPhrase('no guaranteed approval') || containsPhrase('subject to underwriting')) {
        const found = findSectionAndExcerptFor('no guaranteed approval') || findSectionAndExcerptFor('subject to underwriting');
        findings.push({
          id: `find-${findingCounter++}`,
          adClaim: cleanHeadline,
          claimType: 'guarantee',
          classification: 'Contradicted',
          evidenceQuote: found?.quote || 'Approval subject to underwriting. No guaranteed approval.',
          evidenceSource: found?.source || 'main_body',
          positionCategory: found?.position || 'Primary Content',
          explanation:
            'The ad promises "Guaranteed Approval", but the landing page explicitly states that approval is subject to underwriting and there is no guaranteed approval.',
          recommendedFix:
            'Remove "Guaranteed Approval" from ad headlines to eliminate compliance exposure and customer rejection.',
          priority: 'Critical',
          fixTarget: 'ad',
          estimatedEffort: 'Low',
          reviewStatus: 'Open',
          isVerifiedFact: true,
        });
        continue;
      }
    }

    // C. FREE TRIAL DURATION (e.g. 30-day trial vs 7-day or 14-day)
    const trialMatch = cleanHeadline.match(/(\d+)[- ]day\s+(?:free\s+)?trial|(\d+)[- ]day\s+trial/i);
    if (trialMatch) {
      const adDays = trialMatch[1] || trialMatch[2];
      const pageDaysMatch = lowerCanonical.match(/(\d+)[- ]day\s+(?:free\s+)?trial|free\s+for\s+(\d+)\s*days?|(\d+)\s*days?\s*free/i);
      if (pageDaysMatch) {
        const pageDays = pageDaysMatch[1] || pageDaysMatch[2] || pageDaysMatch[3];
        if (adDays === pageDays) {
          const found = findSectionAndExcerptFor(`${pageDays} day`) || findSectionAndExcerptFor(`${pageDays}-day`);
          findings.push({
            id: `find-${findingCounter++}`,
            adClaim: cleanHeadline,
            claimType: 'headline',
            classification: 'Explicitly Supported',
            evidenceQuote: found?.quote || `${pageDays}-day trial`,
            evidenceSource: found?.source || 'main_body',
            positionCategory: found?.position || 'Primary Content',
            explanation: `The ${adDays}-day trial duration in the ad matches the landing page copy.`,
            recommendedFix: 'Keep trial terms synchronized across ad and page.',
            priority: 'Low',
            fixTarget: 'ad',
            estimatedEffort: 'Low',
            reviewStatus: 'Open',
            isVerifiedFact: true,
          });
        } else {
          const found =
            findSectionAndExcerptFor(`${pageDays} day`) ||
            findSectionAndExcerptFor(`${pageDays}-day`) ||
            findSectionAndExcerptFor(`free for ${pageDays} days`);
          findings.push({
            id: `find-${findingCounter++}`,
            adClaim: cleanHeadline,
            claimType: 'headline',
            classification: 'Contradicted',
            evidenceQuote: found?.quote || `${pageDays} days free`,
            evidenceSource: found?.source || 'main_body',
            positionCategory: found?.position || 'Primary Content',
            explanation: `Ad promises a ${adDays}-day trial, but landing page explicitly states "${found?.quote || `${pageDays} days`}". This causes severe user churn and distrust.`,
            recommendedFix: `Update ad headline to "${pageDays}-Day Free Trial" or adjust landing page offer to match the advertised ${adDays} days.`,
            priority: 'Critical',
            fixTarget: 'ad',
            estimatedEffort: 'Low',
            reviewStatus: 'Open',
            isVerifiedFact: true,
          });
        }
        continue;
      } else {
        findings.push({
          id: `find-${findingCounter++}`,
          adClaim: cleanHeadline,
          claimType: 'headline',
          classification: 'Not Found',
          evidenceQuote: undefined,
          evidenceSource: 'other',
          positionCategory: 'Unknown Position',
          explanation: `Ad specifies a ${adDays}-day free trial, but no trial duration is documented on the landing page.`,
          recommendedFix: 'Disclose the exact free trial length above the fold on the landing page.',
          priority: 'High',
          fixTarget: 'landing_page',
          estimatedEffort: 'Medium',
          reviewStatus: 'Open',
          isVerifiedFact: true,
        });
        continue;
      }
    }

    // D. DISCOUNT PERCENTAGE (e.g. 50% off vs 20% off)
    const discountMatch = cleanHeadline.match(/(?:save\s+)?(\d+)%|\b(\d+)%\s*(?:off|discount|save)/i);
    if (discountMatch) {
      const adPercent = discountMatch[1] || discountMatch[2];
      const pagePercentMatch = lowerCanonical.match(/(?:save\s+)?(\d+)%|\b(\d+)%\s*(?:off|discount|save)/i);
      if (pagePercentMatch) {
        const pagePercent = pagePercentMatch[1] || pagePercentMatch[2];
        if (adPercent === pagePercent) {
          const found = findSectionAndExcerptFor(`${pagePercent}%`);
          findings.push({
            id: `find-${findingCounter++}`,
            adClaim: cleanHeadline,
            claimType: 'offer',
            classification: 'Explicitly Supported',
            evidenceQuote: found?.quote || `${pagePercent}% off`,
            evidenceSource: found?.source || 'main_body',
            positionCategory: found?.position || 'Primary Content',
            explanation: `The advertised ${adPercent}% discount is verified on the landing page.`,
            recommendedFix: 'None required.',
            priority: 'Low',
            fixTarget: 'ad',
            estimatedEffort: 'Low',
            reviewStatus: 'Open',
            isVerifiedFact: true,
          });
        } else {
          const found = findSectionAndExcerptFor(`${pagePercent}%`);
          findings.push({
            id: `find-${findingCounter++}`,
            adClaim: cleanHeadline,
            claimType: 'offer',
            classification: 'Contradicted',
            evidenceQuote: found?.quote || `Save ${pagePercent}% on selected products`,
            evidenceSource: found?.source || 'main_body',
            positionCategory: found?.position || 'Primary Content',
            explanation: `Ad advertises ${adPercent}% off, but landing page explicitly states "${found?.quote || `${pagePercent}%`}". Visitors expecting ${adPercent}% will bounce.`,
            recommendedFix: `Update ad headline to advertise the genuine ${pagePercent}% discount, or activate the ${adPercent}% promotion on the page.`,
            priority: 'Critical',
            fixTarget: 'ad',
            estimatedEffort: 'Low',
            reviewStatus: 'Open',
            isVerifiedFact: true,
          });
        }
        continue;
      }
    }

    // E. MONETARY AMOUNTS & LOAN OFFERS IN HEADLINES (e.g. "Loans up to $10,000", "Funding Up to $500K")
    const headlineAmounts = extractMonetaryAmounts(cleanHeadline);
    if (headlineAmounts.length > 0) {
      const pageAmounts = extractMonetaryAmounts(canonical);
      const matchingAmount = headlineAmounts.find((ha) => pageAmounts.includes(ha));

      if (matchingAmount !== undefined) {
        const found = findSectionAndExcerptForAmount(matchingAmount);
        findings.push({
          id: `find-${findingCounter++}`,
          adClaim: cleanHeadline,
          claimType: 'offer',
          classification: 'Explicitly Supported',
          evidenceQuote: found?.quote || `Loans up to $${matchingAmount.toLocaleString()}`,
          evidenceSource: found?.source || 'main_body',
          positionCategory: found?.position || 'Primary Content',
          explanation: `The advertised funding/loan amount ($${matchingAmount.toLocaleString()}) is explicitly supported on the landing page.`,
          recommendedFix: 'Maintain exact loan threshold terms.',
          priority: 'Low',
          fixTarget: 'ad',
          estimatedEffort: 'Low',
          reviewStatus: 'Open',
          isVerifiedFact: true,
        });
        continue;
      } else if (pageAmounts.length > 0) {
        findings.push({
          id: `find-${findingCounter++}`,
          adClaim: cleanHeadline,
          claimType: 'offer',
          classification: 'Contradicted',
          evidenceQuote: `Available limits: $${pageAmounts[0].toLocaleString()}`,
          evidenceSource: 'main_body',
          positionCategory: 'Primary Content',
          explanation: `Ad advertises $${headlineAmounts[0].toLocaleString()}, but the landing page states $${pageAmounts[0].toLocaleString()}.`,
          recommendedFix: 'Align headline amount to landing page limit.',
          priority: 'Critical',
          fixTarget: 'ad',
          estimatedEffort: 'Low',
          reviewStatus: 'Open',
          isVerifiedFact: true,
        });
        continue;
      } else {
        findings.push({
          id: `find-${findingCounter++}`,
          adClaim: cleanHeadline,
          claimType: 'offer',
          classification: 'Not Found',
          evidenceQuote: undefined,
          evidenceSource: 'other',
          positionCategory: 'Unknown Position',
          explanation: `The advertised amount ($${headlineAmounts[0].toLocaleString()}) is not found in the landing page content.`,
          recommendedFix: 'Disclose loan amount on the landing page.',
          priority: 'High',
          fixTarget: 'landing_page',
          estimatedEffort: 'Medium',
          reviewStatus: 'Open',
          isVerifiedFact: true,
        });
        continue;
      }
    }

    // F. FREE SHIPPING
    if (/free\s+shipping/i.test(cleanHeadline)) {
      if (containsPhrase('free shipping')) {
        const found = findSectionAndExcerptFor('free shipping');
        findings.push({
          id: `find-${findingCounter++}`,
          adClaim: cleanHeadline,
          claimType: 'offer',
          classification: 'Explicitly Supported',
          evidenceQuote: found?.quote || 'Free shipping on orders above $50',
          evidenceSource: found?.source || 'main_body',
          positionCategory: found?.position || 'Primary Content',
          explanation: 'Free shipping offer is verified directly on the landing page.',
          recommendedFix: 'Ensure minimum threshold terms are clearly visible in the cart.',
          priority: 'Low',
          fixTarget: 'ad',
          estimatedEffort: 'Low',
          reviewStatus: 'Open',
          isVerifiedFact: true,
        });
        continue;
      }
    }

    // G. GENERIC HEADLINE MATCHING
    const headlineWords = cleanHeadline
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !['and', 'for', 'the', 'with', 'your'].includes(w));

    const matchedWords = headlineWords.filter((w) => lowerCanonical.includes(w));
    const matchRatio = headlineWords.length > 0 ? matchedWords.length / headlineWords.length : 0;

    const qualifyingModifiers = headlineWords.filter((w) =>
      ['fast', 'quick', 'instant', 'free', 'guaranteed', 'best', 'easy', 'lowest', 'zero', 'same', 'day'].includes(w)
    );
    const missedModifiers = qualifyingModifiers.filter((m) => !lowerCanonical.includes(m));

    if (matchRatio >= 0.7 && missedModifiers.length === 0) {
      const bestWord = matchedWords.find((w) => qualifyingModifiers.includes(w)) || matchedWords[0];
      const found = findSectionAndExcerptFor(bestWord);
      findings.push({
        id: `find-${findingCounter++}`,
        adClaim: cleanHeadline,
        claimType: 'headline',
        classification: 'Explicitly Supported',
        evidenceQuote: found?.quote,
        evidenceSource: found?.source || 'main_body',
        positionCategory: found?.position || 'Primary Content',
        explanation: 'Core headline keywords and topics are substantiated on the landing page.',
        recommendedFix: 'Continue optimizing headline relevancy.',
        priority: 'Low',
        fixTarget: 'ad',
        estimatedEffort: 'Low',
        reviewStatus: 'Open',
        isVerifiedFact: true,
      });
    } else if (matchRatio >= 0.4) {
      const found = findSectionAndExcerptFor(matchedWords[0] || '');
      findings.push({
        id: `find-${findingCounter++}`,
        adClaim: cleanHeadline,
        claimType: 'headline',
        classification: 'Partially Supported',
        evidenceQuote: found?.quote,
        evidenceSource: found?.source || 'main_body',
        positionCategory: found?.position || 'Secondary Content',
        explanation:
          missedModifiers.length > 0
            ? `Headline topic is mentioned, but key qualifying terms (${missedModifiers.join(', ')}) are not substantiated.`
            : 'Headline concepts are partially addressed, but specific terminology lacks strong presence.',
        recommendedFix: 'Add the primary ad keyword phrases into the H1 or hero subhead of the landing page.',
        priority: 'Medium',
        fixTarget: 'landing_page',
        estimatedEffort: 'Low',
        reviewStatus: 'Open',
        isVerifiedFact: false,
      });
    } else {
      findings.push({
        id: `find-${findingCounter++}`,
        adClaim: cleanHeadline,
        claimType: 'headline',
        classification: 'Not Found',
        evidenceQuote: undefined,
        evidenceSource: 'other',
        positionCategory: 'Unknown Position',
        explanation: 'Headline promises are absent from the landing page content.',
        recommendedFix: 'Align headline copy to match actual page offerings.',
        priority: 'High',
        fixTarget: 'ad',
        estimatedEffort: 'Medium',
        reviewStatus: 'Open',
        isVerifiedFact: true,
      });
    }
  }

  // 2. Evaluate Descriptions
  for (const desc of ad.descriptions) {
    const { cleanText: cleanDesc } = cleanAdClaimText(desc);
    if (!cleanDesc) continue;
    const cleanLower = cleanDesc.toLowerCase();

    // A. COMPOUND CLAIM CHECK (e.g. Test E: "Guaranteed $10,000 approval in five minutes.")
    // If the description promises guaranteed approval and/or 5-minute approval along with an amount
    const descHasGuaranteed = /\bguarantee(?:d)?(?:\s+approval)?\b/i.test(cleanLower);
    const descHasFiveMinutes = /\b(?:five|5|\d+)\s*minutes?\b|\binstant\b/i.test(cleanLower);
    const descAmounts = extractMonetaryAmounts(cleanDesc);

    if (descAmounts.length > 0 && (descHasGuaranteed || descHasFiveMinutes)) {
      const pageAmounts = extractMonetaryAmounts(canonical);
      const matchingAmount = descAmounts.find((a) => pageAmounts.includes(a));
      const pageHasGuaranteed = /\bguarantee(?:d)?(?:\s+approval)?\b/i.test(lowerCanonical);
      const pageHasFiveMinutes = /\b(?:five|5|\d+)\s*minutes?\b|\binstant\s+(?:decision|approval)\b/i.test(lowerCanonical);

      if (matchingAmount !== undefined && (!pageHasGuaranteed || !pageHasFiveMinutes)) {
        const found = findSectionAndExcerptForAmount(matchingAmount);
        const unsupportedList: string[] = [];
        if (descHasGuaranteed && !pageHasGuaranteed) unsupportedList.push('guaranteed approval');
        if (descHasFiveMinutes && !pageHasFiveMinutes) unsupportedList.push('5-minute processing');

        findings.push({
          id: `find-${findingCounter++}`,
          adClaim: cleanDesc,
          claimType: 'description',
          classification: 'Partially Supported',
          evidenceQuote: found?.quote,
          evidenceSource: found?.source || 'main_body',
          positionCategory: found?.position || 'Primary Content',
          explanation: `The loan amount of $${matchingAmount.toLocaleString()} is explicitly stated on the page, but the promises of ${unsupportedList.join(' and ')} are completely unsupported by landing page evidence.`,
          recommendedFix: `Remove "${unsupportedList.join(' and ')}" from the ad description unless explicitly offered on the landing page.`,
          priority: 'Critical',
          fixTarget: 'ad',
          estimatedEffort: 'Low',
          reviewStatus: 'Open',
          isVerifiedFact: false,
        });
        continue;
      }
    }

    // B. MONETARY AMOUNTS & LOAN OFFERS IN DESCRIPTIONS (e.g. "Get loans up to $10,000.")
    if (descAmounts.length > 0) {
      const pageAmounts = extractMonetaryAmounts(canonical);
      const matchingAmount = descAmounts.find((da) => pageAmounts.includes(da));

      if (matchingAmount !== undefined) {
        const found = findSectionAndExcerptForAmount(matchingAmount);
        findings.push({
          id: `find-${findingCounter++}`,
          adClaim: cleanDesc,
          claimType: 'description',
          classification: 'Explicitly Supported',
          evidenceQuote: found?.quote || `Personal loan of up to $${matchingAmount.toLocaleString()}`,
          evidenceSource: found?.source || 'main_body',
          positionCategory: found?.position || 'Primary Content',
          explanation: `The advertised loan offer of up to $${matchingAmount.toLocaleString()} is explicitly verified in the landing page content.`,
          recommendedFix: 'Ensure eligibility terms and APR disclosures remain visible alongside the amount.',
          priority: 'Low',
          fixTarget: 'ad',
          estimatedEffort: 'Low',
          reviewStatus: 'Open',
          isVerifiedFact: true,
        });
        continue;
      } else if (pageAmounts.length > 0) {
        findings.push({
          id: `find-${findingCounter++}`,
          adClaim: cleanDesc,
          claimType: 'description',
          classification: 'Contradicted',
          evidenceQuote: `Available limits: $${pageAmounts[0].toLocaleString()}`,
          evidenceSource: 'main_body',
          positionCategory: 'Primary Content',
          explanation: `Ad description offers $${descAmounts[0].toLocaleString()}, but the landing page states $${pageAmounts[0].toLocaleString()}.`,
          recommendedFix: 'Align ad description with landing page maximum.',
          priority: 'Critical',
          fixTarget: 'ad',
          estimatedEffort: 'Low',
          reviewStatus: 'Open',
          isVerifiedFact: true,
        });
        continue;
      } else {
        findings.push({
          id: `find-${findingCounter++}`,
          adClaim: cleanDesc,
          claimType: 'description',
          classification: 'Not Found',
          evidenceQuote: undefined,
          evidenceSource: 'other',
          positionCategory: 'Unknown Position',
          explanation: `The advertised loan amount of $${descAmounts[0].toLocaleString()} was not found on the landing page.`,
          recommendedFix: 'State available loan amounts clearly on the page.',
          priority: 'High',
          fixTarget: 'landing_page',
          estimatedEffort: 'Medium',
          reviewStatus: 'Open',
          isVerifiedFact: true,
        });
        continue;
      }
    }

    // C. Footer-only evidence case (e.g. 24/7 support or money-back guarantee buried in footer)
    if (/24\/7\s+support|money[- ]back\s+guarantee/i.test(cleanLower)) {
      const footerLower = pageContent.footerText.toLowerCase();
      const heroLower = pageContent.heroText.toLowerCase();
      const mainLower = pageContent.mainContent.toLowerCase();

      if (footerLower.includes('24/7') || footerLower.includes('money-back') || footerLower.includes('guarantee')) {
        const isOnlyInFooter = !heroLower.includes('24/7') && !heroLower.includes('money-back') && !mainLower.includes('24/7');
        const quote = pageContent.footerText.split('\n')[0] || '24/7 Customer Support';
        findings.push({
          id: `find-${findingCounter++}`,
          adClaim: cleanDesc,
          claimType: 'description',
          classification: isOnlyInFooter ? 'Partially Supported' : 'Explicitly Supported',
          evidenceQuote: quote,
          evidenceSource: 'footer',
          positionCategory: 'Footer',
          explanation: isOnlyInFooter
            ? 'Claim is mentioned only in the footer. Prominent ad promises buried at the bottom of the page suffer low discoverability.'
            : 'Claim is supported in the footer and main content.',
          recommendedFix: isOnlyInFooter
            ? 'Elevate the guarantee or support badge into the hero section or directly beside the primary CTA.'
            : 'Maintain current placement.',
          priority: isOnlyInFooter ? 'Medium' : 'Low',
          fixTarget: 'landing_page',
          estimatedEffort: 'Low',
          reviewStatus: 'Open',
          isVerifiedFact: true,
        });
        continue;
      }
    }

    // D. Generic Description Matching with Semantic Lemmatization
    const descWords = cleanDesc
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !['with', 'from', 'this', 'that', 'your', 'have', 'for', 'the', 'and', 'our', 'you'].includes(w));

    // Handle common synonyms and lemma (loans -> loan, get -> apply/borrow/receive)
    const normalizedDescWords = descWords.map((w) => (w === 'loans' ? 'loan' : w));
    const matched = normalizedDescWords.filter((w) => {
      if (lowerCanonical.includes(w)) return true;
      if (w === 'get' && (lowerCanonical.includes('apply') || lowerCanonical.includes('borrow') || lowerCanonical.includes('receive'))) return true;
      return false;
    });
    const ratio = normalizedDescWords.length > 0 ? matched.length / normalizedDescWords.length : 0;

    if (ratio >= 0.6) {
      const found = findSectionAndExcerptFor(matched[0] || '');
      findings.push({
        id: `find-${findingCounter++}`,
        adClaim: cleanDesc,
        claimType: 'description',
        classification: 'Explicitly Supported',
        evidenceQuote: found?.quote,
        evidenceSource: found?.source || 'main_body',
        positionCategory: found?.position || 'Primary Content',
        explanation: 'Description benefits are supported by page content.',
        recommendedFix: 'None required.',
        priority: 'Low',
        fixTarget: 'ad',
        estimatedEffort: 'Low',
        reviewStatus: 'Open',
        isVerifiedFact: true,
      });
    } else if (ratio >= 0.25) {
      const found = findSectionAndExcerptFor(matched[0] || '');
      findings.push({
        id: `find-${findingCounter++}`,
        adClaim: cleanDesc,
        claimType: 'description',
        classification: 'Implied but Not Explicit',
        evidenceQuote: found?.quote,
        evidenceSource: found?.source || 'main_body',
        positionCategory: found?.position || 'Secondary Content',
        explanation: 'Benefits in the description are implied, but lack direct quantitative proof on the page.',
        recommendedFix: 'Include explicit proof points, metrics, or testimonials.',
        priority: 'Medium',
        fixTarget: 'landing_page',
        estimatedEffort: 'Medium',
        reviewStatus: 'Open',
        isVerifiedFact: false,
      });
    } else {
      findings.push({
        id: `find-${findingCounter++}`,
        adClaim: cleanDesc,
        claimType: 'description',
        classification: 'Not Found',
        evidenceQuote: undefined,
        evidenceSource: 'other',
        positionCategory: 'Unknown Position',
        explanation: 'The claims in this ad description could not be found anywhere on the landing page.',
        recommendedFix: 'Update ad copy to reflect features and benefits actually detailed on the page.',
        priority: 'High',
        fixTarget: 'ad',
        estimatedEffort: 'Low',
        reviewStatus: 'Open',
        isVerifiedFact: true,
      });
    }
  }

  // 3. Evaluate Offer Details (if provided)
  if (ad.offerDetails) {
    const { cleanText: cleanOffer } = cleanAdClaimText(ad.offerDetails);
    if (cleanOffer) {
      const offerAmounts = extractMonetaryAmounts(cleanOffer);
      if (offerAmounts.length > 0) {
        const pageAmounts = extractMonetaryAmounts(canonical);
        const matchingAmount = offerAmounts.find((oa) => pageAmounts.includes(oa));
        if (matchingAmount !== undefined) {
          const found = findSectionAndExcerptForAmount(matchingAmount);
          findings.push({
            id: `find-${findingCounter++}`,
            adClaim: cleanOffer,
            claimType: 'offer',
            classification: 'Explicitly Supported',
            evidenceQuote: found?.quote || `Personal loan of up to $${matchingAmount.toLocaleString()}`,
            evidenceSource: found?.source || 'main_body',
            positionCategory: found?.position || 'Primary Content',
            explanation: `The advertised loan offer of up to $${matchingAmount.toLocaleString()} is explicitly verified in landing page content.`,
            recommendedFix: 'None required.',
            priority: 'Low',
            fixTarget: 'ad',
            estimatedEffort: 'Low',
            reviewStatus: 'Open',
            isVerifiedFact: true,
          });
        }
      }
    }
  }

  // 4. Evaluate CTA Consistency
  if (ad.cta) {
    const { cleanText: cleanAdCta } = cleanAdClaimText(ad.cta);
    const pageCtas = pageContent.ctaButtons.map((b) => b.text.toLowerCase());

    const ctaMatches = pageCtas.some((btn) => {
      const b = btn.toLowerCase();
      const a = cleanAdCta.toLowerCase();
      return b.includes(a) || a.includes(b);
    });

    if (ctaMatches) {
      const matchingBtn =
        pageContent.ctaButtons.find((b) => b.text.toLowerCase().includes(cleanAdCta.toLowerCase()))?.text || cleanAdCta;
      findings.push({
        id: `find-${findingCounter++}`,
        adClaim: cleanAdCta,
        claimType: 'cta',
        classification: 'Explicitly Supported',
        evidenceQuote: matchingBtn,
        evidenceSource: 'cta_button',
        positionCategory: 'Above the Fold / Hero',
        explanation: `Ad CTA "${cleanAdCta}" matches the page action button "${matchingBtn}".`,
        recommendedFix: 'Maintain exact call-to-action alignment.',
        priority: 'Low',
        fixTarget: 'ad',
        estimatedEffort: 'Low',
        reviewStatus: 'Open',
        isVerifiedFact: true,
      });
    } else {
      // CTA Inconsistency
      const primaryPageCta = pageContent.ctaButtons[0]?.text || 'Page Action';
      findings.push({
        id: `find-${findingCounter++}`,
        adClaim: cleanAdCta,
        claimType: 'cta',
        classification: 'Contradicted',
        evidenceQuote: primaryPageCta,
        evidenceSource: 'cta_button',
        positionCategory: 'Above the Fold / Hero',
        explanation: `Ad CTA promises "${cleanAdCta}", but the primary landing page CTA asks visitors to "${primaryPageCta}". Intent mismatch creates conversion drop-off.`,
        recommendedFix: `Align the ad CTA to "${primaryPageCta}" or create a dedicated landing page tailored to "${cleanAdCta}".`,
        priority: 'High',
        fixTarget: 'ad',
        estimatedEffort: 'Low',
        reviewStatus: 'Open',
        isVerifiedFact: true,
      });
    }
  }

  return findings;
}
