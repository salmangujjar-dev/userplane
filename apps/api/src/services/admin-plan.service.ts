/**
 * AdminPlanService - Business logic for admin plan management
 * Handles listing, viewing, creating, and updating DodoPayments products
 */

import type {
  AdminCreatePlanInput,
  AdminPlanProduct,
  AdminUpdatePlanInput,
} from '@workspace/contract';
import { adminError } from '@workspace/contract';
import { getSeatsAddonIdForInterval } from '@workspace/payments';
import type { DodoPayments } from '@workspace/payments/client';
import type { DodoFeatureLimits } from '@workspace/payments/metadata';
import {
  decodeMetadataValue,
  encodeFeatureGates,
  encodeFeatureLimits,
  parseFeatureGates,
  parseFeatureLimits,
} from '@workspace/payments/metadata';
import type { FeatureGate, PlanFeatureGates } from '@workspace/pricing';
import { FEATURE_GATE_KEYS, FEATURE_GATE_LABELS, RESOURCE_TYPE_VALUES } from '@workspace/pricing';

import { createLogger } from '@/api/lib/logger';

const logger = createLogger('admin-plan-service');

export interface AdminPlanServiceDeps {
  dodoClient: DodoPayments;
}

export class AdminPlanService {
  constructor(private deps: AdminPlanServiceDeps) {}

  private getRequiredSeatsAddonIdForBillingCycle(billingCycle: 'monthly' | 'annual'): string {
    const addonId = getSeatsAddonIdForInterval(billingCycle);
    if (!addonId) {
      logger.error({ billingCycle }, 'Seats add-on ID missing for billing cycle');
      throw adminError.PLAN_CREATE_FAILED();
    }
    return addonId;
  }

  /**
   * List subscription products from DodoPayments with pagination
   */
  async listPlans(params: {
    pageNumber: number;
    pageSize: number;
  }): Promise<{ products: AdminPlanProduct[]; pageNumber: number; pageSize: number }> {
    const page = await this.deps.dodoClient.products.list({
      recurring: true,
      page_number: params.pageNumber,
      page_size: params.pageSize,
    });

    const products = page.items.map((item) => this.formatListProduct(item));

    return {
      products,
      pageNumber: params.pageNumber,
      pageSize: params.pageSize,
    };
  }

  /**
   * Get a single product by ID
   */
  async getPlan(productId: string): Promise<AdminPlanProduct> {
    try {
      const product = await this.deps.dodoClient.products.retrieve(productId);
      return this.formatProduct(product);
    } catch (error) {
      logger.error({ productId, err: error }, 'Failed to retrieve plan product');
      throw adminError.PLAN_NOT_FOUND();
    }
  }

  /**
   * Create a new DodoPayments product
   */
  async createPlan(input: AdminCreatePlanInput['body']): Promise<AdminPlanProduct> {
    const metadata: Record<string, string> = {};

    if (input.featureLimits.length) {
      const limitsMap = {} as DodoFeatureLimits;
      for (const l of input.featureLimits) {
        limitsMap[l.resourceType] = {
          quotedLimit: l.quotedLimit,
          softLimit: l.softLimit,
          hardLimit: l.hardLimit,
        };
      }
      // Fill missing resource types with zeros
      for (const rt of RESOURCE_TYPE_VALUES) {
        if (!limitsMap[rt]) {
          limitsMap[rt] = { quotedLimit: 0, softLimit: 0, hardLimit: 0 };
        }
      }
      metadata.feature_limits = encodeFeatureLimits(limitsMap);
    }

    if (input.featureGates.length) {
      const gatesMap = {} as PlanFeatureGates;
      // Default all gates to false
      for (const key of FEATURE_GATE_KEYS) {
        gatesMap[key] = false;
      }
      for (const g of input.featureGates) {
        if (FEATURE_GATE_KEYS.includes(g.gate as FeatureGate)) {
          gatesMap[g.gate as FeatureGate] = g.enabled;
        }
      }
      metadata.feature_gates = encodeFeatureGates(gatesMap);
    }

    try {
      const dodoPrice = this.buildRecurringPrice(input.price);
      const seatsAddonId = this.getRequiredSeatsAddonIdForBillingCycle(input.price.billingCycle);
      const product = await this.deps.dodoClient.products.create({
        name: input.name,
        description: input.description ?? null,
        price: dodoPrice,
        addons: [seatsAddonId],
        tax_category: 'saas',
        ...(Object.keys(metadata).length > 0 ? { metadata } : {}),
      });

      return this.formatProduct(product);
    } catch (error) {
      logger.error({ err: error }, 'Failed to create plan product');
      throw adminError.PLAN_CREATE_FAILED();
    }
  }

  /**
   * Update an existing DodoPayments product
   */
  async updatePlan(
    productId: string,
    input: AdminUpdatePlanInput['body']
  ): Promise<AdminPlanProduct> {
    // Verify product exists
    let existing: DodoPayments.Product;
    try {
      existing = await this.deps.dodoClient.products.retrieve(productId);
    } catch {
      throw adminError.PLAN_NOT_FOUND();
    }

    const updateParams: DodoPayments.ProductUpdateParams = {};

    if (input.name !== undefined) {
      updateParams.name = input.name;
    }
    if (input.description !== undefined) {
      updateParams.description = input.description;
    }
    if (input.price) {
      updateParams.price = this.buildRecurringPrice(input.price);
      const seatsAddonId = this.getRequiredSeatsAddonIdForBillingCycle(input.price.billingCycle);
      updateParams.addons = [seatsAddonId];
    }

    // Handle metadata updates
    const existingMetadata = (existing.metadata ?? {}) as Record<string, string>;
    const newMetadata = { ...existingMetadata };

    if (input.featureLimits) {
      const limitsMap = {} as DodoFeatureLimits;
      for (const l of input.featureLimits) {
        limitsMap[l.resourceType] = {
          quotedLimit: l.quotedLimit,
          softLimit: l.softLimit,
          hardLimit: l.hardLimit,
        };
      }
      for (const rt of RESOURCE_TYPE_VALUES) {
        if (!limitsMap[rt]) {
          limitsMap[rt] = { quotedLimit: 0, softLimit: 0, hardLimit: 0 };
        }
      }
      newMetadata.feature_limits = encodeFeatureLimits(limitsMap);
    }

    if (input.featureGates) {
      const gatesMap = {} as PlanFeatureGates;
      for (const key of FEATURE_GATE_KEYS) {
        gatesMap[key] = false;
      }
      for (const g of input.featureGates) {
        if (FEATURE_GATE_KEYS.includes(g.gate as FeatureGate)) {
          gatesMap[g.gate as FeatureGate] = g.enabled;
        }
      }
      newMetadata.feature_gates = encodeFeatureGates(gatesMap);
    }

    if (input.featureLimits || input.featureGates) {
      updateParams.metadata = newMetadata;
    }

    try {
      await this.deps.dodoClient.products.update(productId, updateParams);
    } catch (error) {
      logger.error({ productId, err: error }, 'Failed to update plan product');
      throw adminError.PLAN_UPDATE_FAILED();
    }

    // Re-fetch to return updated data
    const updated = await this.deps.dodoClient.products.retrieve(productId);
    return this.formatProduct(updated);
  }

  /**
   * Verify a product exists in DodoPayments
   */
  async verifyProductExists(productId: string): Promise<void> {
    try {
      await this.deps.dodoClient.products.retrieve(productId);
    } catch {
      throw adminError.PLAN_NOT_FOUND();
    }
  }

  /**
   * Create a checkout session for a product and workspace
   */
  async createCheckoutSession(params: {
    productId: string;
    workspaceId: string;
    email: string;
    name: string;
    returnUrl: string;
    metadata?: Record<string, string>;
  }): Promise<string> {
    const session = await this.deps.dodoClient.checkoutSessions.create({
      product_cart: [{ product_id: params.productId, quantity: 1 }],
      metadata: {
        workspace_id: params.workspaceId,
        ...(params.metadata ?? {}),
      },
      customer: {
        email: params.email,
        name: params.name,
      },
      return_url: params.returnUrl,
      customization: {
        theme: 'light',
        show_order_details: true,
        show_on_demand_tag: false,
      },
    });

    return session.checkout_url ?? '';
  }

  /**
   * Build a DodoPayments Price object from our camelCase schema
   */
  private buildRecurringPrice(price: {
    amountCents: number;
    billingCycle: 'monthly' | 'annual';
    taxInclusive?: boolean | null;
  }): DodoPayments.Price {
    const isAnnual = price.billingCycle === 'annual';
    return {
      type: 'recurring_price',
      currency: 'USD',
      price: price.amountCents,
      discount: 0,
      purchasing_power_parity: false,
      payment_frequency_count: isAnnual ? 12 : 1,
      payment_frequency_interval: 'Month',
      subscription_period_count: isAnnual ? 12 : 1,
      subscription_period_interval: 'Month',
      tax_inclusive: price.taxInclusive ?? null,
      trial_period_days: 0,
    };
  }

  /**
   * Format a full Product (from retrieve) into AdminPlanProduct
   */
  private formatProduct(product: DodoPayments.Product): AdminPlanProduct {
    const metadata = (product.metadata ?? {}) as Record<string, string>;
    const { featureLimits, featureGates } = this.decodeMetadata(metadata);

    return {
      productId: product.product_id,
      name: product.name ?? null,
      description: product.description ?? null,
      isRecurring: product.is_recurring,
      price: this.formatPrice(product.price),
      featureLimits: featureLimits
        ? RESOURCE_TYPE_VALUES.map((rt) => ({
            resourceType: rt,
            quotedLimit: featureLimits[rt].quotedLimit,
            softLimit: featureLimits[rt].softLimit,
            hardLimit: featureLimits[rt].hardLimit,
          }))
        : null,
      featureGates: featureGates
        ? FEATURE_GATE_KEYS.map((gate) => ({
            gate,
            label: FEATURE_GATE_LABELS[gate],
            enabled: featureGates[gate],
          }))
        : null,
      hasMetadata: !!metadata.feature_limits || !!metadata.feature_gates,
      createdAt: product.created_at,
      updatedAt: product.updated_at,
    };
  }

  /**
   * Format a ProductListResponse into AdminPlanProduct
   */
  private formatListProduct(item: DodoPayments.ProductListResponse): AdminPlanProduct {
    const metadata = (item.metadata ?? {}) as Record<string, string>;
    const { featureLimits, featureGates } = this.decodeMetadata(metadata);

    const priceDetail = item.price_detail;

    return {
      productId: item.product_id,
      name: item.name ?? null,
      description: item.description ?? null,
      isRecurring: item.is_recurring,
      price: priceDetail ? this.formatPrice(priceDetail) : null,
      featureLimits: featureLimits
        ? RESOURCE_TYPE_VALUES.map((rt) => ({
            resourceType: rt,
            quotedLimit: featureLimits[rt].quotedLimit,
            softLimit: featureLimits[rt].softLimit,
            hardLimit: featureLimits[rt].hardLimit,
          }))
        : null,
      featureGates: featureGates
        ? FEATURE_GATE_KEYS.map((gate) => ({
            gate,
            label: FEATURE_GATE_LABELS[gate],
            enabled: featureGates[gate],
          }))
        : null,
      hasMetadata: !!metadata.feature_limits || !!metadata.feature_gates,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    };
  }

  /**
   * Decode metadata from a Dodo product
   */
  private decodeMetadata(metadata: Record<string, string>) {
    let featureLimits: DodoFeatureLimits | null = null;
    let featureGates: PlanFeatureGates | null = null;

    if (metadata.feature_limits) {
      try {
        featureLimits = parseFeatureLimits(decodeMetadataValue(metadata.feature_limits));
      } catch {
        // Invalid, leave as null
      }
    }

    if (metadata.feature_gates) {
      try {
        featureGates = parseFeatureGates(decodeMetadataValue(metadata.feature_gates));
      } catch {
        // Invalid, leave as null
      }
    }

    return { featureLimits, featureGates };
  }

  /**
   * Format a Dodo Price into our camelCase AdminPlanPrice
   */
  private formatPrice(price: DodoPayments.Price): AdminPlanProduct['price'] {
    if (price.type === 'one_time_price') {
      return {
        type: 'one_time_price',
        currency: price.currency,
        price: price.price,
        discount: price.discount,
        taxInclusive: price.tax_inclusive ?? null,
      };
    }

    if (price.type === 'recurring_price') {
      return {
        type: 'recurring_price',
        currency: price.currency,
        price: price.price,
        discount: price.discount,
        taxInclusive: price.tax_inclusive ?? null,
        paymentFrequencyCount: price.payment_frequency_count,
        paymentFrequencyInterval: price.payment_frequency_interval as
          | 'Day'
          | 'Week'
          | 'Month'
          | 'Year',
        subscriptionPeriodCount: price.subscription_period_count,
        subscriptionPeriodInterval: price.subscription_period_interval as
          | 'Day'
          | 'Week'
          | 'Month'
          | 'Year',
        trialPeriodDays: price.trial_period_days,
      };
    }

    // usage_based_price - return minimal info
    return null;
  }
}
