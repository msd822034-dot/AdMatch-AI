import { AuditReport } from '../types.js';

export function exportAuditAsJson(audit: AuditReport): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(audit, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `admatch-audit-${audit.id}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function exportAuditAsCsv(audit: AuditReport): void {
  const headers = [
    'Finding ID',
    'Claim Type',
    'Ad Claim',
    'Classification',
    'Verified Evidence Quote',
    'Page Position',
    'Priority',
    'Fix Target',
    'Explanation',
    'Recommended Fix',
    'Review Status',
  ];

  const rows = audit.findings.map((f) => [
    `"${f.id}"`,
    `"${f.claimType}"`,
    `"${(f.adClaim || '').replace(/"/g, '""')}"`,
    `"${f.classification}"`,
    `"${(f.evidenceQuote || '').replace(/"/g, '""')}"`,
    `"${f.positionCategory}"`,
    `"${f.priority}"`,
    `"${f.fixTarget}"`,
    `"${(f.explanation || '').replace(/"/g, '""')}"`,
    `"${(f.recommendedFix || '').replace(/"/g, '""')}"`,
    `"${f.reviewStatus}"`,
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `admatch-findings-${audit.id}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function printAuditPdfReport(audit: AuditReport): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to view and download the PDF report.');
    return;
  }

  const findingsHtml = audit.findings
    .map(
      (f) => `
    <tr style="border-bottom: 1px solid #e2e8f0;">
      <td style="padding: 10px; font-weight: 600; color: ${f.priority === 'Critical' ? '#dc2626' : f.priority === 'High' ? '#ea580c' : '#475569'};">${f.priority}</td>
      <td style="padding: 10px;">${f.adClaim}</td>
      <td style="padding: 10px;">
        <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; background: ${
          f.classification === 'Explicitly Supported' ? '#dcfce7; color: #166534;' : f.classification === 'Contradicted' ? '#fee2e2; color: #991b1b;' : '#fef3c7; color: #92400e;'
        }">${f.classification}</span>
      </td>
      <td style="padding: 10px; font-style: italic; color: #334155;">
        ${f.evidenceQuote ? `"${f.evidenceQuote}"` : '<span style="color:#94a3b8;">None found</span>'}
      </td>
      <td style="padding: 10px; font-size: 12px; color: #64748b;">${f.positionCategory}</td>
      <td style="padding: 10px; font-size: 13px;">${f.recommendedFix}</td>
    </tr>
  `
    )
    .join('');

  const complianceHtml =
    audit.complianceRisks.length > 0
      ? `
    <div style="margin-top: 30px; border: 1px solid #fecaca; background: #fff5f5; border-radius: 8px; padding: 16px;">
      <h3 style="color: #991b1b; margin-top: 0;">Potential Compliance & Claim Risk Flags (${audit.complianceRisks.length})</h3>
      <p style="font-size: 12px; color: #7f1d1d; margin-bottom: 12px;">Notice: These flags represent marketing and regulatory risk indicators, not formal legal determinations. Recommended for human compliance review.</p>
      <ul>
        ${audit.complianceRisks
          .map(
            (c) => `<li style="margin-bottom: 8px;"><strong>${c.title}</strong> (${c.severity.toUpperCase()}): ${c.description} <br/><span style="color: #475569; font-size: 12px;">Recommended Action: ${c.recommendedComplianceAction}</span></li>`
          )
          .join('')}
      </ul>
    </div>
  `
      : '';

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Audit Report — ${audit.adInput.name}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; margin: 40px; }
          .header { border-bottom: 2px solid #0284c7; padding-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
          .score-box { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 15px 25px; text-align: center; }
          .score-num { font-size: 42px; font-weight: 800; color: ${audit.messageMatchScore >= 80 ? '#16a34a' : audit.messageMatchScore >= 50 ? '#d97706' : '#dc2626'}; }
          .metadata-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 25px 0; background: #f8fafc; padding: 15px; border-radius: 8px; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; text-align: left; }
          th { background: #f1f5f9; padding: 10px; font-weight: 600; color: #334155; }
          @media print {
            body { margin: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 20px; text-align: right;">
          <button onclick="window.print()" style="background: #0284c7; color: white; padding: 8px 18px; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Print / Save as PDF</button>
        </div>
        <div class="header">
          <div>
            <h1 style="margin: 0; font-size: 24px; color: #0f172a;">AdMatch AI — Message Match Audit Report</h1>
            <p style="margin: 5px 0 0 0; color: #64748b; font-size: 14px;">Every Ad Promise. Verified Against the Page.</p>
          </div>
          <div class="score-box">
            <div class="score-num">${audit.messageMatchScore}</div>
            <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: #0369a1;">Message Match Score / 100</div>
          </div>
        </div>

        <div class="metadata-grid">
          <div><strong>Audit Name:</strong> ${audit.adInput.name}</div>
          <div><strong>Category:</strong> ${audit.adInput.category.toUpperCase()}</div>
          <div><strong>Ad Platform:</strong> ${audit.adInput.platform.toUpperCase()}</div>
          <div><strong>Landing Page URL:</strong> ${audit.adInput.finalUrl}</div>
          <div><strong>Analysis Mode:</strong> ${audit.analysisMode === 'gemini_llm' ? 'Gemini 3.8 Flash' : 'Deterministic Grounding Baseline'}</div>
          <div><strong>Evidence Verification:</strong> ${audit.evidenceIntegrity.evidenceVerificationPercentage}% (${audit.evidenceIntegrity.verifiedQuotes} verified quotes, ${audit.evidenceIntegrity.rejectedQuotes} rejected hallucinations)</div>
        </div>

        <div style="margin: 20px 0; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px;">
          <h3 style="margin-top: 0; font-size: 16px;">Category Score Breakdown</h3>
          <div style="display: flex; gap: 20px; font-size: 13px;">
            <div>Promise Alignment (30%): <strong>${audit.categoryScores.promiseAlignment}/100</strong></div>
            <div>Offer Consistency (25%): <strong>${audit.categoryScores.offerConsistency}/100</strong></div>
            <div>Claim Support (20%): <strong>${audit.categoryScores.claimSupport}/100</strong></div>
            <div>CTA Consistency (15%): <strong>${audit.categoryScores.ctaConsistency}/100</strong></div>
            <div>Prominence (10%): <strong>${audit.categoryScores.contentProminence}/100</strong></div>
          </div>
        </div>

        <h3>Ad Copy Audited</h3>
        <p style="background: #f1f5f9; padding: 10px; border-radius: 6px; font-size: 14px; margin-top: 5px;">
          <strong>Headline(s):</strong> ${audit.adInput.headlines.join(' | ')}<br/>
          <strong>Description(s):</strong> ${audit.adInput.descriptions.join(' | ')}<br/>
          <strong>Call to Action:</strong> ${audit.adInput.cta}
        </p>

        <h3>Audit Findings & Grounded Evidence</h3>
        <table>
          <thead>
            <tr>
              <th>Priority</th>
              <th>Ad Claim</th>
              <th>Classification</th>
              <th>Verified Page Quote</th>
              <th>Position</th>
              <th>Recommended Fix</th>
            </tr>
          </thead>
          <tbody>
            ${findingsHtml}
          </tbody>
        </table>

        ${complianceHtml}

        ${
          audit.rewrittenAd
            ? `
          <div style="margin-top: 30px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px;">
            <h3 style="color: #1e40af; margin-top: 0;">Suggested Copy Rewritten (Grounded in Verified Content)</h3>
            <p><strong>Suggested Headline:</strong> ${audit.rewrittenAd.suggestedHeadlines.join(' | ')}</p>
            <p><strong>Suggested Description:</strong> ${audit.rewrittenAd.suggestedDescriptions.join(' | ')}</p>
            <p><strong>Suggested CTA:</strong> ${audit.rewrittenAd.suggestedCta}</p>
            <p style="font-size: 12px; color: #64748b; margin-bottom: 0;">Rationale: ${audit.rewrittenAd.rationale}</p>
          </div>
        `
            : ''
        }

        <footer style="margin-top: 50px; border-top: 1px solid #cbd5e1; padding-top: 15px; font-size: 11px; color: #94a3b8; text-align: center;">
          AdMatch AI Auditor • Generated ${new Date().toLocaleDateString()} • Evidence strictly verified against canonical page DOM.
        </footer>
      </body>
    </html>
  `);
  printWindow.document.close();
}
