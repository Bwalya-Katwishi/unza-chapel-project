import {
  BookingAuthority,
  ContentStatus,
  FacilityCode,
  FeeType,
  PrismaClient,
  RoleCode,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  defaultCoverForFacility,
  HERO_IMAGE,
  MAIN_CHAPEL_IMAGE,
  SECONDARY_FACILITY_IMAGE,
} from "../src/lib/media/facilities";
import { seedCommunityProfiles, seedGraduationMass2026 } from "./community-profiles";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "ChangeMe!2026";

async function upsertRole(code: RoleCode, name: string, description: string) {
  return prisma.role.upsert({
    where: { code },
    update: { name, description },
    create: { code, name, description },
  });
}

async function upsertUser(input: {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roleCode: RoleCode;
  authority?: BookingAuthority;
}) {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const user = await prisma.user.upsert({
    where: { email: input.email },
    update: {
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      passwordHash,
      isActive: true,
    },
    create: {
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      passwordHash,
      emailVerified: new Date(),
    },
  });

  const role = await prisma.role.findUniqueOrThrow({ where: { code: input.roleCode } });
  const existing = await prisma.userRole.findFirst({
    where: { userId: user.id, roleId: role.id },
  });
  if (!existing) {
    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: role.id,
        authority: input.authority,
        notes: "Seeded development role — fictional account",
      },
    });
  }
  return user;
}

async function main() {
  console.log("Seeding UNZA Chapel Portal (fictional development data)...");

  await upsertRole(RoleCode.PLATFORM_SUPER_ADMIN, "Platform Super Administrator", "System configuration");
  await upsertRole(RoleCode.OVERALL_CHAPLAINCY_ADMIN, "Overall Chaplaincy Administrator", "Main Chapel, Reading Room, Conference Room");
  await upsertRole(RoleCode.CATHOLIC_SIDE_CHAPEL_ADMIN, "Catholic Side Chapel Administrator", "Catholic Side Chapel only");
  await upsertRole(RoleCode.UCC_PROTESTANT_SIDE_CHAPEL_ADMIN, "UCC / Protestant Side Chapel Administrator", "Protestant Side Chapel only");
  await upsertRole(RoleCode.ORGANISATION_REPRESENTATIVE, "Organisation Representative", "Organisation bookings and profile");
  await upsertRole(RoleCode.INDIVIDUAL_BOOKER, "Individual Booker", "Personal booking requests");
  await upsertRole(RoleCode.PUBLIC_VISITOR, "Public Visitor", "Public browsing");

  const facilities = [
    {
      code: FacilityCode.MAIN_CHAPEL,
      slug: "main-chapel",
      name: "Main Chapel",
      description:
        "Placeholder description for the Main Chapel. Capacity, amenities and imagery should be replaced with approved UNZA Chaplaincy information.",
      capacity: 800,
      amenities: ["Sound system (placeholder)", "Piano (placeholder)", "Parking nearby (placeholder)"],
      equipment: ["Microphones", "Lectern"],
      locationNote: "Placeholder campus location — confirm with Chaplaincy office.",
      bookingAuthority: BookingAuthority.OVERALL_CHAPLAINCY,
    },
    {
      code: FacilityCode.READING_ROOM,
      slug: "reading-room",
      name: "Reading Room",
      description: "Placeholder description for the Reading Room — suitable for smaller gatherings and study fellowships (fictional seed copy).",
      capacity: 60,
      amenities: ["Tables", "Chairs", "Whiteboard"],
      equipment: ["Projector (if available — confirm)"],
      locationNote: "Placeholder location.",
      bookingAuthority: BookingAuthority.OVERALL_CHAPLAINCY,
    },
    {
      code: FacilityCode.CONFERENCE_ROOM,
      slug: "conference-room",
      name: "Conference Room",
      description: "Placeholder description for the Conference Room used for meetings and workshops (fictional seed copy).",
      capacity: 40,
      amenities: ["Conference table", "Climate control (placeholder)"],
      equipment: ["Screen", "HDMI cable"],
      locationNote: "Placeholder location.",
      bookingAuthority: BookingAuthority.OVERALL_CHAPLAINCY,
    },
    {
      code: FacilityCode.CATHOLIC_SIDE_CHAPEL,
      slug: "catholic-side-chapel",
      name: "Catholic Side Chapel",
      description: "Placeholder description for the Catholic Side Chapel. Managed independently by the Catholic Side Chapel Administrator.",
      capacity: 120,
      amenities: ["Altar area (placeholder)", "Seating"],
      equipment: ["Basic sound (placeholder)"],
      locationNote: "Placeholder location.",
      bookingAuthority: BookingAuthority.CATHOLIC_SIDE_CHAPEL,
    },
    {
      code: FacilityCode.PROTESTANT_SIDE_CHAPEL,
      slug: "protestant-side-chapel",
      name: "Protestant Side Chapel",
      description: "Placeholder description for the Protestant / UCC Side Chapel. Managed independently by the UCC administrator.",
      capacity: 120,
      amenities: ["Worship space (placeholder)", "Seating"],
      equipment: ["Basic sound (placeholder)"],
      locationNote: "Placeholder location.",
      bookingAuthority: BookingAuthority.UCC_PROTESTANT_SIDE_CHAPEL,
    },
  ];

  for (const f of facilities) {
    const coverImageUrl = defaultCoverForFacility(f.code);
    const galleryUrls =
      f.code === FacilityCode.MAIN_CHAPEL
        ? [MAIN_CHAPEL_IMAGE, HERO_IMAGE, SECONDARY_FACILITY_IMAGE]
        : [SECONDARY_FACILITY_IMAGE, HERO_IMAGE];

    const facility = await prisma.facility.upsert({
      where: { code: f.code },
      update: { ...f, coverImageUrl, galleryUrls },
      create: {
        ...f,
        coverImageUrl,
        galleryUrls,
        bookingPolicyText:
          "Placeholder booking policy. Official fees and rules must be confirmed by the responsible booking authority. Sample fees below are fictional.",
        feeNotice:
          "Fees are confirmed after review. Any amounts shown in this development seed are fictional placeholders only — not official UNZA prices.",
      },
    });

    for (let day = 0; day <= 6; day++) {
      await prisma.facilityOperatingHours.upsert({
        where: { facilityId_dayOfWeek: { facilityId: facility.id, dayOfWeek: day } },
        update: {},
        create: {
          facilityId: facility.id,
          dayOfWeek: day,
          openTime: "07:00",
          closeTime: "21:00",
          isClosed: day === 0 ? false : false,
        },
      });
    }

    await prisma.availabilityRule.deleteMany({ where: { facilityId: facility.id } });
    await prisma.availabilityRule.create({
      data: {
        facilityId: facility.id,
        name: "Default advance booking rule",
        minAdvanceHours: 24,
        maxAdvanceDays: 365,
        autoApprove: false,
      },
    });

    await prisma.facilityFeeConfig.deleteMany({ where: { facilityId: facility.id } });
    await prisma.facilityFeeConfig.createMany({
      data: [
        {
          facilityId: facility.id,
          feeType: FeeType.FIXED,
          label: "Fictional sample session fee (not official)",
          amountZmw: 150,
          isEstimate: true,
          notes: "DEVELOPMENT PLACEHOLDER ONLY",
        },
        {
          facilityId: facility.id,
          feeType: FeeType.HOURLY,
          label: "Fictional sample hourly estimate (not official)",
          amountZmw: 50,
          isEstimate: true,
          notes: "DEVELOPMENT PLACEHOLDER ONLY",
        },
      ],
    });
  }

  const superAdmin = await upsertUser({
    email: "superadmin@example.com",
    firstName: "Seed",
    lastName: "SuperAdmin",
    roleCode: RoleCode.PLATFORM_SUPER_ADMIN,
  });

  await upsertUser({
    email: "chaplaincy.admin@example.com",
    firstName: "Seed",
    lastName: "ChaplaincyAdmin",
    roleCode: RoleCode.OVERALL_CHAPLAINCY_ADMIN,
    authority: BookingAuthority.OVERALL_CHAPLAINCY,
  });

  await upsertUser({
    email: "catholic.admin@example.com",
    firstName: "Seed",
    lastName: "CatholicAdmin",
    roleCode: RoleCode.CATHOLIC_SIDE_CHAPEL_ADMIN,
    authority: BookingAuthority.CATHOLIC_SIDE_CHAPEL,
  });

  await upsertUser({
    email: "ucc.admin@example.com",
    firstName: "Seed",
    lastName: "UccAdmin",
    roleCode: RoleCode.UCC_PROTESTANT_SIDE_CHAPEL_ADMIN,
    authority: BookingAuthority.UCC_PROTESTANT_SIDE_CHAPEL,
  });

  const booker = await upsertUser({
    email: "booker@example.com",
    firstName: "Seed",
    lastName: "Booker",
    phone: "+260900000000",
    roleCode: RoleCode.INDIVIDUAL_BOOKER,
  });

  const orgRep = await upsertUser({
    email: "org.rep@example.com",
    firstName: "Seed",
    lastName: "OrgRep",
    roleCode: RoleCode.ORGANISATION_REPRESENTATIVE,
  });

  const sampleOrg = await prisma.organisation.upsert({
    where: { slug: "sample-campus-fellowship" },
    update: {},
    create: {
      name: "Sample Campus Fellowship (Fictional)",
      slug: "sample-campus-fellowship",
      description:
        "This is a fictional organisation created for local development and demonstrations. It is not an official UNZA community.",
      mission: "Placeholder mission statement for development only.",
      vision: "Placeholder vision statement for development only.",
      meetingDays: ["Thursday"],
      meetingTimes: "17:00–19:00 (sample)",
      visitorInfo: "Visitors welcome — this text is fictional seed content.",
      publicEmail: "sample.fellowship@example.com",
      socialLinks: { facebook: "https://example.com", youtube: "https://example.com" },
      profileStatus: ContentStatus.PUBLISHED,
      isPublic: true,
    },
  });

  await prisma.organisationMember.upsert({
    where: {
      organisationId_userId: { organisationId: sampleOrg.id, userId: orgRep.id },
    },
    update: { isPrimary: true },
    create: {
      organisationId: sampleOrg.id,
      userId: orgRep.id,
      title: "Representative",
      isPrimary: true,
    },
  });

  const catholicFacility = await prisma.facility.findUniqueOrThrow({
    where: { code: FacilityCode.CATHOLIC_SIDE_CHAPEL },
  });
  const protestantFacility = await prisma.facility.findUniqueOrThrow({
    where: { code: FacilityCode.PROTESTANT_SIDE_CHAPEL },
  });

  await prisma.organisation.upsert({
    where: { slug: "catholic-side-chapel-community" },
    update: {},
    create: {
      name: "Catholic Side Chapel Community (Placeholder Profile)",
      slug: "catholic-side-chapel-community",
      description: "Institutional placeholder profile for the Catholic Side Chapel. Replace with approved content.",
      isSideChapelAccount: true,
      linkedFacilityId: catholicFacility.id,
      profileStatus: ContentStatus.PUBLISHED,
      isPublic: true,
      meetingDays: ["Sunday"],
      meetingTimes: "Confirm with Catholic Side Chapel administration",
    },
  });

  await prisma.organisation.upsert({
    where: { slug: "ucc-protestant-side-chapel-community" },
    update: {},
    create: {
      name: "UCC / Protestant Side Chapel Community (Placeholder Profile)",
      slug: "ucc-protestant-side-chapel-community",
      description: "Institutional placeholder profile for the Protestant Side Chapel. Replace with approved content.",
      isSideChapelAccount: true,
      linkedFacilityId: protestantFacility.id,
      profileStatus: ContentStatus.PUBLISHED,
      isPublic: true,
      meetingDays: ["Sunday"],
      meetingTimes: "Confirm with UCC administration",
    },
  });

  await prisma.bookingPolicy.upsert({
    where: { slug: "general-booking-policy" },
    update: {},
    create: {
      slug: "general-booking-policy",
      title: "General Facility Booking Policy (Placeholder)",
      body: `This is a development placeholder policy for the UNZA Chapel & Community Portal.

1. Booking requests do not guarantee approval.
2. Each facility is managed by its designated booking authority.
3. Catholic and Protestant Side Chapel bookings are administered independently.
4. Recurring allocations are reviewed occurrence by occurrence when conflicts exist.
5. Official fees, contacts and institutional wording must be supplied by the Chaplaincy.

This text is not an official UNZA document.`,
      isPublished: true,
    },
  });

  const boreholeGallery = Array.from({ length: 14 }, (_, i) => `/images/news/borehole/borehole-${i + 1}.jpg`);

  const boreholeBody = `The University of Zambia (UNZA) Christian Centre has taken a significant step towards addressing its long-standing water supply challenges through the drilling of a borehole at the Centre premises. The initiative comes at a crucial time when the University is undergoing ongoing water and sanitation maintenance works, which have further affected water availability across various sections of the campus.

For many years, the UNZA Christian Centre has experienced intermittent and low water supply, a situation that has often disrupted daily activities, worship services, meetings, and other programmes hosted at the Centre. The challenge became even more pronounced during the current rehabilitation and maintenance works being undertaken on the University's water and sanitation infrastructure.

Recognizing the urgent need for a sustainable solution, the Centre's Administration, led by the Catholic Chaplain and the Council of Churches in Zambia (CCZ) Chaplain, worked closely with UNZA Management to facilitate the drilling of a borehole. This collaborative effort demonstrates a shared commitment to improving service delivery and ensuring that the Christian Centre remains functional and accessible to the university community.

The borehole project is expected to provide a reliable and independent source of water for the Centre, reducing dependence on the main water supply system and mitigating the effects of water interruptions. Once completed and operational, the facility will support various activities conducted at the Centre while also enhancing sanitation and hygiene standards.

Speaking on the development, stakeholders expressed gratitude to UNZA Management for supporting the initiative and recognizing the importance of addressing the Centre's water needs. The project reflects the University's commitment to creating an enabling environment for spiritual, social, and community activities on campus.

The drilling of the borehole marks a major milestone for the UNZA Christian Centre and serves as a practical example of problem-solving through collaboration. By bringing together the efforts of the Centre Administration, the Catholic Chaplaincy, the CCZ Chaplaincy, and UNZA Management, a lasting solution is being implemented to address a challenge that has affected the Centre for a considerable period.

As work progresses, members of the university community remain optimistic that the borehole will greatly improve water availability and contribute to the smooth operation of programmes at the Christian Centre for years to come.`;

  if (superAdmin && booker) {
    const boreholeAnnouncement = await prisma.announcement.findFirst({
      where: { title: "Borehole drilling underway at the Christian Centre" },
    });
    if (boreholeAnnouncement) {
      await prisma.announcement.update({
        where: { id: boreholeAnnouncement.id },
        data: {
          summary:
            "The UNZA Christian Centre is drilling a borehole to address long-standing water supply challenges, with support from the Catholic and CCZ Chaplaincies and UNZA Management.",
          body: boreholeBody,
          status: ContentStatus.PUBLISHED,
          publishedAt: new Date(),
          featured: true,
        },
      });
    } else {
      await prisma.announcement.create({
        data: {
          authorId: superAdmin.id,
          title: "Borehole drilling underway at the Christian Centre",
          summary:
            "The UNZA Christian Centre is drilling a borehole to address long-standing water supply challenges, with support from the Catholic and CCZ Chaplaincies and UNZA Management.",
          body: boreholeBody,
          status: ContentStatus.PUBLISHED,
          publishedAt: new Date(),
          featured: true,
        },
      });
    }

    await prisma.article.upsert({
      where: { slug: "unza-christian-centre-borehole" },
      update: {
        title: "UNZA Christian Centre Drills Borehole to Address Water Supply Challenges",
        summary:
          "The Christian Centre is drilling a borehole to provide a reliable water source during campus water and sanitation maintenance works.",
        body: boreholeBody,
        byline: "Simon Simpasa Jr (student and member of the Catholic Community at UNZA)",
        coverImageUrl: boreholeGallery[0],
        galleryUrls: boreholeGallery,
        photoCaption:
          "Borehole drilling works underway at the UNZA Christian Centre as part of efforts to provide a sustainable solution to the Centre's long-standing water supply challenges.",
        status: ContentStatus.PUBLISHED,
        publishedAt: new Date(),
      },
      create: {
        authorId: superAdmin.id,
        title: "UNZA Christian Centre Drills Borehole to Address Water Supply Challenges",
        slug: "unza-christian-centre-borehole",
        summary:
          "The Christian Centre is drilling a borehole to provide a reliable water source during campus water and sanitation maintenance works.",
        body: boreholeBody,
        byline: "Simon Simpasa Jr (student and member of the Catholic Community at UNZA)",
        coverImageUrl: boreholeGallery[0],
        galleryUrls: boreholeGallery,
        photoCaption:
          "Borehole drilling works underway at the UNZA Christian Centre as part of efforts to provide a sustainable solution to the Centre's long-standing water supply challenges.",
        status: ContentStatus.PUBLISHED,
        publishedAt: new Date(),
      },
    });

    // Remove outdated fictional seed article if present
    await prisma.article.deleteMany({
      where: { slug: "about-development-seed-journal" },
    });

    const boreholeEvent = await prisma.communityEvent.findFirst({
      where: { title: "Borehole drilling at the UNZA Christian Centre" },
    });
    if (!boreholeEvent) {
      await prisma.communityEvent.create({
        data: {
          createdById: superAdmin.id,
          title: "Borehole drilling at the UNZA Christian Centre",
          summary:
            "Drilling works underway to provide a sustainable water supply for worship, meetings, and programmes at the Christian Centre.",
          location: "UNZA Christian Centre",
          startsAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          endsAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
          coverImageUrl: boreholeGallery[0],
          galleryUrls: boreholeGallery,
          status: ContentStatus.PUBLISHED,
          isPublic: true,
        },
      });
    } else {
      await prisma.communityEvent.update({
        where: { id: boreholeEvent.id },
        data: {
          summary:
            "Drilling works underway to provide a sustainable water supply for worship, meetings, and programmes at the Christian Centre.",
          coverImageUrl: boreholeGallery[0],
          galleryUrls: boreholeGallery,
          status: ContentStatus.PUBLISHED,
          isPublic: true,
        },
      });
    }

    const treePlanting = await prisma.communityEvent.findFirst({
      where: { title: "Little hands, planting our future" },
    });
    if (!treePlanting) {
      await prisma.communityEvent.create({
        data: {
          createdById: superAdmin.id,
          title: "Little hands, planting our future",
          summary:
            "A glimpse of the tree planting at the UNZA Christian Centre, in partnership with St Ignatius.",
          location: "UNZA Christian Centre",
          startsAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endsAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
          status: ContentStatus.PUBLISHED,
          isPublic: true,
        },
      });
    } else {
      await prisma.communityEvent.update({
        where: { id: treePlanting.id },
        data: {
          summary:
            "A glimpse of the tree planting at the UNZA Christian Centre, in partnership with St Ignatius.",
          status: ContentStatus.PUBLISHED,
          isPublic: true,
        },
      });
    }

    await prisma.communityEvent.deleteMany({
      where: { title: "Sample Fellowship Evening (Fictional)" },
    });
    await prisma.announcement.deleteMany({
      where: { title: "Welcome to the development portal" },
    });
  }

  await seedCommunityProfiles(prisma);
  await seedGraduationMass2026(prisma);

  await prisma.systemSetting.upsert({
    where: { key: "seed_meta" },
    update: { value: { seededAt: new Date().toISOString(), demoPassword: "see README" } },
    create: {
      key: "seed_meta",
      value: { seededAt: new Date().toISOString(), note: "Fictional development accounts only" },
    },
  });

  console.log("Seed complete.");
  console.log("Demo password for all seed users:", DEMO_PASSWORD);
  console.log("Accounts: superadmin@example.com, chaplaincy.admin@example.com, catholic.admin@example.com, ucc.admin@example.com, booker@example.com, org.rep@example.com");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
