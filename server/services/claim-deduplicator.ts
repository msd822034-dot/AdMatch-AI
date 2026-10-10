import {
  ClaimClassification,
  EvidenceRecord,
  EvidenceSourceType,
  MismatchFinding,
  PositionCategory,
} from '../../src/types.js';
import { extractMonetaryAmounts } from './evidence-verifier.js';

/**
 * Cleans contaminated claim text, stripping off accidentally appended or prepended
 * source type labels (e.g., "offer", ".description", "CTA: ", "[offer]").
 * Keeps source type in a separate typed field, preserving the original ad copy accurately.
 */
export function cleanAdClaimText(text: string): {
  cleanText: string;
  detectedType?: 'headline' | 'description' | 'cta' | 'offer' | 'guarantee' | 'price';
} {
  if (!text) return { cleanText: '' };
  let s = text.trim();
  let detectedType: any = undefined;

  // 1. Strip leading prefixes like 'CTA: "..."', 'CTA: ...', 'Headline: ...', '[offer] ...'
  const prefixMatch = s.match(
    /^(?:\[?(headline|description|cta|offer|guarantee|price|metadata)\]?:\s*|"?(headline|description|cta|offer|guarantee|price|metadata):\s*)/i
  );
  if (prefixMatch) {
    const rawType = (prefixMatch[1] || prefixMatch[2]).toLowerCase();
    if (rawType !== 'metadata') {
      detectedType = rawType;
    }
    s = s.slice(prefixMatch[0].length).trim();
  }

  // 2. Strip surrounding quotes if wrapped
  if (s.startsWith('"') && s.endsWith('"') && s.length >= 2) {
    s = s.slice(1, -1).trim();
  }

  // 3. Glued suffix like "$10,000offer" or "$10,000.description"
  const gluedMatch = s.match(
    /^(.*?[0-9\.\!\?\"\'\)])(offer|description|headline|cta|metadata|guarantee|price)$/i
  );
  if (gluedMatch) {
    s = gluedMatch[1].trim();
    const t = gluedMatch[2].toLowerCase();
    if (t !== 'metadata' && !detectedType) {
      detectedType = t;
    }
  } else {
    // 4. Bracket or delimiter suffix like "Claim [offer]" or "Claim - description"
    const delimMatch = s.match(
      /^(.*?)\s*(?:\[|-|\/)\s*(offer|description|headline|cta|metadata|guarantee|price)\]?$/i
    );
    if (delimMatch) {
      s = delimMatch[1].trim();
      const t = delimMatch[2].toLowerCase();
      if (t !== 'metadata' && !detectedType) {
        detectedType = t;
      }
    }
  }

  // Final trim
  return {
    cleanText: s.trim(),
    detectedType,
  };
}

/**
 * Extracts a normalized intent signature for evidence-aware duplicate detection.
 * Distinguishes monetary offers, approval turnaround, guarantees, CTAs, and distinct claims.
 */
export function getClaimIntentSignature(finding: MismatchFinding): string {
  const claimLower = (finding.adClaim || '').toLowerCase();
  const amounts = extractMonetaryAmounts(claimLower);

  // CTA type
  if (finding.claimType === 'cta' || /^(?:apply now|sign up|start free trial|book a demo|learn more|shop now|get started)$/i.test(claimLower)) {
    const normCta = claimLower.replace(/[^a-z0-9]/g, '');
    return `intent:cta:${normCta}`;
  }

  // Independent approval speed / timeframe promise (e.g. "Get Approved Same Day", "Fast loan approval")
  const isSpeedClaim =
    /(?:fast|quick|same[- ]day|same\s+day|instant|24[- ]hour|within 24|speedy|minutes)\s+(?:loan\s+)?(?:approv|decision|fund|review|turnaround)/i.test(
      claimLower
    ) ||
    /get\s+approved\s+(?:the\s+)?same\s+day/i.test(claimLower) ||
    /fast\s+loan\s+approval/i.test(claimLower);

  if (isSpeedClaim) {
    if (claimLower.includes('same day') || claimLower.includes('same-day')) {
      return 'intent:speed:same_day';
    }
    return 'intent:speed:fast_approval';
  }

  // Guaranteed approval / underwriting claim
  if (/guaranteed\s+(?:approval|credit|loan)/i.test(claimLower) || claimLower.includes('no guaranteed approval')) {
    return 'intent:guaranteed_approval';
  }

  // Monetary loan amount offer (e.g. "Loans up to $10,000", "Get loans up to $10,000")
  if (amounts.length > 0 && /(?:loan|personal loan|funding|credit|borrow|cash)/i.test(claimLower)) {
    return `intent:loan_amount:${amounts[0]}`;
  }

  // Free trial duration (e.g. 30-day trial)
  const trialMatch = claimLower.match(/(\d+)[- ]day\s+(?:free\s+)?trial/i);
  if (trialMatch) {
    return `intent:trial_duration:${trialMatch[1]}`;
  }

  // Discount percentage (e.g. 50% off)
  const discountMatch = claimLower.match(/(\d+)%\s*(?:off|discount|save)/i);
  if (discountMatch) {
    return `intent:discount:${discountMatch[1]}`;
  }

  // Free shipping
  if (/free\s+shipping/i.test(claimLower)) {
    return 'intent:shipping:free';
  }

  // 24/7 customer support
  if (/24\/7\s+support/i.test(claimLower)) {
    return 'intent:support:24_7';
  }

  // General monetary offer
  if (amounts.length > 0) {
    return `intent:money_amount:${amounts[0]}`;
  }

  // Fallback: normalized keywords core
  const tokens = claimLower
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !['and', 'the', 'for', 'with', 'your', 'our'].includes(w))
    .sort()
    .join('_');

  return `intent:general:${tokens.slice(0, 40)}`;
}

/**
 * Compares two findings to determine if they represent overlapping versions
 * of the same ad promise (e.g., $10,000 loan amount appearing in headline and description).
 */
export function areClaimsDuplicates(
  f1: MismatchFinding,
  f2: MismatchFinding,
  sig2?: string
): boolean {
  // Never merge a loan amount promise with an independent approval-speed promise!
  const sig1 = getClaimIntentSignature(f1);
  const signature2 = sig2 || getClaimIntentSignature(f2);

  if (sig1.startsWith('intent:loan_amount:') && signature2.startsWith('intent:speed:')) {
    return false;
  }
  if (sig1.startsWith('intent:speed:') && signature2.startsWith('intent:loan_amount:')) {
    return false;
  }

  // If intent signatures match identically (e.g. both are intent:loan_amount:10000)
  if (sig1 === signature2) {
    return true;
  }

  // Check normalized claim text equivalence
  const clean1 = f1.adClaim.toLowerCase().replace(/[^a-z0-9]/g, '');
  const clean2 = f2.adClaim.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (clean1.length > 0 && clean1 === clean2) {
    return true;
  }

  return false;
}

/**
 * Position priority rank for selecting primary position and quote.
 * Higher number = higher prominence.
 */
function getPositionRank(pos: PositionCategory): number {
  switch (pos) {
    case 'Above the Fold / Hero':
      return 100;
    case 'Above the Fold / Hero (Estimated)':
      return 90;
    case 'Primary Content':
      return 80;
    case 'Secondary Content':
      return 60;
    case 'FAQ or Supporting Content':
      return 40;
    case 'Metadata: Page Title':
    case 'Metadata: Meta Description':
      return 30;
    case 'Footer':
      return 20;
    default:
      return 10;
  }
}

/**
 * Classification strength rank.
 * Higher number = more definitive verification.
 */
function getClassificationRank(cls: ClaimClassification): number {
  switch (cls) {
    case 'Explicitly Supported':
      return 100;
    case 'Contradicted':
      return 90;
    case 'Partially Supported':
      return 70;
    case 'Implied but Not Explicit':
      return 50;
    case 'Not Found':
      return 40;
    default:
      return 20;
  }
}

/**
 * Merges a duplicate finding into the canonical primary finding,
 * retaining all evidence sources as multiple evidence references.
 */
export function mergeFindings(primary: MismatchFinding, duplicate: MismatchFinding): void {
  // Ensure primary has an initialized evidenceReferences array
  if (!primary.evidenceReferences || primary.evidenceReferences.length === 0) {
    primary.evidenceReferences = [];
    if (primary.verifiedEvidence) {
      primary.evidenceReferences.push(primary.verifiedEvidence);
    }
  }

  // Gather evidence references from duplicate
  const duplicateRefs: EvidenceRecord[] = [];
  if (duplicate.evidenceReferences && duplicate.evidenceReferences.length > 0) {
    duplicateRefs.push(...duplicate.evidenceReferences);
  } else if (duplicate.verifiedEvidence) {
    duplicateRefs.push(duplicate.verifiedEvidence);
  }

  for (const ref of duplicateRefs) {
    const isAlreadyPresent = primary.evidenceReferences.some(
      (existing) =>
        existing.quote.trim().toLowerCase() === ref.quote.trim().toLowerCase() &&
        existing.evidenceSource === ref.evidenceSource
    );
    if (!isAlreadyPresent) {
      primary.evidenceReferences.push(ref);
    }
  }

  // Upgrade classification if duplicate has stronger verified evidence
  const primaryClassRank = getClassificationRank(primary.classification);
  const dupClassRank = getClassificationRank(duplicate.classification);
  if (dupClassRank > primaryClassRank) {
    primary.classification = duplicate.classification;
  }

  // Upgrade position / primary quote if duplicate has higher prominence
  const primaryPosRank = getPositionRank(primary.positionCategory);
  const dupPosRank = getPositionRank(duplicate.positionCategory);
  if (dupPosRank > primaryPosRank && duplicate.verifiedEvidence) {
    primary.positionCategory = duplicate.positionCategory;
    primary.evidenceQuote = duplicate.evidenceQuote || primary.evidenceQuote;
    primary.evidenceSource = duplicate.evidenceSource || primary.evidenceSource;
    primary.verifiedEvidence = duplicate.verifiedEvidence;
  }

  // If primary had no evidenceQuote but duplicate has verified evidence
  if ((!primary.evidenceQuote || primary.evidenceQuote.trim().length === 0) && duplicate.evidenceQuote) {
    primary.evidenceQuote = duplicate.evidenceQuote;
    primary.evidenceSource = duplicate.evidenceSource;
    primary.positionCategory = duplicate.positionCategory;
    primary.verifiedEvidence = duplicate.verifiedEvidence;
  }

  // Append explanation details if corroborating evidence references found
  if (primary.evidenceReferences.length > 1 && !primary.explanation.includes('Multiple corroborating evidence references')) {
    primary.explanation = `${primary.explanation} (Verified across ${primary.evidenceReferences.length} page evidence references: ${primary.evidenceReferences.map((r) => r.sectionName || r.evidenceSource).join(', ')}).`;
  }
}

/**
 * Deduplicates a list of findings, returning canonical findings with multiple evidence references.
 * Operates deterministically and preserves distinct claims.
 */
export function deduplicateFindings(findings: MismatchFinding[]): MismatchFinding[] {
  if (!findings || findings.length === 0) return [];

  const canonical: MismatchFinding[] = [];

  for (const rawFinding of findings) {
    // 1. Clean claim text from contamination
    const { cleanText, detectedType } = cleanAdClaimText(rawFinding.adClaim);
    const finding: MismatchFinding = {
      ...rawFinding,
      adClaim: cleanText || rawFinding.adClaim,
      claimType: rawFinding.claimType || detectedType || 'headline',
    };

    // Ensure initial evidence references
    if (!finding.evidenceReferences || finding.evidenceReferences.length === 0) {
      finding.evidenceReferences = [];
      if (finding.verifiedEvidence) {
        finding.evidenceReferences.push(finding.verifiedEvidence);
      }
    }

    const sig = getClaimIntentSignature(finding);

    // Check if an existing canonical finding matches this promise
    const matchIdx = canonical.findIndex((item) => areClaimsDuplicates(item, finding, sig));

    if (matchIdx === -1) {
      canonical.push(finding);
    } else {
      mergeFindings(canonical[matchIdx], finding);
    }
  }

  return canonical;
}
