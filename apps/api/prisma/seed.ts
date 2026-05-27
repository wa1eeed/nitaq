import { PrismaClient } from '../src/generated/prisma';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ─── Demo credentials (login via email OR phone) ─────────────────
// Run: cd apps/api && pnpm db:seed
const ACCOUNTS = {
  admin: {
    email: 'admin@nitaq.sa',
    phone: '+966500000001',
    password: 'Admin@1234',
    firstName: 'وليد',
    lastName: 'الحربي',
    role: 'SUPER_ADMIN' as const,
  },
  client: {
    email: 'client@nitaq.sa',
    phone: '+966500000002',
    password: 'Client@1234',
    firstName: 'أحمد',
    lastName: 'العتيبي',
    role: 'CLIENT_ADMIN' as const,
  },
  carrier: {
    email: 'provider@nitaq.sa',
    phone: '+966500000003',
    password: 'Carrier@1234',
    firstName: 'سلطان',
    lastName: 'القحطاني',
    role: 'PROVIDER_ADMIN' as const,
  },
};

async function main() {
  console.log('🌱 Seeding Naqla database...');

  // ─── Settings ────────────────────────────────────────────────
  // Keys use snake_case; `category` lets the admin UI group them into sections.
  // White-label keys (`platform_*`) drive branding and are mutable from the
  // admin panel without redeployment.
  const defaultSettings = [
    // Finance
    { key: 'commission_default_rate', value: '0.08', category: 'finance' },
    { key: 'vat_rate', value: '0.15', category: 'finance' },

    // White-label / branding
    { key: 'platform_name_ar', value: 'نِطاق', category: 'branding' },
    { key: 'platform_name_en', value: 'Nitaq', category: 'branding' },
    { key: 'platform_logo', value: '', category: 'branding' }, // URL to logo (PNG/SVG)

    // Localization defaults
    { key: 'default_locale', value: 'ar', category: 'localization' },
    { key: 'default_direction', value: 'rtl', category: 'localization' },
    { key: 'default_currency', value: 'SAR', category: 'localization' },
    { key: 'default_timezone', value: 'Asia/Riyadh', category: 'localization' },
    { key: 'default_date_format', value: 'DD/MM/YYYY', category: 'localization' },

    // Contact
    { key: 'support_phone', value: '+966570009449', category: 'general' },
  ];
  for (const s of defaultSettings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      create: s,
      update: { value: s.value },
    });
  }

  // ─── Super admin ─────────────────────────────────────────────
  const adminPass = await bcrypt.hash(ACCOUNTS.admin.password, 12);
  await prisma.user.upsert({
    where: { phone: ACCOUNTS.admin.phone },
    create: {
      phone: ACCOUNTS.admin.phone,
      email: ACCOUNTS.admin.email,
      passwordHash: adminPass,
      role: ACCOUNTS.admin.role,
      firstName: ACCOUNTS.admin.firstName,
      lastName: ACCOUNTS.admin.lastName,
      isEmailVerified: true,
      isPhoneVerified: true,
      isActive: true,
    },
    update: {
      email: ACCOUNTS.admin.email,
      passwordHash: adminPass,
      role: ACCOUNTS.admin.role,
      isActive: true,
      isEmailVerified: true,
      isPhoneVerified: true,
    },
  });

  // ─── Demo client company ─────────────────────────────────────
  const clientCo = await prisma.company.upsert({
    where: { crNumber: '1010000001' },
    create: {
      type: 'CLIENT',
      status: 'ACTIVE',
      kycStatus: 'APPROVED',
      nameAr: 'شركة الجزيرة للطاقة',
      nameEn: 'Aljazeera Energy Co.',
      crNumber: '1010000001',
      vatNumber: '300000000000003',
      city: 'الرياض',
      region: 'الرياض',
      contactPhone: '+966112000001',
      contactEmail: 'ops@jazeera-energy.example',
      commissionRate: 0.08,
    },
    update: { status: 'ACTIVE', kycStatus: 'APPROVED' },
  });

  const clientPass = await bcrypt.hash(ACCOUNTS.client.password, 12);
  await prisma.user.upsert({
    where: { phone: ACCOUNTS.client.phone },
    create: {
      phone: ACCOUNTS.client.phone,
      email: ACCOUNTS.client.email,
      passwordHash: clientPass,
      role: ACCOUNTS.client.role,
      firstName: ACCOUNTS.client.firstName,
      lastName: ACCOUNTS.client.lastName,
      isEmailVerified: true,
      isPhoneVerified: true,
      isActive: true,
      companyId: clientCo.id,
    },
    update: {
      email: ACCOUNTS.client.email,
      passwordHash: clientPass,
      role: ACCOUNTS.client.role,
      isActive: true,
      isEmailVerified: true,
      isPhoneVerified: true,
      companyId: clientCo.id,
    },
  });

  // ─── Demo carrier company ────────────────────────────────────
  const carrierCo = await prisma.company.upsert({
    where: { crNumber: '1010000002' },
    create: {
      type: 'PROVIDER',
      status: 'ACTIVE',
      kycStatus: 'APPROVED',
      nameAr: 'شركة المسار السريع للنقل',
      nameEn: 'Fast Track Transport',
      crNumber: '1010000002',
      vatNumber: '300000000000004',
      city: 'الدمام',
      region: 'الشرقية',
      contactPhone: '+966138000001',
      contactEmail: 'ops@fasttrack.example',
      commissionRate: 0.08,
    },
    update: { status: 'ACTIVE', kycStatus: 'APPROVED' },
  });

  const carrierPass = await bcrypt.hash(ACCOUNTS.carrier.password, 12);
  await prisma.user.upsert({
    where: { phone: ACCOUNTS.carrier.phone },
    create: {
      phone: ACCOUNTS.carrier.phone,
      email: ACCOUNTS.carrier.email,
      passwordHash: carrierPass,
      role: ACCOUNTS.carrier.role,
      firstName: ACCOUNTS.carrier.firstName,
      lastName: ACCOUNTS.carrier.lastName,
      isEmailVerified: true,
      isPhoneVerified: true,
      isActive: true,
      companyId: carrierCo.id,
    },
    update: {
      email: ACCOUNTS.carrier.email,
      passwordHash: carrierPass,
      role: ACCOUNTS.carrier.role,
      isActive: true,
      isEmailVerified: true,
      isPhoneVerified: true,
      companyId: carrierCo.id,
    },
  });

  // ─── Services ────────────────────────────────────────────────
  await prisma.service.upsert({
    where: { plateNumber: 'SVC-0001' },
    create: {
      companyId: carrierCo.id,
      plateNumber: 'SVC-0001',
      type: 'INSTALLATION',
      capacity: 1,
    },
    update: {},
  });
  await prisma.service.upsert({
    where: { plateNumber: 'SVC-0002' },
    create: {
      companyId: carrierCo.id,
      plateNumber: 'SVC-0002',
      type: 'MAINTENANCE',
      capacity: 1,
    },
    update: {},
  });

  // ─── Demo Order ──────────────────────────────────────────────
  const existing = await prisma.order.findFirst({ where: { clientId: clientCo.id } });
  if (!existing) {
    await prisma.order.create({
      data: {
        orderNumber: 'ORD-2025-0150',
        status: 'PUBLISHED',
        clientId: clientCo.id,
        cargoType: 'INSTALLATION',
        cargoDescription: 'تركيب منظومة كاميرات مراقبة في المستودع الرئيسي',
        originCity: 'الرياض',
        originRegion: 'الرياض',
        originAddress: 'المنطقة الصناعية الثانية',
        destinationCity: 'الرياض',
        destinationRegion: 'الرياض',
        destinationAddress: 'المنطقة الصناعية الثانية',
        requiredServiceType: 'INSTALLATION',
        pickupDate: new Date(Date.now() + 86400000 * 3),
        clientBudget: 9500,
      },
    });
  }

  console.log('');
  console.log('✅ Seed complete. Demo accounts (email or phone both work):');
  console.log('');
  console.log(`   👑 Admin    → ${ACCOUNTS.admin.email}    |  ${ACCOUNTS.admin.phone}  |  ${ACCOUNTS.admin.password}`);
  console.log(`   🏢 Client   → ${ACCOUNTS.client.email}   |  ${ACCOUNTS.client.phone}  |  ${ACCOUNTS.client.password}`);
  console.log(`   🤝 Provider → ${ACCOUNTS.carrier.email}   |  ${ACCOUNTS.carrier.phone}  |  ${ACCOUNTS.carrier.password}`);
  console.log('');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
