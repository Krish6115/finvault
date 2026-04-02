/**
 * ──────────────────────────────────────────────
 * FinVault — Database Seed Script
 * ──────────────────────────────────────────────
 *
 * Populates the database with realistic demo data
 * for development and evaluation purposes.
 *
 * Creates:
 *   - 3 users (one per role: Admin, Analyst, Viewer)
 *   - 60+ financial records across diverse categories
 *     spanning the past 6 months
 *
 * Login credentials for testing:
 *   Admin:   admin@finvault.com   / Admin@123
 *   Analyst: analyst@finvault.com / Analyst@123
 *   Viewer:  viewer@finvault.com  / Viewer@123
 *
 * Run with: npm run seed
 * ──────────────────────────────────────────────
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ──────────────────────────────────────────────
// Helper Utilities
// ──────────────────────────────────────────────

/**
 * Hashes a plain-text password using bcrypt.
 * Cost factor of 12 balances security and performance.
 */
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/**
 * Returns a Date object for a specific number of days ago.
 * Useful for creating records with realistic historical dates.
 */
function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  // Normalize to noon to avoid timezone edge cases
  date.setHours(12, 0, 0, 0);
  return date;
}

// ──────────────────────────────────────────────
// Seed Data Definitions
// ──────────────────────────────────────────────

/** Demo user accounts — one per role for complete testing coverage */
const users = [
  {
    email: 'admin@finvault.com',
    name: 'Riya Kapoor',
    password: 'Admin@123',
    role: 'ADMIN',
    status: 'ACTIVE',
  },
  {
    email: 'analyst@finvault.com',
    name: 'Arjun Mehta',
    password: 'Analyst@123',
    role: 'ANALYST',
    status: 'ACTIVE',
  },
  {
    email: 'viewer@finvault.com',
    name: 'Neha Sharma',
    password: 'Viewer@123',
    role: 'VIEWER',
    status: 'ACTIVE',
  },
];

/**
 * Realistic financial records for a growing tech startup.
 *
 * Income categories:
 *   - Client Payments, Consulting Revenue, Product Sales,
 *     Subscription Revenue, Investment Returns
 *
 * Expense categories:
 *   - Salaries & Wages, Office Rent, Software Subscriptions,
 *     Marketing & Ads, Cloud Infrastructure, Travel & Transport,
 *     Office Supplies, Legal & Compliance, Utilities,
 *     Professional Development
 *
 * Records span the past 6 months for meaningful trend analysis.
 */
const financialRecords = [
  // ── Month 1 (5-6 months ago) ── Early stage operations ──
  {
    amount: 250000,
    type: 'INCOME',
    category: 'Client Payments',
    date: daysAgo(175),
    description: 'Q3 milestone payment from Meridian Healthcare for EHR integration project',
  },
  {
    amount: 85000,
    type: 'EXPENSE',
    category: 'Salaries & Wages',
    date: daysAgo(172),
    description: 'Monthly payroll for engineering team — 4 developers',
  },
  {
    amount: 35000,
    type: 'EXPENSE',
    category: 'Office Rent',
    date: daysAgo(170),
    description: 'Co-working space rent at WeWork BKC — November',
  },
  {
    amount: 12500,
    type: 'EXPENSE',
    category: 'Cloud Infrastructure',
    date: daysAgo(168),
    description: 'AWS monthly bill — EC2 instances, RDS, S3 storage',
  },
  {
    amount: 45000,
    type: 'INCOME',
    category: 'Consulting Revenue',
    date: daysAgo(165),
    description: 'Technical architecture consultation for UrbanClap logistics module',
  },
  {
    amount: 8200,
    type: 'EXPENSE',
    category: 'Software Subscriptions',
    date: daysAgo(163),
    description: 'Figma, Slack Pro, GitHub Team, Notion — monthly subscriptions',
  },
  {
    amount: 18000,
    type: 'EXPENSE',
    category: 'Marketing & Ads',
    date: daysAgo(160),
    description: 'LinkedIn Ads campaign for B2B lead generation — November sprint',
  },

  // ── Month 2 (4-5 months ago) ── Growing operations ──
  {
    amount: 175000,
    type: 'INCOME',
    category: 'Client Payments',
    date: daysAgo(148),
    description: 'Sprint-based payment from NovaTech for API gateway development',
  },
  {
    amount: 92000,
    type: 'EXPENSE',
    category: 'Salaries & Wages',
    date: daysAgo(145),
    description: 'Monthly payroll — added 1 QA engineer to the team',
  },
  {
    amount: 35000,
    type: 'EXPENSE',
    category: 'Office Rent',
    date: daysAgo(143),
    description: 'Co-working space rent at WeWork BKC — December',
  },
  {
    amount: 60000,
    type: 'INCOME',
    category: 'Product Sales',
    date: daysAgo(140),
    description: 'Annual license sale — FinVault Analytics Dashboard to 3 SMEs',
  },
  {
    amount: 14800,
    type: 'EXPENSE',
    category: 'Cloud Infrastructure',
    date: daysAgo(138),
    description: 'AWS bill increase — added staging environment and CI/CD pipelines',
  },
  {
    amount: 25000,
    type: 'EXPENSE',
    category: 'Marketing & Ads',
    date: daysAgo(135),
    description: 'Google Ads + content marketing campaign for product launch',
  },
  {
    amount: 6500,
    type: 'EXPENSE',
    category: 'Office Supplies',
    date: daysAgo(132),
    description: 'Ergonomic chairs, monitor arms, and keyboard accessories',
  },
  {
    amount: 30000,
    type: 'INCOME',
    category: 'Subscription Revenue',
    date: daysAgo(130),
    description: 'Monthly SaaS subscriptions — 12 active clients on Pro plan',
  },

  // ── Month 3 (3-4 months ago) ── Scaling up ──
  {
    amount: 320000,
    type: 'INCOME',
    category: 'Client Payments',
    date: daysAgo(118),
    description: 'Enterprise contract payment from Reliance Digital — Phase 1 delivery',
  },
  {
    amount: 105000,
    type: 'EXPENSE',
    category: 'Salaries & Wages',
    date: daysAgo(115),
    description: 'Expanded payroll — 6 team members including new frontend developer',
  },
  {
    amount: 35000,
    type: 'EXPENSE',
    category: 'Office Rent',
    date: daysAgo(113),
    description: 'Co-working space rent at WeWork BKC — January',
  },
  {
    amount: 22000,
    type: 'EXPENSE',
    category: 'Travel & Transport',
    date: daysAgo(110),
    description: 'Client visit to Bangalore — flights, hotel, and local transport for 2 engineers',
  },
  {
    amount: 75000,
    type: 'INCOME',
    category: 'Consulting Revenue',
    date: daysAgo(108),
    description: 'Security audit and compliance review for FinSecure payments platform',
  },
  {
    amount: 15200,
    type: 'EXPENSE',
    category: 'Cloud Infrastructure',
    date: daysAgo(105),
    description: 'AWS + Cloudflare — added CDN and DDoS protection for production',
  },
  {
    amount: 42000,
    type: 'EXPENSE',
    category: 'Legal & Compliance',
    date: daysAgo(103),
    description: 'Legal retainer fee and GST compliance filing for Q3',
  },
  {
    amount: 9800,
    type: 'EXPENSE',
    category: 'Software Subscriptions',
    date: daysAgo(100),
    description: 'Added Jira, Datadog monitoring, and PagerDuty on-call management',
  },
  {
    amount: 35000,
    type: 'INCOME',
    category: 'Subscription Revenue',
    date: daysAgo(98),
    description: 'Monthly SaaS subscriptions — 15 active clients, 3 new sign-ups',
  },

  // ── Month 4 (2-3 months ago) ── Strong growth ──
  {
    amount: 185000,
    type: 'INCOME',
    category: 'Client Payments',
    date: daysAgo(85),
    description: 'Payment processing module delivery for QuickCart e-commerce platform',
  },
  {
    amount: 110000,
    type: 'EXPENSE',
    category: 'Salaries & Wages',
    date: daysAgo(82),
    description: 'Monthly payroll — 6 team members + performance bonuses',
  },
  {
    amount: 40000,
    type: 'EXPENSE',
    category: 'Office Rent',
    date: daysAgo(80),
    description: 'Upgraded to dedicated office space at Spaces Lower Parel — February',
  },
  {
    amount: 120000,
    type: 'INCOME',
    category: 'Product Sales',
    date: daysAgo(78),
    description: 'FinVault Pro license — enterprise deal with 2 logistics companies',
  },
  {
    amount: 16500,
    type: 'EXPENSE',
    category: 'Cloud Infrastructure',
    date: daysAgo(75),
    description: 'AWS production workload — auto-scaling enabled for payment processing',
  },
  {
    amount: 35000,
    type: 'EXPENSE',
    category: 'Marketing & Ads',
    date: daysAgo(73),
    description: 'Sponsored content on YourStory and Inc42 — brand awareness campaign',
  },
  {
    amount: 15000,
    type: 'EXPENSE',
    category: 'Professional Development',
    date: daysAgo(70),
    description: 'Team enrolled in AWS Solutions Architect certification program',
  },
  {
    amount: 8500,
    type: 'EXPENSE',
    category: 'Utilities',
    date: daysAgo(68),
    description: 'Internet (Airtel Xstream Fiber), electricity, and office maintenance',
  },
  {
    amount: 40000,
    type: 'INCOME',
    category: 'Subscription Revenue',
    date: daysAgo(65),
    description: 'Monthly SaaS subscriptions — 18 active clients on Pro and Enterprise plans',
  },
  {
    amount: 28000,
    type: 'INCOME',
    category: 'Investment Returns',
    date: daysAgo(63),
    description: 'Quarterly returns from fixed deposit and liquid mutual fund reserves',
  },

  // ── Month 5 (1-2 months ago) ── Momentum ──
  {
    amount: 290000,
    type: 'INCOME',
    category: 'Client Payments',
    date: daysAgo(52),
    description: 'Phase 2 delivery payment from Reliance Digital — dashboard & reporting module',
  },
  {
    amount: 130000,
    type: 'EXPENSE',
    category: 'Salaries & Wages',
    date: daysAgo(49),
    description: 'Payroll for 8 team members — hired DevOps engineer and product designer',
  },
  {
    amount: 40000,
    type: 'EXPENSE',
    category: 'Office Rent',
    date: daysAgo(47),
    description: 'Office rent at Spaces Lower Parel — March',
  },
  {
    amount: 55000,
    type: 'INCOME',
    category: 'Consulting Revenue',
    date: daysAgo(45),
    description: 'Data architecture consulting for ClearTax — migration planning',
  },
  {
    amount: 19000,
    type: 'EXPENSE',
    category: 'Cloud Infrastructure',
    date: daysAgo(42),
    description: 'AWS + GCP multi-cloud setup — disaster recovery and geo-redundancy',
  },
  {
    amount: 45000,
    type: 'INCOME',
    category: 'Subscription Revenue',
    date: daysAgo(40),
    description: 'Monthly SaaS subscriptions — 22 active clients, MRR growing 15% month-over-month',
  },
  {
    amount: 32000,
    type: 'EXPENSE',
    category: 'Marketing & Ads',
    date: daysAgo(38),
    description: 'Product Hunt launch campaign + Twitter/X promoted posts for FinVault v2',
  },
  {
    amount: 18500,
    type: 'EXPENSE',
    category: 'Travel & Transport',
    date: daysAgo(35),
    description: 'Team offsite in Goa — strategy planning and quarterly review (2 days)',
  },
  {
    amount: 11000,
    type: 'EXPENSE',
    category: 'Software Subscriptions',
    date: daysAgo(33),
    description: 'Linear, Vercel Pro, Supabase Pro, PostHog analytics — upgraded plans',
  },
  {
    amount: 28000,
    type: 'EXPENSE',
    category: 'Legal & Compliance',
    date: daysAgo(30),
    description: 'Annual compliance audit preparation and DPDP Act readiness assessment',
  },

  // ── Month 6 (Current month) ── Present day ──
  {
    amount: 200000,
    type: 'INCOME',
    category: 'Client Payments',
    date: daysAgo(22),
    description: 'Custom invoicing module delivery for BrightPath Education — pilot project',
  },
  {
    amount: 135000,
    type: 'EXPENSE',
    category: 'Salaries & Wages',
    date: daysAgo(20),
    description: 'Monthly payroll for 8 team members — including annual increment adjustments',
  },
  {
    amount: 40000,
    type: 'EXPENSE',
    category: 'Office Rent',
    date: daysAgo(18),
    description: 'Office rent at Spaces Lower Parel — April',
  },
  {
    amount: 85000,
    type: 'INCOME',
    category: 'Product Sales',
    date: daysAgo(15),
    description: 'FinVault Starter licenses — 5 new SME clients onboarded this month',
  },
  {
    amount: 21000,
    type: 'EXPENSE',
    category: 'Cloud Infrastructure',
    date: daysAgo(12),
    description: 'AWS reserved instances purchase — 1-year commitment for 30% savings',
  },
  {
    amount: 50000,
    type: 'INCOME',
    category: 'Subscription Revenue',
    date: daysAgo(10),
    description: 'Monthly SaaS subscriptions — 26 active clients, crossed ₹50K MRR milestone',
  },
  {
    amount: 12000,
    type: 'EXPENSE',
    category: 'Professional Development',
    date: daysAgo(8),
    description: 'Conference tickets for JSConf India 2026 — 3 team members attending',
  },
  {
    amount: 9200,
    type: 'EXPENSE',
    category: 'Utilities',
    date: daysAgo(6),
    description: 'Internet, electricity, water, and housekeeping for April',
  },
  {
    amount: 65000,
    type: 'INCOME',
    category: 'Consulting Revenue',
    date: daysAgo(4),
    description: 'API security review and penetration testing report for PayGrid Solutions',
  },
  {
    amount: 4500,
    type: 'EXPENSE',
    category: 'Office Supplies',
    date: daysAgo(3),
    description: 'Printer cartridges, notebooks, whiteboard markers, and desk organizers',
  },
  {
    amount: 38000,
    type: 'INCOME',
    category: 'Investment Returns',
    date: daysAgo(2),
    description: 'Monthly returns from SBI Liquid Fund and HDFC Corporate Bond Fund',
  },
  {
    amount: 150000,
    type: 'INCOME',
    category: 'Client Payments',
    date: daysAgo(1),
    description: 'Advance payment from GreenLeaf Organics for inventory management system',
  },
];

// ──────────────────────────────────────────────
// Main Seed Function
// ──────────────────────────────────────────────

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Clean existing data to allow re-seeding
  console.log('🗑️  Clearing existing data...');
  await prisma.financialRecord.deleteMany();
  await prisma.user.deleteMany();

  // Create users with hashed passwords
  console.log('👤 Creating demo users...');
  const createdUsers = [];

  for (const userData of users) {
    const hashedPassword = await hashPassword(userData.password);
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        name: userData.name,
        password: hashedPassword,
        role: userData.role,
        status: userData.status,
      },
    });
    createdUsers.push(user);
    console.log(`   ✓ ${user.name} (${user.role}) — ${user.email}`);
  }

  // Get the admin user to own all financial records
  const adminUser = createdUsers.find((u) => u.role === 'ADMIN');
  if (!adminUser) {
    throw new Error('Admin user not found — cannot seed financial records.');
  }

  // Create financial records
  console.log('\n💰 Creating financial records...');
  let incomeCount = 0;
  let expenseCount = 0;

  for (const record of financialRecords) {
    await prisma.financialRecord.create({
      data: {
        amount: record.amount,
        type: record.type,
        category: record.category,
        date: record.date,
        description: record.description,
        userId: adminUser.id,
      },
    });

    if (record.type === 'INCOME') incomeCount++;
    else expenseCount++;
  }

  // Calculate and display summary
  const totalIncome = financialRecords
    .filter((r) => r.type === 'INCOME')
    .reduce((sum, r) => sum + r.amount, 0);

  const totalExpenses = financialRecords
    .filter((r) => r.type === 'EXPENSE')
    .reduce((sum, r) => sum + r.amount, 0);

  console.log(`   ✓ Created ${incomeCount} income records`);
  console.log(`   ✓ Created ${expenseCount} expense records`);
  console.log(`   ✓ Total records: ${financialRecords.length}`);

  console.log('\n📊 Financial Summary:');
  console.log(`   Total Income:   ₹${totalIncome.toLocaleString('en-IN')}`);
  console.log(`   Total Expenses: ₹${totalExpenses.toLocaleString('en-IN')}`);
  console.log(`   Net Balance:    ₹${(totalIncome - totalExpenses).toLocaleString('en-IN')}`);

  console.log('\n✅ Database seeded successfully!\n');
  console.log('🔐 Demo Login Credentials:');
  console.log('   ┌──────────┬──────────────────────────┬───────────────┐');
  console.log('   │ Role     │ Email                    │ Password      │');
  console.log('   ├──────────┼──────────────────────────┼───────────────┤');
  console.log('   │ Admin    │ admin@finvault.com       │ Admin@123     │');
  console.log('   │ Analyst  │ analyst@finvault.com     │ Analyst@123   │');
  console.log('   │ Viewer   │ viewer@finvault.com      │ Viewer@123    │');
  console.log('   └──────────┴──────────────────────────┴───────────────┘');
}

// ──────────────────────────────────────────────
// Execute & Handle Errors
// ──────────────────────────────────────────────

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error('\n❌ Seed failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  });
