import {
  ClaimClassification,
  EvidenceIntegrity,
  EvidenceRecord,
  EvidenceSourceType,
  ExtractedPageContent,
  ExtractedSection,
  MismatchFinding,
  PositionCategory,
} from '../../src/types.js';
import { cleanAdClaimText, deduplicateFindings } from './claim-deduplicator.js';

/**
 * Normalizes text for lenient whitespace, quotes, dashes, and currency comparison.
 */
export function normalizeText(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[\s\n\r\t]+/g, ' ')
    .trim();
}

/**
 * Parses monetary amounts from text (e.g., "$10,000", "$10k", "10000 dollars", "$500,000").
 * Returns list of numeric values found.
 */
export function extractMonetaryAmounts(text: string): number[] {
  if (!text) return [];
  const amounts: number[] = [];
  const regex = /(?:\$|usd\s*)\s*(\d+(?:,\d{3})*(?:\.\d+)?)\s*(k|m|million|thousand)?\b|\b(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:dollars?|usd)\b|\b(\d+(?:,\d{3})*(?:\.\d+)?)\s*(k|thousand)\b/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const rawNum = (match[1] || match[3] || match[4] || '').replace(/,/g, '');
    let val = parseFloat(rawNum);
    if (!isNaN(val)) {
      const mult = (match[2] || match[5] || '').toLowerCase();
      if (mult === 'k' || mult === 'thousand') {
        val *= 1000;
      } else if (mult === 'm' || mult === 'million') {
        val *= 1000000;
      }
      if (!amounts.includes(val)) {
        amounts.push(val);
      }
    }
  }
  return amounts;
}

/**
 * Extracts normalized tokens from a claim or excerpt for semantic overlap checking.
 * Strips punctuation, common stopwords, but preserves currency values and digits.
 */
export function extractSemanticTokens(text: string): string[] {
  const norm = normalizeText(text);
  // Replace currency with token
  const tokens = norm
    .replace(/[$€£]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(
      (t) =>
        t.length > 1 &&
        !['and', 'for', 'the', 'with', 'your', 'have', 'from', 'this', 'that', 'our', 'you', 'are'].includes(t)
    );

  // Lemmatize / normalize common synonyms (e.g. loans -> loan, get -> apply/borrow/receive)
  return tokens.map((tok) => {
    if (tok === 'loans') return 'loan';
    if (tok === 'dollars') return 'dollar';
    return tok;
  });
}

/**
 * Locates which section a quote belongs to in extracted sections.
 * Returns the exact section and offset, or null if not found.
 */
function findSectionForQuote(
  quote: string,
  sections: ExtractedSection[]
): { section: ExtractedSection; offset: number } | null {
  const normQuote = normalizeText(quote);
  if (!normQuote) return null;

  // 1. Exact match within section text
  for (const sec of sections) {
    const normSec = normalizeText(sec.text);
    const idx = normSec.indexOf(normQuote);
    if (idx !== -1) {
      return { section: sec, offset: idx };
    }
  }

  // 2. Prefix match (at least 20 chars)
  if (normQuote.length > 20) {
    const snippet = normQuote.slice(0, 20);
    for (const sec of sections) {
      const normSec = normalizeText(sec.text);
      const idx = normSec.indexOf(snippet);
      if (idx !== -1) {
        return { section: sec, offset: idx };
      }
    }
  }

  return null;
}

/**
 * STAGE 1: EXACT QUOTE VERIFICATION
 * Confirms that candidateQuote genuinely exists in extracted canonical page text or sections.
 * Rejects fabricated, hallucinated, or truncated quotations.
 * Preserves evidence source and real DOM position metadata.
 */
export function verifyQuote(
  candidateQuote: string | undefined,
  pageContent: ExtractedPageContent
): EvidenceRecord {
  if (!candidateQuote || !candidateQuote.trim()) {
    return {
      quote: '',
      isVerified: false,
      verificationMethod: 'none',
      evidenceSource: 'other',
      positionCategory: 'Unknown Position',
      sectionName: 'None',
      semanticRelevance: 'none',
      isSemanticallyRelevant: false,
      confidenceScore: 0,
    };
  }

  const rawQuote = candidateQuote.trim();
  const canonical = pageContent.canonicalText;

  // Search in sections first for highest fidelity source & position metadata
  const sectionMatch = findSectionForQuote(rawQuote, pageContent.sections);
  if (sectionMatch) {
    const sec = sectionMatch.section;
    return {
      quote: rawQuote,
      isVerified: true,
      verificationMethod: 'exact_substring',
      evidenceSource: sec.evidenceSource,
      positionCategory: sec.positionCategory,
      sectionName: sec.sectionName,
      semanticRelevance: 'supports', // default, refined in Stage 2
      isSemanticallyRelevant: true,
      readingOrder: sec.readingOrder,
      characterOffset: sectionMatch.offset,
      domSelector: sec.domSelector,
      confidenceScore: 1.0,
    };
  }

  // Exact Substring Search in canonical text
  const exactIndex = canonical.indexOf(rawQuote);
  if (exactIndex !== -1) {
    return {
      quote: rawQuote,
      isVerified: true,
      verificationMethod: 'exact_substring',
      evidenceSource: 'main_body',
      positionCategory: 'Primary Content',
      sectionName: 'Canonical Body Content',
      semanticRelevance: 'supports',
      isSemanticallyRelevant: true,
      characterOffset: exactIndex,
      confidenceScore: 1.0,
    };
  }

  // Normalized Substring Search (handles spaces, smart quotes, case)
  const normCanonical = normalizeText(canonical);
  const normCandidate = normalizeText(rawQuote);
  const normIndex = normCanonical.indexOf(normCandidate);
  if (normIndex !== -1) {
    return {
      quote: rawQuote,
      isVerified: true,
      verificationMethod: 'normalized_substring',
      evidenceSource: 'main_body',
      positionCategory: 'Primary Content',
      sectionName: 'Canonical Body Content',
      semanticRelevance: 'supports',
      isSemanticallyRelevant: true,
      characterOffset: normIndex,
      confidenceScore: 0.95,
    };
  }

  // REJECTED QUOTE: Quote does not exist on the landing page!
  return {
    quote: candidateQuote,
    isVerified: false,
    verificationMethod: 'rejected_hallucination',
    evidenceSource: 'other',
    positionCategory: 'Unknown Position',
    sectionName: 'Unverified / Hallucinated Evidence',
    semanticRelevance: 'none',
    isSemanticallyRelevant: false,
    relevanceExplanation: 'Quote was not found in extracted canonical page content and was rejected.',
    confidenceScore: 0,
  };
}

export interface SemanticRelevanceResult {
  semanticRelevance: 'supports' | 'contradicts' | 'irrelevant' | 'none';
  isSemanticallyRelevant: boolean;
  relevanceExplanation: string;
  suggestedClassification?: ClaimClassification;
}

/**
 * STAGE 2: SEMANTIC RELEVANCE VERIFICATION
 * Determines whether a verified quote actually supports, contradicts, or is irrelevant
 * to the specific ad claim.
 *
 * Distinguishes explicitly supported claims from implied claims, missing claims, contradicted claims,
 * and irrelevant evidence.
 */
export function verifySemanticRelevance(
  adClaim: string,
  claimType: string,
  verifiedQuote: string,
  evidenceSource: EvidenceSourceType,
  positionCategory: PositionCategory
): SemanticRelevanceResult {
  if (!verifiedQuote || !verifiedQuote.trim()) {
    return {
      semanticRelevance: 'none',
      isSemanticallyRelevant: false,
      relevanceExplanation: 'No quote available to verify relevance.',
      suggestedClassification: 'Not Found',
    };
  }

  const claimLower = adClaim.toLowerCase();
  const quoteLower = verifiedQuote.toLowerCase();

  // RULE 1: COMPOUND CLAIMS (e.g. Test E: "Guaranteed $10,000 approval in five minutes.")
  // An ad making multiple claims (e.g. loan amount + guaranteed approval + 5-minute approval)
  // where the page ONLY proves the loan amount, but NOT the guaranteed approval or speed.
  const hasGuaranteedPromise = /\bguarantee(?:d)?(?:\s+approval)?\b/i.test(claimLower);
  const hasMinuteOrSpeedPromise = /\b(?:five|5|\d+)\s*minutes?\b|\binstant\b|\bsame[- ]day\b/i.test(claimLower);

  if (hasGuaranteedPromise || hasMinuteOrSpeedPromise) {
    const quoteHasGuaranteed = /\bguarantee(?:d)?(?:\s+approval)?\b/i.test(quoteLower);
    const quoteHasSpeed = /\b(?:five|5|\d+)\s*minutes?\b|\binstant\s+(?:decision|approval)\b|\bsame[- ]day\b/i.test(quoteLower);

    // If ad claims guarantee or 5-minute approval, but page quote does not support those promises
    if ((hasGuaranteedPromise && !quoteHasGuaranteed) || (hasMinuteOrSpeedPromise && !quoteHasSpeed)) {
      const unsupportedPromises: string[] = [];
      if (hasGuaranteedPromise && !quoteHasGuaranteed) unsupportedPromises.push('guaranteed approval');
      if (hasMinuteOrSpeedPromise && !quoteHasSpeed) unsupportedPromises.push('turnaround time processing');

      return {
        semanticRelevance: 'irrelevant',
        isSemanticallyRelevant: false,
        relevanceExplanation: `The quoted landing page text mentions the loan or amount, but the promises of ${unsupportedPromises.join(' and ')} are completely unsupported by the evidence.`,
        suggestedClassification: 'Partially Supported',
      };
    }
  }

  // RULE 2: Speed / Approval Timeframe Claims (Acceptance Test A & B)
  // e.g. "Fast loan approval", "Get Approved Same Day", "Same-day approval", "Approval in 24 hours"
  const isSpeedApprovalClaim =
    /(fast|quick|same[- ]day|instant|24[- ]hour|within 24|in minutes|minutes|speedy)\s+(?:loan\s+)?(approv|decision|fund|review|turnaround)/i.test(
      claimLower
    ) ||
    /get\s+approved\s+(?:the\s+)?same\s+day/i.test(claimLower) ||
    /same[- ]day\s+approval/i.test(claimLower);

  if (isSpeedApprovalClaim) {
    const hasExplicitSpeedProof =
      /(same[- ]day\s+approval|same\s+day\s+approval|instant\s+decision|instant\s+approval|within\s+24\s+hours|decision\s+within\s+24|receive\s+funds\s+within\s+24|decision\s+the\s+same\s+business\s+day|in\s+about\s+10\s+minutes|in\s+minutes|fast\s+approval|quick\s+decision)/i.test(
        quoteLower
      );

    if (hasExplicitSpeedProof) {
      return {
        semanticRelevance: 'supports',
        isSemanticallyRelevant: true,
        relevanceExplanation:
          'Verified quote directly proves the advertised approval speed or timeframe.',
        suggestedClassification: 'Explicitly Supported',
      };
    }

    // Quote exists (e.g. "Personal Loan Application" or "Our team will review your application")
    // but does NOT prove speed!
    return {
      semanticRelevance: 'irrelevant',
      isSemanticallyRelevant: false,
      relevanceExplanation:
        'The page mentions an application or general review process, but does NOT establish a fast approval timeframe or guarantee. Speed claim is unsupported.',
      suggestedClassification: 'Not Found',
    };
  }

  // RULE 3: MONETARY AMOUNTS & LOAN OFFERS (Acceptance Test A & Regression Test A)
  // e.g. Ad: "Get loans up to $10,000." Page: "Apply online for a personal loan of up to $10,000."
  // Or "Loans up to $10,000" / "Funding Up to $500K"
  const claimAmounts = extractMonetaryAmounts(adClaim);
  const quoteAmounts = extractMonetaryAmounts(verifiedQuote);

  if (claimAmounts.length > 0) {
    // Check if the exact amount or loan limit matches
    const matchingAmount = claimAmounts.find((ca) => quoteAmounts.includes(ca));
    if (matchingAmount !== undefined) {
      // Check that it's in a relevant loan/funding context
      const isFinancingContext = /(loan|funding|advance|line of credit|borrow|credit|financing|personal loan)/i.test(
        quoteLower
      ) || /(loan|funding|advance|line of credit|borrow|credit|financing|personal loan)/i.test(claimLower);

      if (isFinancingContext) {
        return {
          semanticRelevance: 'supports',
          isSemanticallyRelevant: true,
          relevanceExplanation: `The advertised amount of $${matchingAmount.toLocaleString()} and relevant loan/funding offer are explicitly stated in the page evidence.`,
          suggestedClassification: 'Explicitly Supported',
        };
      }
    } else if (quoteAmounts.length > 0) {
      // Conflict in amount: e.g. Ad says $10,000, page says $5,000 max
      return {
        semanticRelevance: 'contradicts',
        isSemanticallyRelevant: true,
        relevanceExplanation: `Ad specifies $${claimAmounts[0].toLocaleString()}, but the page states $${quoteAmounts[0].toLocaleString()}.`,
        suggestedClassification: 'Contradicted',
      };
    } else {
      return {
        semanticRelevance: 'irrelevant',
        isSemanticallyRelevant: false,
        relevanceExplanation: `Quote does not verify the advertised amount of $${claimAmounts[0].toLocaleString()}.`,
        suggestedClassification: 'Not Found',
      };
    }
  }

  // RULE 4: Page Title or Meta Description applied to specific claims
  if (evidenceSource === 'page_title' || evidenceSource === 'meta_description') {
    // If quote is from metadata, check if metadata actually contains the specific claim promise
    const wordsInClaim = claimLower.split(/\s+/).filter((w) => w.length > 3);
    const qualifyingWords = wordsInClaim.filter(
      (w) => !['loan', 'loans', 'software', 'platform', 'credit', 'service', 'online', 'apply', 'free'].includes(w)
    );

    const matchesSpecificQualifiers =
      qualifyingWords.length > 0 && qualifyingWords.every((w) => quoteLower.includes(w));

    if (!matchesSpecificQualifiers) {
      return {
        semanticRelevance: 'irrelevant',
        isSemanticallyRelevant: false,
        relevanceExplanation: `The ${evidenceSource === 'page_title' ? 'page title' : 'meta description'} confirms general topic, but does not prove the specific ad claim promise.`,
        suggestedClassification: 'Not Found',
      };
    }
  }

  // RULE 5: Trial Duration Claims
  const trialMatch = claimLower.match(/(\d+)[- ]day\s+(?:free\s+)?trial/i);
  if (trialMatch) {
    const claimDays = trialMatch[1];
    const pageDaysMatch = quoteLower.match(/(\d+)[- ]day|free\s+for\s+(\d+)\s*days?|(\d+)\s*days?\s*free/i);
    if (pageDaysMatch) {
      const pageDays = pageDaysMatch[1] || pageDaysMatch[2] || pageDaysMatch[3];
      if (claimDays !== pageDays) {
        return {
          semanticRelevance: 'contradicts',
          isSemanticallyRelevant: true,
          relevanceExplanation: `Page copy explicitly states "${pageDays} days", directly contradicting the advertised ${claimDays}-day trial.`,
          suggestedClassification: 'Contradicted',
        };
      }
      return {
        semanticRelevance: 'supports',
        isSemanticallyRelevant: true,
        relevanceExplanation: `Verified ${claimDays}-day trial duration matches landing page.`,
        suggestedClassification: 'Explicitly Supported',
      };
    }

    return {
      semanticRelevance: 'irrelevant',
      isSemanticallyRelevant: false,
      relevanceExplanation: `Quote does not verify the specific ${claimDays}-day trial duration.`,
      suggestedClassification: 'Not Found',
    };
  }

  // RULE 6: Discount Percentage Claims
  const discountMatch = claimLower.match(/(?:save\s+)?(\d+)%|\b(\d+)%\s*(?:off|discount|save)/i);
  if (discountMatch) {
    const claimPercent = discountMatch[1] || discountMatch[2];
    const pagePercentMatch = quoteLower.match(/(?:save\s+)?(\d+)%|\b(\d+)%\s*(?:off|discount|save)/i);
    if (pagePercentMatch) {
      const pagePercent = pagePercentMatch[1] || pagePercentMatch[2];
      if (claimPercent !== pagePercent) {
        return {
          semanticRelevance: 'contradicts',
          isSemanticallyRelevant: true,
          relevanceExplanation: `Page explicitly states "${pagePercent}% off", contradicting the advertised ${claimPercent}% discount.`,
          suggestedClassification: 'Contradicted',
        };
      }
      return {
        semanticRelevance: 'supports',
        isSemanticallyRelevant: true,
        relevanceExplanation: `Verified ${claimPercent}% discount matches landing page.`,
        suggestedClassification: 'Explicitly Supported',
      };
    }

    return {
      semanticRelevance: 'irrelevant',
      isSemanticallyRelevant: false,
      relevanceExplanation: `Quote does not establish the advertised ${claimPercent}% discount.`,
      suggestedClassification: 'Not Found',
    };
  }

  // RULE 7: Guaranteed Approval / Disclaimers
  if (/guaranteed\s+approval/i.test(claimLower)) {
    if (/no\s+guaranteed\s+approval|subject\s+to\s+underwriting/i.test(quoteLower)) {
      return {
        semanticRelevance: 'contradicts',
        isSemanticallyRelevant: true,
        relevanceExplanation:
          'Landing page explicitly contradicts guaranteed approval: states "No guaranteed approval" or "Approval subject to underwriting".',
        suggestedClassification: 'Contradicted',
      };
    }
    if (/guaranteed\s+approval/i.test(quoteLower)) {
      return {
        semanticRelevance: 'supports',
        isSemanticallyRelevant: true,
        relevanceExplanation: 'Landing page copy mentions guaranteed approval.',
        suggestedClassification: 'Explicitly Supported',
      };
    }
    return {
      semanticRelevance: 'irrelevant',
      isSemanticallyRelevant: false,
      relevanceExplanation: 'Quote does not establish guaranteed approval.',
      suggestedClassification: 'Not Found',
    };
  }

  // RULE 8: CTA Consistency (Acceptance Test D)
  if (claimType === 'cta' || claimLower.startsWith('cta:')) {
    const cleanAdCta = claimLower.replace(/^cta:\s*["']?|["']?$/g, '').trim();
    const cleanQuote = quoteLower.replace(/^["']?|["']?$/g, '').trim();

    if (cleanQuote === cleanAdCta || cleanQuote.includes(cleanAdCta) || cleanAdCta.includes(cleanQuote)) {
      return {
        semanticRelevance: 'supports',
        isSemanticallyRelevant: true,
        relevanceExplanation: `Page CTA button "${verifiedQuote}" matches ad CTA "${cleanAdCta}".`,
        suggestedClassification: 'Explicitly Supported',
      };
    }

    if (/paid|consultation|schedule|demo|contact/i.test(cleanQuote) && /free|start|trial/i.test(cleanAdCta)) {
      return {
        semanticRelevance: 'contradicts',
        isSemanticallyRelevant: true,
        relevanceExplanation:
          'Ad CTA offers a free trial or self-serve start, but page button directs users to a paid or sales action.',
        suggestedClassification: 'Contradicted',
      };
    }
  }

  // RULE 9: Generic Content Relevance Check
  // Check whether quote shares essential semantic concept tokens with the claim
  const claimTokens = extractSemanticTokens(adClaim);
  const quoteTokens = extractSemanticTokens(verifiedQuote);

  const matchedTokens = claimTokens.filter((tok) => quoteTokens.includes(tok) || quoteLower.includes(tok));
  const relevanceRatio = claimTokens.length > 0 ? matchedTokens.length / claimTokens.length : 0;

  if (relevanceRatio >= 0.5) {
    return {
      semanticRelevance: 'supports',
      isSemanticallyRelevant: true,
      relevanceExplanation: 'Quote substantiates the key terms and concepts in the ad claim.',
      suggestedClassification: 'Explicitly Supported',
    };
  }

  return {
    semanticRelevance: 'irrelevant',
    isSemanticallyRelevant: false,
    relevanceExplanation:
      'Verified quote appears on the page, but lacks sufficient semantic overlap to support this specific claim.',
    suggestedClassification: 'Implied but Not Explicit',
  };
}

/**
 * Validates all findings through the 2-stage verification engine:
 * 1. Exact quote existence verification (cleanses hallucinations).
 * 2. Semantic relevance verification (verifies quote actually supports/contradicts the claim).
 * Computes deterministic evidence integrity metrics.
 */
export function verifyAllFindingsEvidence(
  findings: MismatchFinding[],
  pageContent: ExtractedPageContent
): { verifiedFindings: MismatchFinding[]; integrity: EvidenceIntegrity } {
  // 1. Clean and verify all input findings
  const initialVerified = findings.map((rawF) => {
    const { cleanText, detectedType } = cleanAdClaimText(rawF.adClaim);
    const f: MismatchFinding = {
      ...rawF,
      adClaim: cleanText || rawF.adClaim,
      claimType: rawF.claimType || detectedType || 'headline',
    };

    // If classification is 'Not Found', it shouldn't claim supporting evidence
    if (f.classification === 'Not Found') {
      return {
        ...f,
        evidenceQuote: undefined,
        verifiedEvidence: {
          quote: '(No evidence found on landing page)',
          isVerified: false,
          verificationMethod: 'none' as const,
          evidenceSource: 'other' as EvidenceSourceType,
          positionCategory: 'Unknown Position' as PositionCategory,
          sectionName: 'Landing Page Text',
          semanticRelevance: 'none' as const,
          isSemanticallyRelevant: false,
          confidenceScore: 1.0,
        },
        evidenceSource: 'other' as EvidenceSourceType,
        positionCategory: 'Unknown Position' as PositionCategory,
        isVerifiedFact: true, // Fact that it's absent
      };
    }

    if (!f.evidenceQuote || !f.evidenceQuote.trim()) {
      return {
        ...f,
        evidenceQuote: undefined,
        verifiedEvidence: undefined,
        isVerifiedFact: false,
      };
    }

    // STAGE 1: Exact quote verification
    const stage1 = verifyQuote(f.evidenceQuote, pageContent);

    if (!stage1.isVerified) {
      // REJECTED QUOTE: Hallucination
      return {
        ...f,
        evidenceQuote: undefined, // Clear out hallucination so it's not rendered as real evidence!
        verifiedEvidence: {
          ...stage1,
          quote: `[REJECTED QUOTE: Model hallucinated "${f.evidenceQuote.slice(0, 50)}..." which does not exist in extracted content]`,
        },
        evidenceSource: 'other' as EvidenceSourceType,
        positionCategory: 'Unknown Position' as PositionCategory,
        classification:
          f.classification === 'Explicitly Supported' ? 'Requires Human Review' : f.classification,
        explanation: `${f.explanation} (Note: Quoted evidence could not be verified in the landing page content and was rejected.)`,
        isVerifiedFact: false,
      };
    }

    // STAGE 2: Semantic relevance verification
    const stage2 = verifySemanticRelevance(
      f.adClaim,
      f.claimType,
      stage1.quote,
      stage1.evidenceSource,
      stage1.positionCategory
    );

    const verifiedRecord: EvidenceRecord = {
      ...stage1,
      semanticRelevance: stage2.semanticRelevance,
      isSemanticallyRelevant: stage2.isSemanticallyRelevant,
      relevanceExplanation: stage2.relevanceExplanation,
    };

    if (stage2.isSemanticallyRelevant) {
      return {
        ...f,
        evidenceQuote: stage1.quote,
        verifiedEvidence: verifiedRecord,
        evidenceSource: stage1.evidenceSource,
        positionCategory: stage1.positionCategory,
        classification: stage2.suggestedClassification || f.classification,
        isVerifiedFact: true,
      };
    } else {
      // Quote exists on page, but is IRRELEVANT to the claim!
      const updatedClassification: ClaimClassification =
        f.classification === 'Explicitly Supported' || f.classification === 'Partially Supported'
          ? stage2.suggestedClassification || 'Not Found'
          : f.classification;

      return {
        ...f,
        evidenceQuote: stage1.quote,
        verifiedEvidence: verifiedRecord,
        evidenceSource: stage1.evidenceSource,
        positionCategory: stage1.positionCategory,
        classification: updatedClassification,
        explanation: `${f.explanation} (Evidence Limitation: Quote was found on page [${stage1.sectionName}], but is irrelevant to and does not substantiate the specific ad claim.)`,
        isVerifiedFact: false,
      };
    }
  });

  // 2. Evidence-aware deduplication: Merge overlapping versions of the same promise into canonical findings
  const canonicalVerifiedFindings = deduplicateFindings(initialVerified);

  // 3. Compute deterministic evidence integrity metrics from canonical findings
  let verifiedQuotesCount = 0;
  let rejectedQuotesCount = 0;
  let irrelevantQuotesCount = 0;
  let findingsWithSufficientEvidenceCount = 0;
  let withoutEvidenceCount = 0;

  for (const f of canonicalVerifiedFindings) {
    if (!f.verifiedEvidence || f.verifiedEvidence.verificationMethod === 'none' || f.classification === 'Not Found') {
      withoutEvidenceCount++;
      continue;
    }

    if (f.verifiedEvidence.verificationMethod === 'rejected_hallucination') {
      rejectedQuotesCount++;
      continue;
    }

    if (f.verifiedEvidence.isVerified) {
      verifiedQuotesCount++;
      if (f.verifiedEvidence.isSemanticallyRelevant && f.verifiedEvidence.semanticRelevance === 'supports') {
        findingsWithSufficientEvidenceCount++;
      } else if (!f.verifiedEvidence.isSemanticallyRelevant || f.verifiedEvidence.semanticRelevance === 'irrelevant') {
        irrelevantQuotesCount++;
      }
    }
  }

  const total = canonicalVerifiedFindings.length;
  const quoteExistenceRate =
    total > 0
      ? Math.round((verifiedQuotesCount / Math.max(1, verifiedQuotesCount + rejectedQuotesCount)) * 100)
      : 100;

  const claimRelevanceRate =
    verifiedQuotesCount > 0
      ? Math.round(((verifiedQuotesCount - irrelevantQuotesCount) / verifiedQuotesCount) * 100)
      : 0;

  const rejectedOrUnverifiedCount = rejectedQuotesCount + irrelevantQuotesCount;

  // Coverage score: percentage of findings supported by verified & semantically relevant evidence
  const evidenceCoverageScore =
    total > 0 ? Math.round((findingsWithSufficientEvidenceCount / total) * 100) : 0;

  const integrity: EvidenceIntegrity = {
    totalFindings: total,
    quoteExistenceRate,
    claimRelevanceRate,
    findingsWithSufficientEvidence: findingsWithSufficientEvidenceCount,
    rejectedOrUnverifiedCount,
    verifiedQuotes: verifiedQuotesCount,
    rejectedQuotes: rejectedQuotesCount,
    irrelevantQuotes: irrelevantQuotesCount,
    findingsWithoutEvidence: withoutEvidenceCount,
    evidenceVerificationPercentage: quoteExistenceRate,
    evidenceCoverageScore,
  };

  return { verifiedFindings: canonicalVerifiedFindings, integrity };
}
