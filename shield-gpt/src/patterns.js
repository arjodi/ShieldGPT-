(() => {
  "use strict";

  const LETTERS = "abcdefghijklmnopqrstuvwxyz";
  const HEX = "0123456789abcdef";
  const BASE62 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const pick = (items) => items[randomInt(0, items.length - 1)];
  const randomFrom = (alphabet, length) => Array.from({ length }, () => pick(alphabet)).join("");
  const digits = (length) => randomFrom("0123456789", length);
  const hex = (length) => randomFrom(HEX, length);
  const base62 = (length) => randomFrom(BASE62, length);
  const words = ["north", "cedar", "river", "atlas", "field", "pixel", "harbor", "stone"];

  const normalizeCard = (value) => value.replace(/[ -]/g, "");

  function luhn(value) {
    let sum = 0;
    let doubleNext = false;

    for (let i = value.length - 1; i >= 0; i -= 1) {
      let digit = Number(value[i]);
      if (doubleNext) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      doubleNext = !doubleNext;
    }

    return sum % 10 === 0;
  }

  function validCard(value) {
    const normalized = normalizeCard(value);
    return normalized.length >= 13 && normalized.length <= 19 && luhn(normalized);
  }

  function validPublicIPv4(value) {
    const parts = value.split(".").map(Number);
    if (parts.length !== 4 || parts.some((part) => Number.isNaN(part) || part < 0 || part > 255)) return false;
    const [first, second] = parts;
    if (first === 10 || first === 127 || first === 0 || first >= 224) return false;
    if (first === 172 && second >= 16 && second <= 31) return false;
    if (first === 192 && second === 168) return false;
    if (first === 169 && second === 254) return false;
    return true;
  }

  function cardCheckDigit(prefix) {
    let sum = 0;
    let doubleNext = true;
    for (let i = prefix.length - 1; i >= 0; i -= 1) {
      let digit = Number(prefix[i]);
      if (doubleNext) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      doubleNext = !doubleNext;
    }
    return String((10 - (sum % 10)) % 10);
  }

  function replacementForCard(original) {
    const prefix = `4${digits(14)}`;
    const plain = `${prefix}${cardCheckDigit(prefix)}`;
    return original.includes("-") ? plain.replace(/(.{4})/g, "$1-").slice(0, -1) : plain.replace(/(.{4})/g, "$1 ").trim();
  }

  const replacement = {
    email: () => `${pick(words)}.${pick(words)}${randomInt(10, 99)}@example.com`,
    phone: () => `+1 555 ${digits(3)} ${digits(4)}`,
    ssn: () => `${randomInt(200, 899)}-${digits(2)}-${digits(4)}`,
    iban: () => `DE${digits(2)} ${digits(4)} ${digits(4)} ${digits(4)} ${digits(4)} ${digits(2)}`,
    ipv4: () => `203.0.113.${randomInt(10, 240)}`,
    dob: () => `${randomInt(1975, 2001)}-${String(randomInt(1, 12)).padStart(2, "0")}-${String(randomInt(1, 28)).padStart(2, "0")}`,
    openai: () => `sk-proj-${base62(48)}`,
    anthropic: () => `sk-ant-api03-${base62(64)}`,
    github: () => `ghp_${base62(36)}`,
    slack: () => `xoxb-${digits(12)}-${digits(12)}-${base62(24)}`,
    stripe: () => `sk_test_${base62(24)}`,
    google: () => `AIza${base62(35)}`,
    awsAccessKey: () => `AKIA${base62(16).toUpperCase()}`,
    jwt: () => `${base62(36)}.${base62(72)}.${base62(43)}`,
    privateKey: () => "-----BEGIN PRIVATE KEY-----\nREDACTED_RANDOMIZED_KEY_MATERIAL\n-----END PRIVATE KEY-----",
    sshKey: () => `ssh-ed25519 ${base62(68)} user@example.com`,
    databaseUrl: () => `postgresql://user:${base62(20)}@db.example.com:5432/app`,
    urlCredential: () => `https://user:${base62(18)}@example.com/resource`,
    secret: () => `${pick(words)}-${base62(24)}-${hex(8)}`,
    card: replacementForCard
  };

  const detectors = [
    {
      id: "private-key",
      label: "Private key block",
      priority: 100,
      regex: /-----BEGIN (?:RSA |DSA |EC |OPENSSH |PGP )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |DSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/g,
      replacement: replacement.privateKey
    },
    {
      id: "database-url",
      label: "Database connection URL",
      priority: 95,
      regex: /\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis):\/\/[^\s"'<>]+/gi,
      replacement: replacement.databaseUrl
    },
    {
      id: "url-credential",
      label: "URL with embedded credentials",
      priority: 90,
      regex: /\bhttps?:\/\/[^\s:@\/]+:[^\s:@\/]+@[^\s"'<>]+/gi,
      replacement: replacement.urlCredential
    },
    {
      id: "openai-key",
      label: "OpenAI API key",
      priority: 85,
      regex: /\bsk-(?!ant-)(?:proj-|live-)?[A-Za-z0-9_-]{24,}\b/g,
      replacement: replacement.openai
    },
    {
      id: "anthropic-key",
      label: "Anthropic API key",
      priority: 85,
      regex: /\bsk-ant-[A-Za-z0-9_-]{24,}\b/g,
      replacement: replacement.anthropic
    },
    {
      id: "github-token",
      label: "GitHub token",
      priority: 82,
      regex: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{30,}\b/g,
      replacement: replacement.github
    },
    {
      id: "slack-token",
      label: "Slack token",
      priority: 82,
      regex: /\bxox(?:b|p|a|r|s)-[A-Za-z0-9-]{20,}\b/g,
      replacement: replacement.slack
    },
    {
      id: "stripe-key",
      label: "Stripe secret key",
      priority: 82,
      regex: /\bsk_(?:live|test)_[A-Za-z0-9]{20,}\b/g,
      replacement: replacement.stripe
    },
    {
      id: "google-api-key",
      label: "Google API key",
      priority: 80,
      regex: /\bAIza[0-9A-Za-z_-]{35}\b/g,
      replacement: replacement.google
    },
    {
      id: "aws-access-key",
      label: "AWS access key ID",
      priority: 80,
      regex: /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g,
      replacement: replacement.awsAccessKey
    },
    {
      id: "jwt",
      label: "JWT",
      priority: 78,
      regex: /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\b/g,
      replacement: replacement.jwt
    },
    {
      id: "ssh-key",
      label: "SSH public key",
      priority: 74,
      regex: /\bssh-(?:rsa|ed25519)\s+[A-Za-z0-9+/=]{40,}(?:\s+[^\n\r]+)?/g,
      replacement: replacement.sshKey
    },
    {
      id: "secret-assignment",
      label: "Secret assignment",
      priority: 70,
      regex: /\b(?:api[_-]?key|access[_-]?token|auth[_-]?token|client[_-]?secret|secret|password|passwd|pwd|private[_-]?key|database[_-]?url)\b\s*[:=]\s*(["']?)([^\s"'`,;]{8,}|[^\n\r"']{16,})\1/gi,
      valueGroup: 2,
      replacement: replacement.secret
    },
    {
      id: "credit-card",
      label: "Credit card number",
      priority: 65,
      regex: /\b(?:\d[ -]*?){13,19}\b/g,
      validate: validCard,
      replacement: replacement.card
    },
    {
      id: "ssn",
      label: "US SSN",
      priority: 62,
      regex: /\b(?!000|666|9\d\d)\d{3}[- ]?(?!00)\d{2}[- ]?(?!0000)\d{4}\b/g,
      replacement: replacement.ssn
    },
    {
      id: "iban",
      label: "IBAN",
      priority: 60,
      regex: /\b[A-Z]{2}\d{2}[ ]?(?:[A-Z0-9][ ]?){11,30}\b/g,
      replacement: replacement.iban
    },
    {
      id: "email",
      label: "Email address",
      priority: 45,
      regex: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,63}\b/gi,
      replacement: replacement.email
    },
    {
      id: "phone",
      label: "Phone number",
      priority: 42,
      regex: /(?:\+?1[\s.-]?)?(?:\([2-9]\d{2}\)|[2-9]\d{2})[\s.-]?[2-9]\d{2}[\s.-]?\d{4}\b/g,
      replacement: replacement.phone
    },
    {
      id: "date-of-birth",
      label: "Date of birth",
      priority: 40,
      regex: /\b(?:dob|d\.o\.b\.|birth\s*date|date\s*of\s*birth)\s*[:=]?\s*(\d{4}-\d{2}-\d{2}|\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b/gi,
      valueGroup: 1,
      replacement: replacement.dob
    },
    {
      id: "public-ipv4",
      label: "Public IP address",
      priority: 35,
      regex: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
      validate: validPublicIPv4,
      replacement: replacement.ipv4
    }
  ];

  function valueSpan(match, valueGroup) {
    if (!valueGroup) {
      return { start: match.index, end: match.index + match[0].length, value: match[0] };
    }

    const value = match[valueGroup];
    const relativeStart = match[0].indexOf(value);
    return {
      start: match.index + relativeStart,
      end: match.index + relativeStart + value.length,
      value
    };
  }

  function overlaps(a, b) {
    return a.start < b.end && b.start < a.end;
  }

  function mask(value) {
    const compact = value.replace(/\s+/g, " ");
    if (compact.length <= 8) return "*".repeat(compact.length);
    return `${compact.slice(0, 3)}...${compact.slice(-3)}`;
  }

  function scan(text) {
    if (!text || typeof text !== "string") return [];

    const findings = [];

    for (const detector of detectors) {
      detector.regex.lastIndex = 0;
      let match;
      while ((match = detector.regex.exec(text)) !== null) {
        const span = valueSpan(match, detector.valueGroup);
        if (span.end <= span.start) continue;
        if (detector.validate && !detector.validate(span.value)) continue;

        findings.push({
          id: `${detector.id}:${span.start}:${span.end}`,
          type: detector.id,
          label: detector.label,
          start: span.start,
          end: span.end,
          value: span.value,
          preview: mask(span.value),
          priority: detector.priority,
          replacement: detector.replacement(span.value)
        });
      }
    }

    return findings
      .sort((a, b) => b.priority - a.priority || a.start - b.start)
      .reduce((kept, item) => {
        if (!kept.some((existing) => overlaps(existing, item))) kept.push(item);
        return kept;
      }, [])
      .sort((a, b) => a.start - b.start);
  }

  function randomize(text, findings) {
    return [...findings]
      .sort((a, b) => b.start - a.start)
      .reduce((next, finding) => `${next.slice(0, finding.start)}${finding.replacement}${next.slice(finding.end)}`, text);
  }

  window.SensitiveChatGuardPatterns = Object.freeze({ scan, randomize });
})();