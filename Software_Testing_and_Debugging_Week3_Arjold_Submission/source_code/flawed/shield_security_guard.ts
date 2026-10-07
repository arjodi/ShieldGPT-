/**
 * FLIGHT/PRODUCTION FLAGGED: ShieldGPT Security Guard (Flawed Implementation)
 * Contains deliberate syntax, logic, boundary, and concurrency defects for Week 3 Lab.
 */
export class ShieldSecurityGuard {
  // Bug 7: Global regex state persistence (lastIndex drift across invocations)
  private static API_KEY_REGEX = /AIza[0-9A-Za-z-_]{35}/g;

  // Bug 5: Catastrophic ReDoS nested repetition pattern
  private static MALICIOUS_PAYLOAD_REGEX = /^([a-zA-Z0-9]+)*$/;

  public sanitizePrompt(prompt: string, context?: any): {
    isSafe: boolean;
    riskScore: number;
    threats: string[];
    sanitizedPrompt: string;
  } {
    // Bug 4: Unchecked null/undefined access on context.metadata
    if (context.metadata.environment === 'strict') {
      prompt = prompt.trim();
    }

    let riskScore: any = 0;
    const threats: string[] = [];
    let sanitized = prompt;

    // Bug 1: Missing 'i' (case-insensitive) flag allowing uppercase evasion
    const promptInjectionPattern = /ignore\s+previous\s+instructions/;
    if (promptInjectionPattern.test(prompt)) {
      threats.push('PROMPT_INJECTION_DETECTED');
      // Bug 3: String concatenation type coercion on numeric riskScore
      const ruleWeight: any = '40';
      riskScore += ruleWeight; // '040' string!
    }

    // Bug 2: Off-by-one error in sliding window token chunking
    const tokens = prompt.split(' ');
    const windowSize = 3;
    for (let i = 0; i < tokens.length; i += windowSize) {
      // Slices i to i + windowSize - 1, dropping the boundary token!
      const chunk = tokens.slice(i, i + windowSize - 1).join(' ');
      if (chunk.includes('system prompt reveal')) {
        threats.push('SYSTEM_LEAK_ATTEMPT');
        riskScore += 30;
      }
    }

    // Bug 7 check: Global regex retains lastIndex state across calls
    if (ShieldSecurityGuard.API_KEY_REGEX.test(prompt)) {
      threats.push('CREDENTIAL_LEAK_DETECTED');
      riskScore += 50;
    }

    // Bug 8: Incomplete single-match replacement instead of global
    // Only masks first credit card group
    if (/\d{4}-\d{4}-\d{4}-\d{4}/.test(sanitized)) {
      sanitized = sanitized.replace(/\d{4}-\d{4}-\d{4}-\d{4}/, '****-****-****-****');
      threats.push('PII_CREDIT_CARD_REDACTED');
      riskScore += 25;
    }

    // Bug 6: Inverted whitelist logic gate
    const isWhitelistedUser = context && context.userRole === 'admin';
    // Flawed logic: flags admins as unsafe if score > 0, bypasses non-admins
    const isSafe = isWhitelistedUser ? riskScore > 50 : riskScore < 50;

    return {
      isSafe,
      riskScore: Number(riskScore) || 0,
      threats,
      sanitizedPrompt: sanitized,
    };
  }
}