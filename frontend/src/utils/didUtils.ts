/**
 * SafeYatra Decentralized Identifier (DID) Privacy Utilities
 */

/**
 * Masks a Decentralized Identifier (DID) so that non-admin roles (Tourists, Guides, Authorities)
 * only see a privacy-preserved representation.
 * 
 * Example:
 * Input:  'did:safeyatra:polygon:0x96915ca902d95492d5d7'
 * Output: 'did:safeyatra:polygon:0x96########d7'
 */
export function maskDid(did?: string | null): string {
  if (!did || typeof did !== 'string') {
    return 'did:safeyatra:polygon:0x########';
  }

  const trimmed = did.trim();
  if (!trimmed) {
    return 'did:safeyatra:polygon:0x########';
  }

  // 1. Polygon DID with 0x prefix: did:safeyatra:polygon:0x<hex>
  const polygonMatch = trimmed.match(/^(did:safeyatra:polygon:0x)([0-9a-fA-F]{2})([0-9a-fA-F]+)([0-9a-fA-F]{2})$/i);
  if (polygonMatch) {
    const prefix = polygonMatch[1];
    const start = polygonMatch[2];
    const end = polygonMatch[4];
    return `${prefix}${start}########${end}`;
  }

  // 2. SafeYatra DID with 0x prefix: did:safeyatra:0x<hex>
  const oxMatch = trimmed.match(/^(did:safeyatra:0x)([0-9a-fA-F]{2})([0-9a-fA-F]+)([0-9a-fA-F]{2})$/i);
  if (oxMatch) {
    const prefix = oxMatch[1];
    const start = oxMatch[2];
    const end = oxMatch[4];
    return `${prefix}${start}########${end}`;
  }

  // 3. Generic 3+ segment DID: did:scheme:network:identifier
  const multiSegmentMatch = trimmed.match(/^(did:[^:]+:[^:]+:)(.{2})(.*)(.{2})$/);
  if (multiSegmentMatch) {
    const prefix = multiSegmentMatch[1];
    const start = multiSegmentMatch[2];
    const end = multiSegmentMatch[4];
    return `${prefix}${start}########${end}`;
  }

  // 4. Any generic DID format starting with did:
  if (trimmed.startsWith('did:')) {
    const parts = trimmed.split(':');
    const last = parts[parts.length - 1];
    if (last.length > 4) {
      const maskedLast = `${last.slice(0, 2)}########${last.slice(-2)}`;
      parts[parts.length - 1] = maskedLast;
      return parts.join(':');
    }
    return `${trimmed.slice(0, 8)}########${trimmed.slice(-2)}`;
  }

  // 5. Fallback for plain identifiers
  if (trimmed.length > 6) {
    return `${trimmed.slice(0, 3)}########${trimmed.slice(-2)}`;
  }

  return 'did:safeyatra:polygon:0x########';
}
