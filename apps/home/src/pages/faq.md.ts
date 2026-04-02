import type { APIRoute } from 'astro';

import { FAQ_ITEMS } from '@/constants/faq';
import { formatLlmsLinks } from '@/constants/llms';
import { PRICING_FAQ_ITEMS } from '@/constants/pricing-page';

function buildContent(): string {
  // Deduplicate by question text — prefer the longer answer
  const seen = new Map<string, string>();

  for (const item of [...FAQ_ITEMS, ...PRICING_FAQ_ITEMS]) {
    const key = item.question.toLowerCase().trim();
    const existing = seen.get(key);
    if (!existing || item.answer.length > existing.length) {
      seen.set(key, item.answer);
    }
  }

  const productFaq: { question: string; answer: string }[] = [];
  const pricingFaq: { question: string; answer: string }[] = [];
  const addedToProduct = new Set<string>();

  // Add product-only questions first (in original order)
  for (const item of FAQ_ITEMS) {
    const key = item.question.toLowerCase().trim();
    if (!addedToProduct.has(key)) {
      productFaq.push({ question: item.question, answer: seen.get(key)! });
      addedToProduct.add(key);
    }
  }

  // Add pricing-specific questions (not already in product)
  for (const item of PRICING_FAQ_ITEMS) {
    const key = item.question.toLowerCase().trim();
    if (!addedToProduct.has(key)) {
      pricingFaq.push({ question: item.question, answer: seen.get(key)! });
    }
  }

  const formatItems = (items: { question: string; answer: string }[]) =>
    items.map((item) => `**${item.question}**\n${item.answer}`).join('\n\n');

  return `# Userplane — Frequently Asked Questions

## General

${formatItems(productFaq)}

## Pricing & Billing

${formatItems(pricingFaq)}

---

${formatLlmsLinks(['FAQ'])}`;
}

export const GET: APIRoute = () => {
  return new Response(buildContent(), {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
    },
  });
};
