import { AdInput, ComplianceRiskWarning, ExtractedPageContent } from '../../src/types.js';

/**
 * Analyzes ad copy and page content for regulatory and high-risk marketing claims.
 * Emphasizes that this is a risk flag for human compliance review, not a formal legal determination.
 */
export function detectComplianceRisks(
  ad: AdInput,
  pageContent?: ExtractedPageContent
): ComplianceRiskWarning[] {
  const warnings: ComplianceRiskWarning[] = [];
  const fullAdText = [
    ...ad.headlines,
    ...ad.descriptions,
    ad.cta,
    ad.offerDetails || '',
    ad.priceOrDiscount || '',
  ].join(' ');

  const pageCanonical = pageContent?.canonicalText?.toLowerCase() || '';

  // 1. Guaranteed Approval / Loan guarantees (Financial Services)
  if (
    /\b(guaranteed\s+(?:loan|approval|credit|approval\s+rate|instant\s+approval)|100%\s+approval)\b/i.test(fullAdText)
  ) {
    warnings.push({
      id: 'comp-1',
      riskType: 'guaranteed_approval',
      severity: 'high',
      title: 'Guaranteed Approval Claim in Regulated Lending',
      description:
        'Lending regulations (e.g. CFPB, FTC, FCA) strictly regulate or prohibit unconditional "guaranteed approval" statements unless all applicants without exception qualify.',
      adClaimExcerpt: fullAdText.match(/\b(guaranteed\s+(?:loan|approval|credit)|100%\s+approval)\b/i)?.[0] || 'Guaranteed approval',
      recommendedComplianceAction:
        'Verify applicant eligibility criteria, replace absolute guarantee with "Subject to credit approval", and ensure APR and licensing disclosures are present.',
    });
  }

  // 2. Guaranteed Investment Returns or "Risk-Free"
  if (
    /\b(guaranteed\s+(?:returns|profits|income|yield)|risk[- ]free\s+(?:investment|trading|crypto|wealth))\b/i.test(fullAdText)
  ) {
    warnings.push({
      id: 'comp-2',
      riskType: 'guaranteed_return',
      severity: 'high',
      title: 'Risk-Free or Guaranteed Return Financial Claim',
      description:
        'Securities and financial product marketing rules mandate that past performance does not guarantee future results and investments carry risk of loss.',
      adClaimExcerpt: fullAdText.match(/\b(guaranteed\s+(?:returns|profits|income)|risk[- ]free\s+(?:investment|trading))\b/i)?.[0] || 'Guaranteed returns',
      recommendedComplianceAction:
        'Remove "guaranteed" or "risk-free" language from financial promotions and add mandatory risk warning disclosures.',
    });
  }

  // 3. Medical or Health Guarantees
  if (
    /\b(cures\s+all|guaranteed\s+cure|100%\s+effective|miracle\s+treatment|fda\s+approved\s+treatment)\b/i.test(fullAdText)
  ) {
    warnings.push({
      id: 'comp-3',
      riskType: 'medical_health_guarantee',
      severity: 'high',
      title: 'Substantiated Health or Therapeutic Outcome Guarantee',
      description:
        'Health and wellness advertising requires competent and reliable scientific evidence. Claims to cure diseases or guarantee clinical outcomes face stringent regulatory enforcement.',
      adClaimExcerpt: fullAdText.match(/\b(cures\s+all|guaranteed\s+cure|miracle\s+treatment)\b/i)?.[0] || 'Health guarantee',
      recommendedComplianceAction:
        'Consult healthcare compliance counsel to align therapeutic representations with clinical trial data and regulatory clearances.',
    });
  }

  // 4. Misleading Discounts or Savings Without Substantiation
  if (/\b(?:save\s+up\s+to\s+\d+%|\d+%\s+off\s+everything)\b/i.test(fullAdText)) {
    const match = fullAdText.match(/\b(\d+%\s+off\s+everything|save\s+up\s+to\s+\d+%)\b/i)?.[0];
    if (pageCanonical && !pageCanonical.includes(match?.toLowerCase() || '')) {
      warnings.push({
        id: 'comp-4',
        riskType: 'misleading_discount',
        severity: 'medium',
        title: 'Discount Stated Without Page Verification',
        description:
          'Promoting a substantial promotional discount in ad creative when the landing page fails to display or apply the discount creates false advertising risk.',
        adClaimExcerpt: match || 'Discount claim',
        landingPageExcerpt: pageContent?.pricesAndDiscounts?.[0] || 'No matching promotional terms found on page',
        recommendedComplianceAction:
          'Ensure the advertised discount is visibly featured above the fold on the landing page and automatically applied in the checkout cart.',
      });
    }
  }

  // 5. Unsubstantiated Superlatives
  if (/\b(?:#1|number\s+one|world['’]?s\s+best|most\s+trusted)\b/i.test(fullAdText)) {
    const supMatch = fullAdText.match(/\b(#1|number\s+one|world['’]?s\s+best|most\s+trusted)\b/i)?.[0];
    const hasSource = /according\s+to|survey|ranked\s+by|source|award/i.test(pageCanonical);
    if (!hasSource) {
      warnings.push({
        id: 'comp-5',
        riskType: 'unsubstantiated_superlative',
        severity: 'low',
        title: 'Unsubstantiated Superlative Claim ("#1" or "Best")',
        description:
          'Objective superiority claims (e.g., "#1 rated", "World\'s Best") typically require independent third-party market research or survey citations.',
        adClaimExcerpt: supMatch || 'Superlative claim',
        recommendedComplianceAction:
          'Provide a clear footnote or citation on the landing page indicating the research entity, survey date, and methodology.',
      });
    }
  }

  // 6. Free Trial without Cancellation Terms
  if (/\b(?:free\s+trial|start\s+free)\b/i.test(fullAdText)) {
    const mentionsCardOrCancel = /(cancel\s+anytime|no\s+credit\s+card|automatic\s+renewal|recurring\s+billing|subscription)/i.test(pageCanonical);
    if (!mentionsCardOrCancel && pageCanonical.length > 200) {
      warnings.push({
        id: 'comp-6',
        riskType: 'missing_material_offer_terms',
        severity: 'medium',
        title: 'Missing Free Trial Recurring Terms & Cancellation Policy',
        description:
          'FTC Negative Option Rule and state auto-renewal statutes require transparent disclosure of trial duration, renewal pricing, and cancellation mechanisms before user signup.',
        adClaimExcerpt: 'Free trial offer',
        recommendedComplianceAction:
          'Clearly disclose whether a credit card is required, renewal pricing post-trial, and straightforward cancellation steps alongside the signup form.',
      });
    }
  }

  return warnings;
}
