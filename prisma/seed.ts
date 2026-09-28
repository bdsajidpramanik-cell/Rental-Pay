import {
  PrismaClient,
  Role,
  ShopStatus,
  AgreementStatus,
  BillStatus,
  BillType,
  BillingType,
} from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Clear existing data
  await prisma.auditLog.deleteMany();
  await prisma.qrOnboardingToken.deleteMany();
  await prisma.receipt.deleteMany();
  await prisma.paymentProof.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.bill.deleteMany();
  await prisma.shopFacility.deleteMany();
  await prisma.agreementVersion.deleteMany();
  await prisma.agreement.deleteMany();
  await prisma.tenant.deleteMany();
  await prisma.shop.deleteMany();
  await prisma.property.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Cleaned existing data.');

  // 2. Create Users
  const superAdmin = await prisma.user.create({
    data: {
      email: 'admin@rentalpay.com',
      firstName: 'System',
      lastName: 'SuperAdmin',
      phoneNumber: '+8801700000001',
      passwordHash: 'FIREBASE_MANAGED',
      role: Role.SUPER_ADMIN,
      isActive: true,
    },
  });

  const propertyOwner = await prisma.user.create({
    data: {
      email: 'owner@rentalpay.com',
      firstName: 'Rahim',
      lastName: 'Uddin',
      phoneNumber: '+8801700000002',
      passwordHash: 'FIREBASE_MANAGED',
      role: Role.OWNER,
      isActive: true,
    },
  });

  const tenantUser = await prisma.user.create({
    data: {
      email: 'tenant@rentalpay.com',
      firstName: 'Karim',
      lastName: 'Ahmed',
      phoneNumber: '+8801700000003',
      passwordHash: 'FIREBASE_MANAGED',
      role: Role.TENANT,
      isActive: true,
    },
  });

  console.log('👤 Created default users.');

  // 3. Create Property
  const property = await prisma.property.create({
    data: {
      name: 'Grand Commercial Complex',
      code: 'GCC-DHK-01',
      address: 'Plot 12, Road 5, Mirpur-10',
      city: 'Dhaka',
      ownerId: propertyOwner.id,
    },
  });

  console.log('🏢 Created sample property.');

  // 4. Create Shops
  const shop1 = await prisma.shop.create({
    data: {
      propertyId: property.id,
      shopNumber: 'A-101',
      floor: '1st Floor',
      sizeSqFt: 450.5,
      rentAmount: 25000.0,
      status: ShopStatus.OCCUPIED,
    },
  });

  await prisma.shop.create({
    data: {
      propertyId: property.id,
      shopNumber: 'A-102',
      floor: '1st Floor',
      sizeSqFt: 380.0,
      rentAmount: 20000.0,
      status: ShopStatus.VACANT,
    },
  });

  console.log('🏪 Created sample shops.');

  // 5. Shop Facilities for Shop A-101
  await prisma.shopFacility.createMany({
    data: [
      {
        shopId: shop1.id,
        facilityType: BillType.RENT,
        billingType: BillingType.FIXED,
        isEnabled: true,
        monthlyAmount: 25000.0,
      },
      {
        shopId: shop1.id,
        facilityType: BillType.ELECTRICITY,
        billingType: BillingType.METERED,
        isEnabled: true,
        ratePerUnit: 12.0,
      },
      {
        shopId: shop1.id,
        facilityType: BillType.WIFI,
        billingType: BillingType.FIXED,
        isEnabled: true,
        monthlyAmount: 1000.0,
        name: '100 Mbps Business',
      },
      {
        shopId: shop1.id,
        facilityType: BillType.WATER,
        billingType: BillingType.FIXED,
        isEnabled: true,
        monthlyAmount: 500.0,
      },
      {
        shopId: shop1.id,
        facilityType: BillType.CLEANING,
        billingType: BillingType.FIXED,
        isEnabled: true,
        monthlyAmount: 300.0,
      },
    ],
  });

  console.log('⚙️ Created shop facilities.');

  // 6. Create Tenant
  const tenant = await prisma.tenant.create({
    data: {
      propertyId: property.id,
      shopId: shop1.id,
      userId: tenantUser.id,
      businessName: 'Karim Electronics & Variety Store',
      emergencyContact: '+8801800000000',
      isActive: true,
    },
  });

  console.log('👨‍💼 Created tenant profile.');

  // 7. Create Agreement
  const agreement = await prisma.agreement.create({
    data: {
      propertyId: property.id,
      shopId: shop1.id,
      tenantId: tenant.id,
      createdById: propertyOwner.id,
      agreementNumber: 'AGR-2026-001',
      status: AgreementStatus.ACTIVE,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      rentAmount: 25000.0,
      securityDeposit: 50000.0,
      termsJson: {
        rentDueDateDay: 5,
        lateFeePercentage: 2,
        utilityTerms: 'Electricity paid via separate sub-meter',
      },
    },
  });

  console.log('📄 Created active agreement.');

  // 8. Create Individual Bills (September 2026)
  const dueDate = new Date('2026-10-05');
  const periodStart = new Date('2026-09-01');
  const periodEnd = new Date('2026-09-30');

  // Rent Bill
  await prisma.bill.create({
    data: {
      propertyId: property.id,
      shopId: shop1.id,
      tenantId: tenant.id,
      agreementId: agreement.id,
      createdById: propertyOwner.id,
      billNumber: 'BILL-2026-09-RENT-001',
      billType: BillType.RENT,
      billingType: BillingType.FIXED,
      title: 'Monthly Rent',
      billingPeriod: 'September 2026',
      periodStart,
      periodEnd,
      dueDate,
      amount: 25000.0,
      status: BillStatus.ISSUED,
    },
  });

  // Electricity Bill (Metered)
  await prisma.bill.create({
    data: {
      propertyId: property.id,
      shopId: shop1.id,
      tenantId: tenant.id,
      agreementId: agreement.id,
      createdById: propertyOwner.id,
      billNumber: 'BILL-2026-09-ELEC-001',
      billType: BillType.ELECTRICITY,
      billingType: BillingType.METERED,
      title: 'Electricity Bill',
      billingPeriod: 'September 2026',
      periodStart,
      periodEnd,
      dueDate,
      previousReading: 1256,
      currentReading: 1381,
      usage: 125,
      ratePerUnit: 12.0,
      amount: 1500.0, // 125 × 12
      status: BillStatus.ISSUED,
    },
  });

  // Wi-Fi Bill
  await prisma.bill.create({
    data: {
      propertyId: property.id,
      shopId: shop1.id,
      tenantId: tenant.id,
      agreementId: agreement.id,
      createdById: propertyOwner.id,
      billNumber: 'BILL-2026-09-WIFI-001',
      billType: BillType.WIFI,
      billingType: BillingType.FIXED,
      title: 'Wi-Fi (100 Mbps)',
      billingPeriod: 'September 2026',
      periodStart,
      periodEnd,
      dueDate,
      amount: 1000.0,
      status: BillStatus.ISSUED,
    },
  });

  // Water Bill
  await prisma.bill.create({
    data: {
      propertyId: property.id,
      shopId: shop1.id,
      tenantId: tenant.id,
      agreementId: agreement.id,
      createdById: propertyOwner.id,
      billNumber: 'BILL-2026-09-WATER-001',
      billType: BillType.WATER,
      billingType: BillingType.FIXED,
      title: 'Water Bill',
      billingPeriod: 'September 2026',
      periodStart,
      periodEnd,
      dueDate,
      amount: 500.0,
      status: BillStatus.ISSUED,
    },
  });

  // Cleaning Bill
  await prisma.bill.create({
    data: {
      propertyId: property.id,
      shopId: shop1.id,
      tenantId: tenant.id,
      agreementId: agreement.id,
      createdById: propertyOwner.id,
      billNumber: 'BILL-2026-09-CLEAN-001',
      billType: BillType.CLEANING,
      billingType: BillingType.FIXED,
      title: 'Cleaning Service',
      billingPeriod: 'September 2026',
      periodStart,
      periodEnd,
      dueDate,
      amount: 300.0,
      status: BillStatus.ISSUED,
    },
  });

  console.log('🧾 Created individual bills (Rent, Electricity, Wi-Fi, Water, Cleaning).');
  console.log('✅ Database seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
