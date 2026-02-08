'use client';

import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCategories } from '@/hooks/useCategories';
import { useEmployees } from '@/hooks/useEmployees';
import type { Expense } from '@/lib/data/types';

// -- Fake data pools keyed by category id for realistic autofill --
const FAKE_DATA: Record<
  string,
  { merchants: string[]; descriptions: string[]; amountRange: [number, number] }
> = {
  cat_a1b2c3: {
    merchants: [
      'United Airlines',
      'Delta Airlines',
      'Marriott Hotels',
      'Hilton',
      'Uber',
      'Lyft',
      'Airbnb',
      'Hertz',
    ],
    descriptions: [
      'Flight to NYC for client meeting',
      'Hotel stay for Q4 conference',
      'Rideshare to airport',
      'Round-trip flight to SF office',
      'Hotel for onsite sprint',
      'Rental car for regional sales tour',
    ],
    amountRange: [150, 3500],
  },
  cat_d4e5f6: {
    merchants: [
      'Chipotle',
      'Sweetgreen',
      'Shake Shack',
      'Starbucks',
      'Blue Bottle Coffee',
      'DoorDash',
      'Grubhub',
    ],
    descriptions: [
      'Team lunch - sprint retro',
      'Client dinner meeting',
      'Coffee for team standup',
      'Working lunch during all-hands',
      'Catered lunch for product launch',
      'Team dinner - milestone celebration',
    ],
    amountRange: [12, 350],
  },
  cat_71g8h9: {
    merchants: ['Staples', 'Amazon', 'Office Depot', 'IKEA', 'Target', 'Muji'],
    descriptions: [
      'Printer paper and toner',
      'Desk organizer set',
      'Whiteboards and markers',
      'Standing desk converter',
      'Sticky notes and pens bulk order',
    ],
    amountRange: [15, 400],
  },
  cat_j0k1l2: {
    merchants: [
      'GitHub',
      'Figma',
      'Slack',
      'Notion',
      'Zoom',
      'AWS',
      'Vercel',
      'JetBrains',
      '1Password',
      'Linear',
    ],
    descriptions: [
      'Annual Figma license',
      'GitHub Enterprise renewal',
      'AWS monthly invoice',
      'Vercel Pro subscription',
      'JetBrains All Products Pack',
      'Notion workspace upgrade',
    ],
    amountRange: [30, 2500],
  },
  cat_m3n4o5: {
    merchants: [
      'Udemy',
      'Coursera',
      "O'Reilly Media",
      'PluralSight',
      'LinkedIn Learning',
      'Eventbrite',
    ],
    descriptions: [
      'React Advanced conference ticket',
      'Leadership workshop enrollment',
      'Online course subscription',
      'AWS certification exam',
      'TypeScript masterclass',
    ],
    amountRange: [75, 3000],
  },
  cat_p6q7r8: {
    merchants: [
      'Google Ads',
      'Facebook Ads',
      'Mailchimp',
      'HubSpot',
      'LinkedIn Ads',
      'Adobe Creative Cloud',
      'Semrush',
    ],
    descriptions: [
      'Google Ads Q3 campaign',
      'Trade show booth materials',
      'Social media ad spend',
      'LinkedIn sponsored content',
      'Annual Adobe CC license',
    ],
    amountRange: [150, 8000],
  },
  cat_s9t0u1: {
    merchants: [
      'Nobu',
      'The Capital Grille',
      'STK Steakhouse',
      'Carbone',
      'Peter Luger',
      'Balthazar',
    ],
    descriptions: [
      'Client appreciation dinner',
      'Prospect entertainment event',
      'Business dinner with partners',
      'VIP client dinner',
      'Investor dinner meeting',
    ],
    amountRange: [80, 2000],
  },
  cat_v2w3x4: {
    merchants: ['Apple Store', 'Best Buy', 'Dell', 'Logitech', 'Herman Miller', 'LG Electronics'],
    descriptions: [
      'MacBook Pro for new hire',
      'External monitor',
      'Ergonomic keyboard and mouse',
      'Standing desk',
      'Noise-canceling headphones',
    ],
    amountRange: [80, 3500],
  },
  cat_y5z6a7: {
    merchants: ['Verizon', 'AT&T', 'Twilio', 'Zoom', 'Dialpad', 'Google Workspace'],
    descriptions: [
      'Monthly phone plan',
      'Zoom Pro annual plan',
      'Google Workspace upgrade',
      'Business phone line',
      'VoIP subscription',
    ],
    amountRange: [25, 600],
  },
  cat_b8c9d0: {
    merchants: ['FedEx', 'UPS', 'Costco', 'Amazon', 'WeWork'],
    descriptions: [
      'Overnight shipping for contracts',
      'Office snacks restock',
      'Team building supplies',
      'Co-working day pass',
    ],
    amountRange: [10, 500],
  },
  cat_e1f2g3: {
    merchants: ['FedEx', 'UPS', 'DHL', 'USPS', 'ShipBob'],
    descriptions: [
      'Priority overnight package',
      'International shipment to London',
      'Return shipment from client',
      'Express document delivery',
    ],
    amountRange: [20, 800],
  },
  cat_h4i5j6: {
    merchants: ['LegalZoom', 'DocuSign', 'Ironclad', 'Cooley LLP', 'Wilson Sonsini'],
    descriptions: [
      'Contract review - vendor agreement',
      'Annual compliance audit',
      'Trademark filing',
      'DocuSign Enterprise annual',
      'Legal consultation',
    ],
    amountRange: [200, 5000],
  },
};

const FAKE_NOTES = [
  'Please process at earliest convenience.',
  'Receipt attached - original lost, this is a photo copy.',
  'Approved verbally by manager before purchase.',
  'Recurring monthly charge.',
  'One-time purchase, will not recur.',
  'Urgent - needed for upcoming deadline.',
  'Pre-approved by department head.',
  'Needed for upcoming deadline.',
  '',
  '',
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T;
}

function randomAmount(min: number, max: number): string {
  return (Math.round((Math.random() * (max - min) + min) * 100) / 100).toFixed(2);
}

function randomFutureDate(daysAhead: number): string {
  const d = new Date();
  d.setDate(d.getDate() + 1 + Math.floor(Math.random() * daysAhead));
  return d.toISOString().split('T')[0] || new Date().toISOString().split('T')[0] || '';
}

interface ExpenseFormProps {
  expense?: Expense | null;
  onSubmit: (data: Record<string, unknown>) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function ExpenseForm({ expense, onSubmit, onCancel, isSubmitting }: ExpenseFormProps) {
  const { employees } = useEmployees();
  const { categories } = useCategories();

  const [employeeId, setEmployeeId] = useState(expense?.employeeId ?? '');
  const [categoryId, setCategoryId] = useState(expense?.categoryId ?? '');
  const [amount, setAmount] = useState(expense?.amount?.toString() ?? '');
  const [description, setDescription] = useState(expense?.description ?? '');
  const [merchant, setMerchant] = useState(expense?.merchant ?? '');
  const [date, setDate] = useState<string>(() => {
    const defaultDate = new Date().toISOString().split('T')[0] || '';
    if (expense?.date) {
      const dateStr = new Date(expense.date).toISOString().split('T')[0];
      return dateStr || defaultDate;
    }
    return defaultDate;
  });
  const [notes, setNotes] = useState(expense?.notes ?? '');

  // CMD+K shortcut: populate the form with random fake data
  const fillWithFakeData = useCallback(() => {
    if (employees.length === 0 || categories.length === 0) return;

    const emp = pickRandom(employees);
    const cat = pickRandom(categories);
    const pool = FAKE_DATA[cat.id];

    setEmployeeId(emp.id);
    setCategoryId(cat.id);
    setDate(randomFutureDate(90));

    if (pool) {
      setMerchant(pickRandom(pool.merchants));
      setDescription(pickRandom(pool.descriptions));
      setAmount(randomAmount(pool.amountRange[0], pool.amountRange[1]));
    } else {
      setMerchant('Amazon');
      setDescription('General expense');
      setAmount(randomAmount(20, 500));
    }

    setNotes(pickRandom(FAKE_NOTES));
  }, [employees, categories]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey && e.key === 'k') {
        e.preventDefault();
        e.stopPropagation();
        fillWithFakeData();
      }
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [fillWithFakeData]);

  const getEmployeeName = (id: string) => {
    return employees.find((emp) => emp.id === id)?.name ?? 'Select employee';
  };

  const getCategoryName = (id: string) => {
    return categories.find((cat) => cat.id === id)?.name ?? 'Select category';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      employeeId,
      categoryId,
      amount: parseFloat(amount),
      description,
      merchant,
      date: new Date(date).toISOString(),
      notes: notes || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Employee</Label>
        <Select value={employeeId} onValueChange={(val) => setEmployeeId(val as string)} required>
          <SelectTrigger>
            <SelectValue placeholder="Select employee">
              {() => getEmployeeName(employeeId)}
            </SelectValue>
          </SelectTrigger>
          <SelectPopup>
            {employees.map((emp) => (
              <SelectItem key={emp.id} value={emp.id}>
                {emp.name}
              </SelectItem>
            ))}
          </SelectPopup>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Category</Label>
        <Select value={categoryId} onValueChange={(val) => setCategoryId(val as string)} required>
          <SelectTrigger>
            <SelectValue placeholder="Select category">
              {() => getCategoryName(categoryId)}
            </SelectValue>
          </SelectTrigger>
          <SelectPopup>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectPopup>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Amount ($)</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount((e.target as HTMLInputElement).value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Date</Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate((e.target as HTMLInputElement).value)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Merchant</Label>
        <Input
          placeholder="e.g. United Airlines"
          value={merchant}
          onChange={(e) => setMerchant((e.target as HTMLInputElement).value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Input
          placeholder="Brief description of expense"
          value={description}
          onChange={(e) => setDescription((e.target as HTMLInputElement).value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Notes (optional)</Label>
        <Textarea
          placeholder="Additional notes..."
          value={notes}
          onChange={(e) => setNotes((e.target as HTMLTextAreaElement).value)}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={
            isSubmitting || !employeeId || !categoryId || !amount || !description || !merchant
          }
        >
          {isSubmitting ? 'Saving...' : expense ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}
