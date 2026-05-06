/**
 * Attempts to repair truncated or malformed JSON from AI responses.
 * Handles the common case where max_tokens cuts the response mid-string.
 */
export function repairJson(raw: string): string {
  // 1. Strip markdown fences
  let s = raw
    .replace(/^```json\s*/im, "")
    .replace(/^```\s*/im, "")
    .replace(/```\s*$/im, "")
    .trim();

  // 2. Fix common AI-generated invalid values
  s = s.replace(/-?Infinity\b/g, "null");
  s = s.replace(/\bNaN\b/g, "null");
  s = s.replace(/\bfloat\(['"]-?inf['"]\)/gi, "null");
  s = s.replace(/\bundefined\b/g, "null");

  // 3. Remove JS comments
  s = s.replace(/\/\/[^\n]*/g, "");
  s = s.replace(/\/\*[\s\S]*?\*\//g, "");

  // 4. Fix trailing commas before } or ]
  s = s.replace(/,(\s*[}\]])/g, "$1");

  // 5. Try parsing as-is first
  try {
    JSON.parse(s);
    return s;
  } catch {
    // Continue to repair
  }

  // 6. Truncated JSON repair — find the deepest complete object/array
  // Strategy: walk through and track bracket depth, find last valid close
  s = repairTruncated(s);

  return s;
}

function repairTruncated(s: string): string {
  const stack: string[] = [];
  let inString = false;
  let escape = false;
  let lastValidClose = 0;

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];

    if (escape) {
      escape = false;
      continue;
    }

    if (ch === "\\" && inString) {
      escape = true;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (ch === "{" || ch === "[") {
      stack.push(ch);
    } else if (ch === "}" || ch === "]") {
      if (stack.length > 0) {
        stack.pop();
        if (stack.length === 0) {
          lastValidClose = i + 1;
        }
      }
    }
  }

  if (lastValidClose > 0 && stack.length === 0) {
    // String ended cleanly at some point — use that
    return s.slice(0, lastValidClose);
  }

  // String is truncated — close open brackets in reverse order
  // First, truncate at last complete property if we're mid-string
  let truncated = s;

  if (inString) {
    // Find last complete string by going backwards to find unescaped "
    let i = s.length - 1;
    while (i > 0) {
      if (s[i] === '"' && s[i - 1] !== "\\") {
        break;
      }
      i--;
    }
    // Back to last comma or opening bracket before this unclosed string
    const lastComma = Math.max(s.lastIndexOf(",", i - 1), s.lastIndexOf("[", i - 1), s.lastIndexOf("{", i - 1));
    if (lastComma > 0) {
      truncated = s.slice(0, lastComma);
    } else {
      truncated = s.slice(0, i - 1);
    }
  }

  // Remove trailing comma if present
  truncated = truncated.replace(/,\s*$/, "");

  // Close all open brackets
  const closing = stack
    .reverse()
    .map((b) => (b === "{" ? "}" : "]"))
    .join("");

  const repaired = truncated + closing;

  // Final validation
  try {
    JSON.parse(repaired);
    return repaired;
  } catch {
    // Last resort: try progressively shorter strings
    for (let len = truncated.length - 1; len > 100; len--) {
      const attempt = truncated.slice(0, len).replace(/,\s*$/, "") + closing;
      try {
        JSON.parse(attempt);
        return attempt;
      } catch {
        continue;
      }
    }
    return truncated + closing;
  }
}
