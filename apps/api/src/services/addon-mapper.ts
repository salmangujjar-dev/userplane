/**
 * AddonMapper - Addon parsing, mapping, quantity math, and Dodo payload building
 *
 * Pure utility service with no external dependencies.
 * Centralizes all addon logic previously scattered across
 * WebhookProcessorService, BillingService, and EntitlementService.
 */

import { type AddonItems, billingError, SEATS_ADDON_PACK_SIZE } from '@workspace/contract';
import { getSeatsAddonIdForPlanId, isSeatsAddonId } from '@workspace/payments';
import type { AttachAddon, DodoSubscription } from '@workspace/payments/types';

export class AddonMapper {
  /**
   * Parse addon items from a raw Dodo subscription payload.
   * Filters out zero-quantity and missing-id entries.
   */
  parseFromSubscription(subscription: DodoSubscription): AddonItems {
    return (subscription.addons ?? [])
      .filter((item) => item.addon_id && item.quantity > 0)
      .map((item) => ({ addonId: item.addon_id, quantity: item.quantity }));
  }

  /**
   * Return the number of seats addon packs in the given addon list.
   */
  getSeatsPackCount(addons: AddonItems): number {
    const seatsAddon = addons.find((addon) => isSeatsAddonId(addon.addonId));
    return seatsAddon?.quantity ?? 0;
  }

  /**
   * Return the total additional seats granted by addon packs.
   * Each pack grants SEATS_ADDON_PACK_SIZE seats.
   */
  getAdditionalSeats(addons: AddonItems): number {
    return this.getSeatsPackCount(addons) * SEATS_ADDON_PACK_SIZE;
  }

  /**
   * Build the addon list for a target plan.
   *
   * Carries over non-seat addons unchanged. Remaps the seats addon to the
   * correct addon ID for the target plan's billing interval. If
   * `nextSeatsQuantity` is provided it replaces the current seats quantity.
   */
  buildForTargetPlan(
    currentAddons: AddonItems,
    targetPlanId: string,
    nextSeatsQuantity?: number
  ): AddonItems {
    const currentSeatsQuantity = this.getSeatsPackCount(currentAddons);
    const seatsQuantity = nextSeatsQuantity ?? currentSeatsQuantity;
    const nonSeatAddons = currentAddons.filter((addon) => !isSeatsAddonId(addon.addonId));

    if (seatsQuantity <= 0) {
      return nonSeatAddons;
    }

    const targetSeatsAddonId = getSeatsAddonIdForPlanId(targetPlanId);
    if (!targetSeatsAddonId) {
      throw billingError.ADDON_MAPPING_MISSING_FOR_INTERVAL();
    }

    return [
      ...nonSeatAddons,
      {
        addonId: targetSeatsAddonId,
        quantity: seatsQuantity,
      },
    ];
  }

  /**
   * Convert internal AddonItems to the Dodo API payload format.
   * Filters out zero-quantity entries.
   */
  toDodoPayload(addons: AddonItems): AttachAddon[] {
    return addons
      .filter((addon) => addon.quantity > 0)
      .map((addon) => ({
        addon_id: addon.addonId,
        quantity: addon.quantity,
      }));
  }
}
