import { CategoryScores, ExtractedPageContent, MismatchFinding } from '../../src/types.js';
import { deduplicateFindings } from './claim-deduplicator.js';

export interface ScoringResult {
  score: number;
  rawWeightedScore: number;
  isProvisional: boolean;
  statusText: string;
  categoryScores: CategoryScores;
  rationale: string;
}

/**
 * Deterministically computes the weighted score and formula breakdown
 * based on the 5 configured category weights:
 * Promise Alignment: 30%
 * Offer & Price: 25%
 * Claim Support: 20%
 * CTA Alignment: 15%
 * Prominence: 10%
 */
export function calculateWeightedScore(categoryScores: CategoryScores): {
  rawWeighted: number;
  roundedScore: number;
  formula: string;
} {
  const p = categoryScores.promiseAlignment * 0.30;
  const o = categoryScores.offerConsistency * 0.25;
  const c = categoryScores.claimSupport * 0.20;
  const a = categoryScores.ctaConsistency * 0.15;
  const pr = categoryScores.contentProminence * 0.10;

  const rawSum = p + o + c + a + pr;
  const rawWeighted = Number(rawSum.toFixed(1));
  const roundedScore = Math.max(0, Math.min(100, Math.round(rawWeighted)));

  const formula = `(${categoryScores.promiseAlignment} × 30%) + (${categoryScores.offerConsistency} × 25%) + (${categoryScores.claimSupport} × 20%) + (${categoryScores.ctaConsistency} × 15%) + (${categoryScores.contentProminence} × 10%) = ${rawWeighted} → ${roundedScore}`;

  return {
    rawWeighted,
    roundedScore,
    formula,
  };
}

/**
 * Calculates a deterministic message-match score from 0 to 100
 * based on canonical verified claim findings, evidence quality, semantic relevance,
 * offer consistency, CTA consistency, and position evidence using configured weights.
 */
export function calculateMessageMatchScore(
  rawFindings: MismatchFinding[],
  extractedPage?: ExtractedPageContent
): ScoringResult {
  // Guarantee scoring operates strictly on canonical, deduplicated findings
  const findings = deduplicateFindings(rawFindings);

  // If page content is missing, failed extraction, or very sparse
  if (!extractedPage || extractedPage.canonicalText.trim().length < 80 || extractedPage.extractionStatus === 'failed') {
    return {
      score: 0,
      rawWeightedScore: 0,
      isProvisional: true,
      statusText: 'Insufficient Evidence — Extraction Failed or Content Empty',
      categoryScores: {
        promiseAlignment: 0,
        offerConsistency: 0,
        claimSupport: 0,
        ctaConsistency: 0,
        contentProminence: 0,
      },
      rationale:
        'The landing page content could not be extracted or is less than 80 characters. Analysis cannot be definitively scored without page text.',
    };
  }

  if (findings.length === 0) {
    return {
      score: 100,
      rawWeightedScore: 100,
      isProvisional: false,
      statusText: 'Excellent Message Match',
      categoryScores: {
        promiseAlignment: 100,
        offerConsistency: 100,
        claimSupport: 100,
        ctaConsistency: 100,
        contentProminence: 100,
      },
      rationale: 'No mismatches or contradictions detected. All ad claims align with the landing page.',
    };
  }

  // Group findings by claim types
  const promiseFindings = findings.filter((f) => f.claimType === 'headline' || f.claimType === 'guarantee');
  const offerFindings = findings.filter((f) => f.claimType === 'offer' || f.claimType === 'price');
  const claimFindings = findings.filter((f) => f.claimType === 'description');
  const ctaFindings = findings.filter((f) => f.claimType === 'cta');

  /**
   * Deterministically scores a group of findings taking into account evidence quality and semantic relevance.
   * DOES NOT award support points based solely on quote existence!
   */
  const scoreClaimGroup = (group: MismatchFinding[]): number => {
    if (group.length === 0) return 100; // No violations in this group

    let totalPoints = 0;
    for (const item of group) {
      let claimScore = 100;
      const hasVerifiedQuote = item.verifiedEvidence?.isVerified === true;
      const isSemanticallyRelevant = item.verifiedEvidence?.isSemanticallyRelevant === true;
      const supportsClaim = item.verifiedEvidence?.semanticRelevance === 'supports';

      switch (item.classification) {
        case 'Explicitly Supported':
          if (hasVerifiedQuote && isSemanticallyRelevant && supportsClaim) {
            claimScore = 100;
          } else if (hasVerifiedQuote && !isSemanticallyRelevant) {
            // Quote exists on page, but is irrelevant to the claim (e.g. page title or review process for fast approval)
            claimScore = 35; // Severely penalized for irrelevant evidence
          } else {
            // Quote missing or hallucinated
            claimScore = 25;
          }
          break;

        case 'Partially Supported':
          if (hasVerifiedQuote && isSemanticallyRelevant) {
            claimScore = 65;
          } else {
            claimScore = 45;
          }
          break;

        case 'Implied but Not Explicit':
          claimScore = 55;
          break;

        case 'Requires Human Review':
          claimScore = 50;
          break;

        case 'Not Found':
          claimScore = item.priority === 'Critical' ? 10 : item.priority === 'High' ? 25 : 40;
          break;

        case 'Contradicted':
          claimScore = item.priority === 'Critical' ? 0 : 15;
          break;
      }
      totalPoints += claimScore;
    }

    return Math.round(totalPoints / group.length);
  };

  const promiseAlignment = scoreClaimGroup(promiseFindings);
  const offerConsistency = scoreClaimGroup(offerFindings);
  const claimSupport = scoreClaimGroup(claimFindings);
  const ctaConsistency = scoreClaimGroup(ctaFindings);

  // Content Prominence Score (10% weight)
  // Evaluates where verified, semantically relevant claims are positioned in the page DOM.
  // Claims in Hero = 100, Hero (Estimated) = 90, Primary = 85, Secondary = 65, FAQ = 50, Metadata = 40, Footer = 20
  const verifiedSupported = findings.filter(
    (f) =>
      (f.classification === 'Explicitly Supported' || f.classification === 'Partially Supported') &&
      f.verifiedEvidence?.isVerified &&
      f.verifiedEvidence?.isSemanticallyRelevant &&
      f.verifiedEvidence?.semanticRelevance === 'supports'
  );

  let contentProminence = 75;
  if (verifiedSupported.length > 0) {
    let promTotal = 0;
    for (const item of verifiedSupported) {
      switch (item.positionCategory) {
        case 'Above the Fold / Hero':
          promTotal += 100;
          break;
        case 'Above the Fold / Hero (Estimated)':
          promTotal += 90;
          break;
        case 'Primary Content':
          promTotal += 85;
          break;
        case 'Secondary Content':
          promTotal += 65;
          break;
        case 'FAQ or Supporting Content':
          promTotal += 50;
          break;
        case 'Metadata: Page Title':
        case 'Metadata: Meta Description':
          promTotal += 40; // Metadata is not rendered page body copy
          break;
        case 'Footer':
          promTotal += 20; // Heavily discounted if buried in footer
          break;
        default:
          promTotal += 45;
          break;
      }
    }
    contentProminence = Math.round(promTotal / verifiedSupported.length);
  }

  // Footer penalty: If a critical promise is ONLY found in the footer, deduct from prominence
  const footerBuriedPromises = findings.filter(
    (f) => (f.claimType === 'headline' || f.claimType === 'offer') && f.positionCategory === 'Footer'
  );
  if (footerBuriedPromises.length > 0) {
    contentProminence = Math.max(15, contentProminence - 35);
  }

  // Category scores object
  const categoryScores: CategoryScores = {
    promiseAlignment,
    offerConsistency,
    claimSupport,
    ctaConsistency,
    contentProminence,
  };

  // Weighted Total Rubric:
  // Core promise (headlines/guarantees): 30%
  // Offer/Price consistency: 25%
  // Specific claims (descriptions): 20%
  // CTA consistency: 15%
  // Content Prominence: 10%
  const { rawWeighted, roundedScore } = calculateWeightedScore(categoryScores);
  const finalScore = roundedScore;

  // Determine provisional or insufficient evidence state
  const isCoverageInadequate =
    findings.length > 0 &&
    verifiedSupported.length === 0 &&
    findings.every((f) => f.classification === 'Not Found' || f.classification === 'Requires Human Review');

  const isProvisional = isCoverageInadequate && extractedPage.canonicalText.length < 250;

  let statusText = 'Excellent Match';
  if (isProvisional) {
    statusText = 'Insufficient Evidence — Provisional Score';
  } else if (finalScore < 40) {
    statusText = 'Critical Mismatch — High Drop-off Risk';
  } else if (finalScore < 60) {
    statusText = 'Significant Discrepancies';
  } else if (finalScore < 80) {
    statusText = 'Moderate Alignment — Action Required';
  } else if (finalScore < 95) {
    statusText = 'Good Message Match with Minor Issues';
  }

  // Rationale summary
  const contradictedCount = findings.filter((f) => f.classification === 'Contradicted').length;
  const notFoundCount = findings.filter((f) => f.classification === 'Not Found').length;
  const irrelevantEvidenceCount = findings.filter(
    (f) => f.verifiedEvidence?.isVerified && !f.verifiedEvidence?.isSemanticallyRelevant
  ).length;

  const rationaleParts: string[] = [];
  if (contradictedCount > 0) {
    rationaleParts.push(`${contradictedCount} claim(s) directly contradicted by page content.`);
  }
  if (notFoundCount > 0) {
    rationaleParts.push(`${notFoundCount} promised claim(s) not found on the page.`);
  }
  if (irrelevantEvidenceCount > 0) {
    rationaleParts.push(`${irrelevantEvidenceCount} finding(s) cited quotes that failed claim semantic relevance.`);
  }
  if (footerBuriedPromises.length > 0) {
    rationaleParts.push('Key promise(s) only discovered in low-prominence footer text.');
  }
  if (rationaleParts.length === 0) {
    rationaleParts.push('All evaluated ad claims have verified supporting evidence on the landing page.');
  }

  return {
    score: finalScore,
    rawWeightedScore: rawWeighted,
    isProvisional,
    statusText,
    categoryScores,
    rationale: rationaleParts.join(' '),
  };
}
