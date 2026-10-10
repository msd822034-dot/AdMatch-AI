import dns from 'dns';
import { promisify } from 'util';
import { URL } from 'url';

const lookupAsync = promisify(dns.lookup);

/**
 * Checks whether an IPv4 address is in a private, loopback, or cloud metadata range.
 */
function isPrivateOrReservedIp(ip: string): boolean {
  // IPv4 check
  const parts = ip.split('.').map(Number);
  if (parts.length === 4 && parts.every((p) => !isNaN(p) && p >= 0 && p <= 255)) {
    const [a, b, c, d] = parts;
    // 127.0.0.0/8 (Loopback)
    if (a === 127) return true;
    // 0.0.0.0/8 (Current network)
    if (a === 0) return true;
    // 10.0.0.0/8 (Private)
    if (a === 10) return true;
    // 172.16.0.0/12 (Private)
    if (a === 172 && b >= 16 && b <= 31) return true;
    // 192.168.0.0/16 (Private)
    if (a === 192 && b === 168) return true;
    // 169.254.0.0/16 (Link Local & Cloud Metadata e.g. 169.254.169.254)
    if (a === 169 && b === 254) return true;
    // 100.64.0.0/10 (Carrier-grade NAT)
    if (a === 100 && b >= 64 && b <= 127) return true;
    // 192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24 (Documentation/Test)
    if (a === 192 && b === 0 && c === 2) return true;
    if (a === 198 && b === 51 && c === 100) return true;
    if (a === 203 && b === 0 && c === 113) return true;
    // 224.0.0.0/4 (Multicast)
    if (a >= 224) return true;
  }

  // IPv6 loopback and link-local checks
  const lowerIp = ip.toLowerCase();
  if (
    lowerIp === '::1' ||
    lowerIp === '::' ||
    lowerIp.startsWith('fe80:') ||
    lowerIp.startsWith('fc00:') ||
    lowerIp.startsWith('fd00:')
  ) {
    return true;
  }

  return false;
}

export interface UrlValidationResult {
  allowed: boolean;
  reason?: string;
  normalizedUrl?: string;
}

/**
 * Validates a target URL against SSRF and security constraints.
 */
export async function validateUrlForSsrf(rawUrl: string): Promise<UrlValidationResult> {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { allowed: false, reason: 'URL is missing or empty' };
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    return { allowed: false, reason: 'Malformed URL format' };
  }

  // Enforce HTTP / HTTPS only
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return {
      allowed: false,
      reason: `Blocked protocol "${parsed.protocol}". Only HTTP and HTTPS are permitted.`,
    };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Block localhost and metadata domains directly
  const blockedHostnames = [
    'localhost',
    'localhost.localdomain',
    'metadata.google.internal',
    'instance-data',
    'metadata.internal',
  ];

  if (
    blockedHostnames.includes(hostname) ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.internal') ||
    hostname.endsWith('.local')
  ) {
    return {
      allowed: false,
      reason: `Blocked host "${hostname}": Internal or loopback names are strictly restricted.`,
    };
  }

  // Check if hostname is an IP literal
  if (isPrivateOrReservedIp(hostname)) {
    return {
      allowed: false,
      reason: `Blocked IP literal "${hostname}": Private, loopback, and cloud metadata addresses are restricted.`,
    };
  }

  // Resolve DNS to verify the target IP address
  try {
    const lookup = await lookupAsync(hostname);
    if (isPrivateOrReservedIp(lookup.address)) {
      return {
        allowed: false,
        reason: `Target hostname "${hostname}" resolves to private/restricted IP ${lookup.address}. SSRF protection blocked request.`,
      };
    }
  } catch (err: any) {
    return {
      allowed: false,
      reason: `DNS lookup failed for "${hostname}": ${err.message || 'Host unresolved'}`,
    };
  }

  return { allowed: true, normalizedUrl: parsed.toString() };
}

/**
 * Safe fetcher that enforces timeout, size restrictions, content-type checks, and redirects
 */
export async function safeFetchHtml(
  url: string,
  options: { timeoutMs?: number; maxBytes?: number; maxRedirects?: number } = {}
): Promise<{ html: string; finalUrl: string }> {
  const timeoutMs = options.timeoutMs || 8000;
  const maxBytes = options.maxBytes || 5 * 1024 * 1024; // 5 MB max
  const maxRedirects = options.maxRedirects || 3;

  let currentUrl = url;
  let redirectsRemaining = maxRedirects;

  while (redirectsRemaining >= 0) {
    const validation = await validateUrlForSsrf(currentUrl);
    if (!validation.allowed) {
      throw new Error(`SSRF Security Error: ${validation.reason}`);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let res: Response;
    try {
      res = await fetch(currentUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 AdMatch-Auditor/1.0',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        redirect: 'manual', // Manual redirect control to validate each hop against SSRF!
      });
    } catch (err: any) {
      clearTimeout(timer);
      if (err.name === 'AbortError') {
        throw new Error(`Request timed out after ${timeoutMs}ms while fetching ${currentUrl}`);
      }
      throw new Error(`Network fetch failed: ${err.message}`);
    } finally {
      clearTimeout(timer);
    }

    // Handle redirects
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location');
      if (!location) {
        throw new Error(`Redirect status ${res.status} returned without a Location header.`);
      }
      currentUrl = new URL(location, currentUrl).toString();
      redirectsRemaining--;
      if (redirectsRemaining < 0) {
        throw new Error(`Exceeded maximum allowed redirects (${maxRedirects}).`);
      }
      continue;
    }

    if (!res.ok) {
      throw new Error(`HTTP Error ${res.status} ${res.statusText} fetching ${currentUrl}`);
    }

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml') && !contentType.includes('text/plain')) {
      throw new Error(`Invalid Content-Type "${contentType}". Only HTML documents are accepted.`);
    }

    const text = await res.text();
    if (text.length > maxBytes) {
      throw new Error(`Response size (${text.length} bytes) exceeds maximum limit of ${maxBytes} bytes.`);
    }

    return { html: text, finalUrl: currentUrl };
  }

  throw new Error('Too many redirects');
}
