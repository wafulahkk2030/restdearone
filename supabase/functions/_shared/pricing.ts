/**
 * Server-side mirror of src/lib/pricing.ts.
 * Any change here MUST be made in src/lib/pricing.ts too.
 */

export const PRICING_BASE_KES = 250;
export const FREE_ITEMS_PER_GROUP = 2;

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
