/**
 * Single source of truth for pricing rules on the client.
 * The server mirrors these rules in supabase/functions/_shared/pricing.ts.
 * Any change here MUST be made there too.
 */

export const PRICING_BASE_KES = 250;
export const FREE_ITEMS_PER_GROUP = 2; // 2 free, then 1 paid

/**
 * Escalating fee pattern for memorials and stories:
 * positions 0,1 in each group of 3 are free; position 2 is paid.
 * Price grows by PRICING_BASE_KES each completed group: 250, 500, 750...
 */
export function escalatingFee(alreadyCreated: number) {
  const positionInGroup = alreadyCreated % 3;
  const groupNumber = Math.floor(alreadyCreated / 3);
  const amount = PRICING_BASE_KES + groupNumber * PRICING_BASE_KES;
  const required = positionInGroup === 2;
  return {
    required,
    amount,
    freeRemaining: required ? 0 : FREE_ITEMS_PER_GROUP - positionInGroup,
  };
}

export const MEMORIAL_ACTIVATION_KES = 100;
export const COMMUNITY_MONTHLY_KES = 500;
export const COMMUNITY_YEARLY_KES = 5000;
