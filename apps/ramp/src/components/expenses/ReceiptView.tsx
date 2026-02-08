'use client';

import { useMemo } from 'react';

import { formatCurrency, formatDate } from '@/lib/utils';

interface ReceiptViewProps {
  merchant: string;
  amount: number;
  date: string;
  description: string;
  category?: string;
}

// Deterministic pseudo-random from a string seed
function seededRandom(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  return () => {
    h = (h ^ (h >>> 16)) * 0x45d9f3b;
    h = (h ^ (h >>> 16)) * 0x45d9f3b;
    h = h ^ (h >>> 16);
    return (h >>> 0) / 0xffffffff;
  };
}

function generateLineItems(merchant: string, amount: number, rng: () => number) {
  const itemPools: Record<string, string[]> = {
    'United Airlines': ['Economy Class Ticket', 'Seat Upgrade', 'Baggage Fee', 'In-flight Meal'],
    'Delta Airlines': ['Round Trip Fare', 'Priority Boarding', 'Checked Bag', 'Wi-Fi Pass'],
    'Marriott Hotels': ['Standard Room (2 nights)', 'Room Service', 'Parking Fee', 'Mini Bar'],
    Hilton: ['Deluxe Room (3 nights)', 'Breakfast Buffet', 'Laundry Service', 'Late Checkout'],
    Uber: ['UberX - Downtown', 'Surge Pricing', 'Tolls'],
    Lyft: ['Lyft Standard', 'Airport Surcharge', 'Wait Time Fee'],
    Chipotle: ['Burrito Bowl', 'Chips & Guac', 'Fountain Drink', 'Extra Protein'],
    Sweetgreen: ['Harvest Bowl', 'Warm Quinoa', 'Lemonade'],
    'Shake Shack': ['ShackBurger', 'Cheese Fries', 'Concrete Custard', 'Shack-made Lemonade'],
    Starbucks: ['Grande Latte', 'Croissant', 'Cold Brew', 'Cake Pop'],
    'Blue Bottle Coffee': ['New Orleans Iced', 'Liege Waffle', 'Single Origin Pour Over'],
    Amazon: ['Office Chair', 'USB Hub', 'Monitor Stand', 'Cable Management Kit'],
    Staples: ['Copy Paper (5 ream)', 'Ink Cartridge', 'Sticky Notes', 'Pens (12pk)'],
    'Office Depot': ['Toner Cartridge', 'File Folders', 'Binder Clips', 'Whiteboard Markers'],
    GitHub: ['Enterprise License (Annual)', 'Copilot Business'],
    Figma: ['Professional Plan (Annual)', 'FigJam Add-on'],
    Slack: ['Pro Plan (Monthly)', 'Additional Storage'],
    Notion: ['Team Plan (Monthly)', 'API Integration'],
    Zoom: ['Business Plan (Annual)', 'Webinar Add-on', 'Cloud Recording'],
    AWS: ['EC2 Compute', 'S3 Storage', 'CloudFront CDN', 'RDS Database', 'Lambda Functions'],
    Vercel: ['Pro Plan', 'Bandwidth Overage', 'Edge Functions'],
    Udemy: ['React Masterclass', 'AWS Solutions Architect', 'TypeScript Deep Dive'],
    Coursera: ['Professional Certificate', 'Guided Project'],
    'Google Ads': ['Search Campaign', 'Display Network', 'Management Fee'],
    'Facebook Ads': ['Lead Gen Campaign', 'Retargeting', 'Creative Services'],
    Nobu: ['Omakase (x4)', 'Sake Selection', 'Dessert Platter'],
    'The Capital Grille': ['Dry-aged NY Strip', 'Lobster Mac', 'Wine Pairing', 'Dessert Trio'],
    'STK Steakhouse': ['Wagyu Filet', 'Truffle Mac & Cheese', 'Cocktails (x6)', 'Service Charge'],
    'Apple Store': ['MacBook Pro 14"', 'AppleCare+', 'USB-C Adapter'],
    'Best Buy': ['LG 27" Monitor', 'HDMI Cable', 'Surge Protector'],
    Dell: ['Latitude 5540', 'Docking Station', '3yr Warranty'],
    Logitech: ['MX Master 3S', 'MX Keys Mini', 'Desk Mat'],
    Verizon: ['Business Plan', 'Device Protection', 'International Add-on'],
    'AT&T': ['Unlimited Premium', 'Device Installment', 'Insurance'],
    Twilio: ['SMS Messages (10K)', 'Voice Minutes', 'Phone Number'],
    FedEx: ['Express Overnight', 'Packaging', 'Signature Required'],
    Costco: ['Office Snacks Bulk', 'Water Cases', 'Paper Towels', 'Coffee Pods'],
  };

  const pool = itemPools[merchant] ?? ['Service', 'Item', 'Fee', 'Tax'];
  const numItems = Math.min(pool.length, Math.floor(rng() * 3) + 2);
  const items: { name: string; price: number }[] = [];
  let remaining = amount;

  const shuffled = [...pool].sort(() => rng() - 0.5);
  for (let i = 0; i < numItems; i++) {
    const isLast = i === numItems - 1;
    const price = isLast
      ? Math.round(remaining * 100) / 100
      : Math.round(remaining * (rng() * 0.5 + 0.15) * 100) / 100;
    remaining -= price;
    items.push({ name: shuffled[i], price: Math.max(price, 0.01) });
  }

  return items;
}

export function ReceiptView({ merchant, amount, date, description, category }: ReceiptViewProps) {
  const { lineItems, receiptNo, taxRate, subtotal, tax } = useMemo(() => {
    const rng = seededRandom(`${merchant}-${amount}-${date}`);
    const items = generateLineItems(merchant, amount, rng);
    const receiptNo = Math.floor(rng() * 900000 + 100000);
    const taxRate = Math.round((rng() * 4 + 6) * 100) / 100; // 6-10% tax
    const subtotal = Math.round((amount / (1 + taxRate / 100)) * 100) / 100;
    const tax = Math.round((amount - subtotal) * 100) / 100;
    return { lineItems: items, receiptNo, taxRate, subtotal, tax };
  }, [merchant, amount, date]);

  return (
    <div className="mx-auto max-w-xs rounded-lg bg-white p-6 font-mono text-xs text-neutral-800 shadow-inner border border-neutral-200">
      {/* Header */}
      <div className="text-center mb-4">
        <p className="text-sm font-bold uppercase tracking-wider">{merchant}</p>
        <p className="text-neutral-500 mt-0.5">{category}</p>
        <p className="text-neutral-400 mt-1">Receipt #{receiptNo}</p>
      </div>

      {/* Dashed separator */}
      <div className="border-t border-dashed border-neutral-300 my-3" />

      {/* Date & description */}
      <div className="flex justify-between text-neutral-500 mb-3">
        <span>{formatDate(date, 'MM/dd/yyyy')}</span>
        <span>{formatDate(date, 'h:mm a')}</span>
      </div>

      {/* Line items */}
      <div className="space-y-1.5">
        {lineItems.map((item, i) => (
          <div key={i} className="flex justify-between gap-2">
            <span className="truncate">{item.name}</span>
            <span className="shrink-0 tabular-nums">{formatCurrency(item.price)}</span>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="border-t border-dashed border-neutral-300 my-3" />
      <div className="space-y-1">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span className="tabular-nums">{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between text-neutral-500">
          <span>Tax ({taxRate}%)</span>
          <span className="tabular-nums">{formatCurrency(tax)}</span>
        </div>
      </div>
      <div className="border-t border-neutral-300 my-2" />
      <div className="flex justify-between font-bold text-sm">
        <span>TOTAL</span>
        <span className="tabular-nums">{formatCurrency(amount)}</span>
      </div>

      {/* Footer */}
      <div className="border-t border-dashed border-neutral-300 my-3" />
      <div className="text-center text-neutral-400 space-y-0.5">
        <p className="truncate">{description}</p>
        <p className="mt-2">Thank you for your business!</p>
        {/* Barcode-like decoration */}
        <div className="flex justify-center gap-px mt-3">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="bg-neutral-800"
              style={{
                width: i % 3 === 0 ? '2px' : '1px',
                height: i % 5 === 0 ? '20px' : '14px',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
