import type { Category, Employee, Expense } from './types';

export const employees: Employee[] = [
  // Engineering (20)
  {
    id: 'emp_4f8a2c',
    name: 'Sarah Chen',
    email: 'sarah.chen@spense.io',
    position: 'Senior Engineer',
    department: 'Engineering',
  },
  {
    id: 'emp_e1f05b',
    name: 'James Wilson',
    email: 'james.w@spense.io',
    position: 'DevOps Lead',
    department: 'Engineering',
  },
  {
    id: 'emp_d53f72',
    name: 'David Kim',
    email: 'david.k@spense.io',
    position: 'Product Designer',
    department: 'Engineering',
  },
  {
    id: 'emp_f29c86',
    name: 'Fatima Al-Hassan',
    email: 'fatima.a@spense.io',
    position: 'Frontend Engineer',
    department: 'Engineering',
  },
  {
    id: 'emp_19bf47',
    name: 'Olivia Martin',
    email: 'olivia.m@spense.io',
    position: 'Data Engineer',
    department: 'Engineering',
  },
  {
    id: 'emp_7c83f1',
    name: 'Mei-Ling Huang',
    email: 'meiling.h@spense.io',
    position: 'UX Researcher',
    department: 'Engineering',
  },
  {
    id: 'emp_d91b3c',
    name: 'Kevin Nakamura',
    email: 'kevin.n@spense.io',
    position: 'QA Engineer',
    department: 'Engineering',
  },
  {
    id: 'emp_f6c920',
    name: 'Jordan Rivera',
    email: 'jordan.r@spense.io',
    position: 'Security Engineer',
    department: 'Engineering',
  },
  {
    id: 'emp_a3e7c1',
    name: 'Tanya Ivanova',
    email: 'tanya.i@spense.io',
    position: 'Backend Engineer',
    department: 'Engineering',
  },
  {
    id: 'emp_c82d6f',
    name: 'Raj Krishnan',
    email: 'raj.k@spense.io',
    position: 'Staff Engineer',
    department: 'Engineering',
  },
  {
    id: 'emp_2f41b8',
    name: 'Sophie Dubois',
    email: 'sophie.d@spense.io',
    position: 'Mobile Engineer',
    department: 'Engineering',
  },
  {
    id: 'emp_71ea3d',
    name: 'Yusuf Osman',
    email: 'yusuf.o@spense.io',
    position: 'Platform Engineer',
    department: 'Engineering',
  },
  {
    id: 'emp_b94f20',
    name: 'Emily Tran',
    email: 'emily.t@spense.io',
    position: 'Engineering Manager',
    department: 'Engineering',
  },
  {
    id: 'emp_5d3ca7',
    name: 'Andrei Volkov',
    email: 'andrei.v@spense.io',
    position: 'Site Reliability Engineer',
    department: 'Engineering',
  },
  {
    id: 'emp_e08b64',
    name: 'Grace Okafor',
    email: 'grace.o@spense.io',
    position: 'Data Scientist',
    department: 'Engineering',
  },
  {
    id: 'emp_1c6f93',
    name: 'Liam Gallagher',
    email: 'liam.g@spense.io',
    position: 'Infrastructure Engineer',
    department: 'Engineering',
  },
  {
    id: 'emp_84d2e5',
    name: 'Aiko Tanaka',
    email: 'aiko.t@spense.io',
    position: 'ML Engineer',
    department: 'Engineering',
  },
  {
    id: 'emp_3bf9a1',
    name: 'Victor Mensah',
    email: 'victor.m@spense.io',
    position: 'VP of Engineering',
    department: 'Engineering',
  },
  {
    id: 'emp_f7a046',
    name: 'Natalia Petrova',
    email: 'natalia.p@spense.io',
    position: 'Design Systems Lead',
    department: 'Engineering',
  },
  {
    id: 'emp_6e1d8b',
    name: 'Omar Farouk',
    email: 'omar.f@spense.io',
    position: 'Fullstack Engineer',
    department: 'Engineering',
  },

  // Sales (14)
  {
    id: 'emp_b7d31e',
    name: 'Marcus Johnson',
    email: 'marcus.j@spense.io',
    position: 'Sales Director',
    department: 'Sales',
  },
  {
    id: 'emp_6ad8c3',
    name: 'Elena Rodriguez',
    email: 'elena.r@spense.io',
    position: 'Account Executive',
    department: 'Sales',
  },
  {
    id: 'emp_7d1ea4',
    name: 'Carlos Mendez',
    email: 'carlos.m@spense.io',
    position: 'Sales Representative',
    department: 'Sales',
  },
  {
    id: 'emp_e6a2d0',
    name: 'Samuel Wright',
    email: 'samuel.w@spense.io',
    position: 'VP of Sales',
    department: 'Sales',
  },
  {
    id: 'emp_8ea417',
    name: 'Chris Okonkwo',
    email: 'chris.o@spense.io',
    position: 'Customer Success Manager',
    department: 'Sales',
  },
  {
    id: 'emp_d4f8b2',
    name: 'Amanda Foster',
    email: 'amanda.f@spense.io',
    position: 'Enterprise Account Executive',
    department: 'Sales',
  },
  {
    id: 'emp_91c3e7',
    name: 'Derek Chang',
    email: 'derek.c@spense.io',
    position: 'Sales Development Rep',
    department: 'Sales',
  },
  {
    id: 'emp_a6b0d5',
    name: 'Isabelle Moreau',
    email: 'isabelle.m@spense.io',
    position: 'Solutions Engineer',
    department: 'Sales',
  },
  {
    id: 'emp_48ef1c',
    name: 'Brian Callahan',
    email: 'brian.c@spense.io',
    position: 'Regional Sales Manager',
    department: 'Sales',
  },
  {
    id: 'emp_c25a8f',
    name: 'Deepa Sharma',
    email: 'deepa.s@spense.io',
    position: 'Sales Operations Analyst',
    department: 'Sales',
  },
  {
    id: 'emp_73d9b4',
    name: 'Nate Sullivan',
    email: 'nate.s@spense.io',
    position: 'Partnership Manager',
    department: 'Sales',
  },
  {
    id: 'emp_0ea7c6',
    name: 'Yuki Sato',
    email: 'yuki.s@spense.io',
    position: 'Account Manager',
    department: 'Sales',
  },
  {
    id: 'emp_b58d31',
    name: 'Monica Reyes',
    email: 'monica.r@spense.io',
    position: 'Sales Enablement Lead',
    department: 'Sales',
  },
  {
    id: 'emp_1f4e9a',
    name: 'Kwame Asante',
    email: 'kwame.a@spense.io',
    position: 'Business Development Rep',
    department: 'Sales',
  },

  // Marketing (12)
  {
    id: 'emp_92c4a1',
    name: 'Priya Patel',
    email: 'priya.p@spense.io',
    position: 'Marketing Manager',
    department: 'Marketing',
  },
  {
    id: 'emp_1b9e4d',
    name: 'Aisha Mohammed',
    email: 'aisha.m@spense.io',
    position: 'Content Strategist',
    department: 'Marketing',
  },
  {
    id: 'emp_0b5f38',
    name: 'Nina Petrov',
    email: 'nina.p@spense.io',
    position: 'Brand Manager',
    department: 'Marketing',
  },
  {
    id: 'emp_05cf6a',
    name: 'Lauren Mitchell',
    email: 'lauren.m@spense.io',
    position: 'Growth Marketing Lead',
    department: 'Marketing',
  },
  {
    id: 'emp_2d8fc5',
    name: 'Tomás Herrera',
    email: 'tomas.h@spense.io',
    position: 'SEO Specialist',
    department: 'Marketing',
  },
  {
    id: 'emp_a91e47',
    name: 'Chloe Bennett',
    email: 'chloe.b@spense.io',
    position: 'Social Media Manager',
    department: 'Marketing',
  },
  {
    id: 'emp_64cb3e',
    name: 'Felix Andersen',
    email: 'felix.a@spense.io',
    position: 'Product Marketing Manager',
    department: 'Marketing',
  },
  {
    id: 'emp_d7f280',
    name: 'Zara Ibrahim',
    email: 'zara.i@spense.io',
    position: 'VP of Marketing',
    department: 'Marketing',
  },
  {
    id: 'emp_8b3a6d',
    name: 'Jake Morrison',
    email: 'jake.m@spense.io',
    position: 'Demand Gen Manager',
    department: 'Marketing',
  },
  {
    id: 'emp_f1e5c9',
    name: 'Rina Watanabe',
    email: 'rina.w@spense.io',
    position: 'Event Coordinator',
    department: 'Marketing',
  },
  {
    id: 'emp_35d2a0',
    name: 'Andre Williams',
    email: 'andre.w@spense.io',
    position: 'Copywriter',
    department: 'Marketing',
  },
  {
    id: 'emp_c6a9f4',
    name: 'Lena Schmidt',
    email: 'lena.s@spense.io',
    position: 'Marketing Analyst',
    department: 'Marketing',
  },

  // Finance (9)
  {
    id: 'emp_3e7b91',
    name: 'Lisa Zhang',
    email: 'lisa.z@spense.io',
    position: 'Financial Analyst',
    department: 'Finance',
  },
  {
    id: 'emp_5a3c9e',
    name: 'Jennifer Lee',
    email: 'jennifer.l@spense.io',
    position: 'Controller',
    department: 'Finance',
  },
  {
    id: 'emp_b0d594',
    name: 'Daniel Foster',
    email: 'daniel.f@spense.io',
    position: 'Payroll Specialist',
    department: 'Finance',
  },
  {
    id: 'emp_47bc8e',
    name: 'Michael Torres',
    email: 'michael.t@spense.io',
    position: 'CFO',
    department: 'Finance',
  },
  {
    id: 'emp_9d2f51',
    name: 'Sandra Wu',
    email: 'sandra.w@spense.io',
    position: 'Accounts Payable',
    department: 'Finance',
  },
  {
    id: 'emp_e3a0c7',
    name: 'Patrick Brennan',
    email: 'patrick.b@spense.io',
    position: 'Tax Accountant',
    department: 'Finance',
  },
  {
    id: 'emp_6f8d24',
    name: 'Amara Diallo',
    email: 'amara.d@spense.io',
    position: 'Revenue Analyst',
    department: 'Finance',
  },
  {
    id: 'emp_b17e43',
    name: 'Gregory Park',
    email: 'gregory.p@spense.io',
    position: 'FP&A Manager',
    department: 'Finance',
  },
  {
    id: 'emp_0c5a9f',
    name: 'Diana Castillo',
    email: 'diana.c@spense.io',
    position: 'Accounts Receivable',
    department: 'Finance',
  },

  // Operations (10)
  {
    id: 'emp_8c6a0f',
    name: 'Tom Bradley',
    email: 'tom.b@spense.io',
    position: 'Operations Manager',
    department: 'Operations',
  },
  {
    id: 'emp_c48d62',
    name: 'Alex Thompson',
    email: 'alex.t@spense.io',
    position: 'IT Administrator',
    department: 'Operations',
  },
  {
    id: 'emp_3b7d5e',
    name: 'Hannah Becker',
    email: 'hannah.b@spense.io',
    position: 'Office Administrator',
    department: 'Operations',
  },
  {
    id: 'emp_7a9e1c',
    name: 'Malik Jefferson',
    email: 'malik.j@spense.io',
    position: 'Facilities Coordinator',
    department: 'Operations',
  },
  {
    id: 'emp_d4b6f0',
    name: 'Ingrid Larsen',
    email: 'ingrid.l@spense.io',
    position: 'VP of Operations',
    department: 'Operations',
  },
  {
    id: 'emp_28cde5',
    name: 'Roberto Silva',
    email: 'roberto.s@spense.io',
    position: 'Procurement Specialist',
    department: 'Operations',
  },
  {
    id: 'emp_f5a3b9',
    name: 'Karen Nguyen',
    email: 'karen.n@spense.io',
    position: 'Vendor Manager',
    department: 'Operations',
  },
  {
    id: 'emp_1e7c4a',
    name: 'Noah Campbell',
    email: 'noah.c@spense.io',
    position: 'Systems Administrator',
    department: 'Operations',
  },
  {
    id: 'emp_a42f8d',
    name: 'Simone Bianchi',
    email: 'simone.b@spense.io',
    position: 'Logistics Coordinator',
    department: 'Operations',
  },
  {
    id: 'emp_693b1e',
    name: 'Travis Henderson',
    email: 'travis.h@spense.io',
    position: 'IT Support Specialist',
    department: 'Operations',
  },

  // HR (10)
  {
    id: 'emp_a04d5c',
    name: "Ryan O'Brien",
    email: 'ryan.o@spense.io',
    position: 'HR Coordinator',
    department: 'HR',
  },
  {
    id: 'emp_42ea78',
    name: 'Rachel Adams',
    email: 'rachel.a@spense.io',
    position: 'Talent Acquisition',
    department: 'HR',
  },
  {
    id: 'emp_8f1c5b',
    name: 'Vanessa Cole',
    email: 'vanessa.c@spense.io',
    position: 'HR Director',
    department: 'HR',
  },
  {
    id: 'emp_b63d92',
    name: 'Tariq Hassan',
    email: 'tariq.h@spense.io',
    position: 'People Operations',
    department: 'HR',
  },
  {
    id: 'emp_d0e8a4',
    name: 'Jessica Palmer',
    email: 'jessica.p@spense.io',
    position: 'Benefits Administrator',
    department: 'HR',
  },
  {
    id: 'emp_5c2f17',
    name: 'Anton Kruger',
    email: 'anton.k@spense.io',
    position: 'L&D Specialist',
    department: 'HR',
  },
  {
    id: 'emp_e94b60',
    name: 'Mia Santos',
    email: 'mia.s@spense.io',
    position: 'Recruiter',
    department: 'HR',
  },
  {
    id: 'emp_27da3c',
    name: 'Helen Park',
    email: 'helen.p@spense.io',
    position: 'DEI Program Manager',
    department: 'HR',
  },
  {
    id: 'emp_cb8f15',
    name: 'Marcus Bell',
    email: 'marcus.b@spense.io',
    position: 'Compensation Analyst',
    department: 'HR',
  },
  {
    id: 'emp_4a6e9d',
    name: 'Priscilla Owens',
    email: 'priscilla.o@spense.io',
    position: 'Employee Relations Specialist',
    department: 'HR',
  },
];

export const categories: Category[] = [
  { id: 'cat_a1b2c3', name: 'Travel', icon: 'plane' },
  { id: 'cat_d4e5f6', name: 'Meals', icon: 'utensils' },
  { id: 'cat_71g8h9', name: 'Office Supplies', icon: 'paperclip' },
  { id: 'cat_j0k1l2', name: 'Software', icon: 'monitor' },
  { id: 'cat_m3n4o5', name: 'Professional Development', icon: 'graduation-cap' },
  { id: 'cat_p6q7r8', name: 'Marketing', icon: 'megaphone' },
  { id: 'cat_s9t0u1', name: 'Client Entertainment', icon: 'wine' },
  { id: 'cat_v2w3x4', name: 'Equipment', icon: 'hard-drive' },
  { id: 'cat_y5z6a7', name: 'Communication', icon: 'phone' },
  { id: 'cat_b8c9d0', name: 'Miscellaneous', icon: 'more-horizontal' },
  { id: 'cat_e1f2g3', name: 'Shipping & Logistics', icon: 'truck' },
  { id: 'cat_h4i5j6', name: 'Legal & Compliance', icon: 'scale' },
];

function randomDate(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  return date.toISOString();
}

function randomAmount(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Simple deterministic-ish hex snippet for expense IDs */
function expenseId(index: number): string {
  const base = (index * 2654435761) >>> 0; // Knuth multiplicative hash
  return `exp_${base.toString(16).padStart(8, '0')}`;
}

function generateExpenses(): Expense[] {
  const result: Expense[] = [];

  // Category-amount ranges for realistic data
  const categoryConfig: Record<
    string,
    { amountRange: [number, number]; merchantPool: string[]; descPool: string[] }
  > = {
    cat_a1b2c3: {
      amountRange: [150, 3500],
      merchantPool: [
        'United Airlines',
        'Delta Airlines',
        'American Airlines',
        'Southwest Airlines',
        'Marriott Hotels',
        'Hilton',
        'Hyatt',
        'Uber',
        'Lyft',
        'Airbnb',
        'Hertz',
        'Enterprise Rent-A-Car',
      ],
      descPool: [
        'Flight to NYC for client meeting',
        'Hotel stay for Q4 conference',
        'Rideshare to airport',
        'Round-trip flight to SF office',
        'Airport parking 3 days',
        'Hotel for onsite sprint',
        'Train ticket NYC-BOS',
        'Rental car for regional sales tour',
        'Flight to Austin for SXSW',
        'Uber to client dinner',
      ],
    },
    cat_d4e5f6: {
      amountRange: [12, 350],
      merchantPool: [
        'Chipotle',
        'Sweetgreen',
        'Shake Shack',
        'Starbucks',
        'Blue Bottle Coffee',
        'Panera Bread',
        'Chick-fil-A',
        'Grubhub',
        'DoorDash',
        'Pret A Manger',
      ],
      descPool: [
        'Team lunch - sprint retro',
        'Client dinner meeting',
        'Coffee for team standup',
        'Working lunch during all-hands',
        'Breakfast for early morning meeting',
        'Post-mortem team lunch',
        'Lunch with candidate (interview)',
        'Coffee run for design review',
        'Catered lunch for product launch',
        'Team dinner - milestone celebration',
      ],
    },
    cat_71g8h9: {
      amountRange: [15, 400],
      merchantPool: ['Staples', 'Amazon', 'Office Depot', 'IKEA', 'Target', 'Muji'],
      descPool: [
        'Printer paper and toner',
        'Desk organizer set',
        'Whiteboards and markers',
        'Standing desk converter',
        'Sticky notes and pens bulk order',
        'Filing cabinet',
        'Desk lamp',
        'Printer cartridge replacement',
      ],
    },
    cat_j0k1l2: {
      amountRange: [30, 2500],
      merchantPool: [
        'GitHub',
        'Figma',
        'Slack',
        'Notion',
        'Zoom',
        'AWS',
        'Vercel',
        'Atlassian',
        'JetBrains',
        '1Password',
        'Datadog',
        'PagerDuty',
        'Linear',
        'PostHog',
      ],
      descPool: [
        'Annual Figma license',
        'GitHub Enterprise renewal',
        'Slack Pro upgrade',
        'AWS monthly invoice',
        'Vercel Pro subscription',
        'JetBrains All Products Pack',
        '1Password Business plan',
        'Datadog infrastructure monitoring',
        'Linear team plan',
        'Notion workspace upgrade',
        'PostHog analytics plan',
      ],
    },
    cat_m3n4o5: {
      amountRange: [75, 3000],
      merchantPool: [
        'Udemy',
        'Coursera',
        "O'Reilly Media",
        'PluralSight',
        'Skillshare',
        'LinkedIn Learning',
        'Eventbrite',
        'Stripe Press',
        'A Book Apart',
      ],
      descPool: [
        'React Advanced conference ticket',
        'Leadership workshop enrollment',
        'Online course subscription',
        'AWS Certified Solutions Architect exam',
        'Team workshop facilitation',
        'UX design bootcamp',
        'TypeScript masterclass',
        "Annual O'Reilly subscription",
        'Management training seminar',
        'Conference travel + registration',
      ],
    },
    cat_p6q7r8: {
      amountRange: [150, 8000],
      merchantPool: [
        'Google Ads',
        'Facebook Ads',
        'Mailchimp',
        'HubSpot',
        'LinkedIn Ads',
        'Canva',
        'Adobe Creative Cloud',
        'Webflow',
        'Semrush',
        'Moz',
      ],
      descPool: [
        'Google Ads Q3 campaign',
        'Trade show booth materials',
        'Email marketing platform',
        'Social media ad spend - October',
        'LinkedIn sponsored content',
        'Brand photography shoot',
        'Landing page design',
        'Annual Adobe CC license',
        'SEO tooling subscription',
        'Event swag and banners',
      ],
    },
    cat_s9t0u1: {
      amountRange: [80, 2000],
      merchantPool: [
        'Nobu',
        'The Capital Grille',
        'STK Steakhouse',
        'Carbone',
        'Peter Luger',
        'Eleven Madison Park',
        'The Smith',
        'Blue Ribbon Sushi',
        'Balthazar',
      ],
      descPool: [
        'Client appreciation dinner',
        'Prospect entertainment event',
        'Business dinner with partners',
        'Closing dinner with enterprise lead',
        'Annual client gala tickets',
        'Partner appreciation lunch',
        'Client happy hour',
        'VIP client dinner',
        'Investor dinner meeting',
      ],
    },
    cat_v2w3x4: {
      amountRange: [80, 3500],
      merchantPool: [
        'Apple Store',
        'Best Buy',
        'Dell',
        'Logitech',
        'CalDigit',
        'Autonomous',
        'Fully',
        'Herman Miller',
        'LG Electronics',
        'Samsung',
      ],
      descPool: [
        'MacBook Pro for new hire',
        'External monitor',
        'Ergonomic keyboard and mouse',
        'Thunderbolt dock',
        'Standing desk',
        'Noise-canceling headphones',
        'Webcam upgrade',
        'Ergonomic chair',
        'USB-C hub for conference room',
        'Second monitor for dual-screen setup',
      ],
    },
    cat_y5z6a7: {
      amountRange: [25, 600],
      merchantPool: [
        'Verizon',
        'AT&T',
        'Twilio',
        'Zoom',
        'Dialpad',
        'RingCentral',
        'Google Workspace',
      ],
      descPool: [
        'Monthly phone plan',
        'International calling credits',
        'Zoom Pro annual plan',
        'Twilio SMS credits',
        'Google Workspace upgrade',
        'Business phone line',
        'Conference call service',
        'VoIP subscription',
      ],
    },
    cat_b8c9d0: {
      amountRange: [10, 500],
      merchantPool: ['FedEx', 'UPS', 'Costco', 'Amazon', 'Walmart', 'TaskRabbit', 'WeWork'],
      descPool: [
        'Overnight shipping for contracts',
        'Office snacks restock',
        'Team building supplies',
        'Co-working day pass',
        'Parking validation for guests',
        'Office plant service',
        'Bottled water delivery',
        'Cleaning supplies',
      ],
    },
    cat_e1f2g3: {
      amountRange: [20, 800],
      merchantPool: ['FedEx', 'UPS', 'DHL', 'USPS', 'ShipBob', 'Flexport'],
      descPool: [
        'Priority overnight package to LA',
        'International shipment to London',
        'Freight for trade show materials',
        'Return shipment from client',
        'Bulk mailer for product samples',
        'Express document delivery',
      ],
    },
    cat_h4i5j6: {
      amountRange: [200, 5000],
      merchantPool: [
        'LegalZoom',
        'DocuSign',
        'Ironclad',
        'Cooley LLP',
        'Wilson Sonsini',
        'Stripe Atlas',
      ],
      descPool: [
        'Contract review - vendor agreement',
        'Annual compliance audit',
        'Trademark filing',
        'NDA template update',
        'DocuSign Enterprise annual',
        'Legal consultation - partnership terms',
        'IP filing fees',
      ],
    },
  };

  const notesPool = [
    'Please process at earliest convenience.',
    'Receipt attached - original lost, this is a photo copy.',
    'Split across two cards, see notes.',
    'Approved verbally by manager before purchase.',
    'Recurring monthly charge.',
    'One-time purchase, will not recur.',
    'Urgent - needed for upcoming deadline.',
    'Pre-approved by department head.',
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
  ];

  const EXPENSE_COUNT = 250;

  for (let i = 0; i < EXPENSE_COUNT; i++) {
    const categoryId = pickRandom(categories).id;
    const config = categoryConfig[categoryId];
    const expenseDate = randomDate(365);
    const submittedDate = new Date(expenseDate);
    submittedDate.setHours(submittedDate.getHours() + Math.floor(Math.random() * 72));

    // ~55% approved, 28% pending, 17% rejected
    const rand = Math.random();
    const status =
      rand < 0.55
        ? ('approved' as const)
        : rand < 0.83
          ? ('pending' as const)
          : ('rejected' as const);

    result.push({
      id: expenseId(i),
      employeeId: pickRandom(employees).id,
      categoryId,
      amount: randomAmount(config.amountRange[0], config.amountRange[1]),
      description: pickRandom(config.descPool),
      merchant: pickRandom(config.merchantPool),
      date: expenseDate,
      submittedAt: submittedDate.toISOString(),
      status,
      notes: pickRandom(notesPool),
      receiptUrl: Math.random() > 0.25 ? 'receipt-attached' : undefined,
    });
  }

  // Sort by date descending
  result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return result;
}

export const expenses: Expense[] = generateExpenses();
