import { PrismaClient, Role, ShopStatus, AgreementStatus, BillStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Clear existing data in reverse order of dependencies
  await prisma.auditLog.deleteMany();
  await prisma.qrOnboardingToken.deleteMany();
  await prisma.receipt.deleteMany();
  await prisma.paymentProof.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.bill.deleteMany();
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
      rentAmount: 25000.00,
      status: ShopStatus.OCCUPIED,
    },
  });

  await prisma.shop.create({
    data: {
      propertyId: property.id,
      shopNumber: 'A-102',
      floor: '1st Floor',
      sizeSqFt: 380.0,
      rentAmount: 20000.00,
      status: ShopStatus.VACANT,
    },
  });

  console.log('🏪 Created sample shops.');

  // 5. Create Tenant Record
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

  // 6. Create Agreement
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
      rentAmount: 25000.00,
      securityDeposit: 50000.00,
      termsJson: {
        rentDueDateDay: 5,
        lateFeePercentage: 2,
        utilityTerms: 'Electricity paid via separate sub-meter',
      },
    },
  });

  console.log('📄 Created active agreement.');

  // 7. Create Initial Bill
  await prisma.bill.create({
    data: {
      propertyId: property.id,
      shopId: shop1.id,
      tenantId: tenant.id,
      agreementId: agreement.id,
      billNumber: 'BILL-2026-09-001',
      periodStart: new Date('2026-09-01'),
      periodEnd: new Date('2026-09-30'),
      dueDate: new Date('2026-10-05'),
      rentAmount: 25000.00,
      utilityAmount: 1500.00,
      penaltyAmount: 0.00,
      amount: 26500.00,
      status: BillStatus.ISSUED,
    },
  });

  console.log('🧾 Created sample bill.');
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
