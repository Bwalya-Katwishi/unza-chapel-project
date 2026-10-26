import { ContentStatus, PrismaClient } from "@prisma/client";

/**
 * Campus communities associated with the UNZA Chapel / Christian Centre.
 *
 * SOURCE: each group's public Facebook page, read on 25 Oct 2026.
 * STATUS: unverified. Confirm every detail (and get permission to use
 * logos/photos) with each group's leadership before production.
 * Fields the Facebook page did not show are left empty on purpose.
 */
const SOURCE_NOTE =
  "Details taken from this group's public Facebook page (October 2026) and pending confirmation by the group.";

type CommunityProfile = {
  slug: string;
  name: string;
  affiliation: string;
  description: string;
  meetingDays: string[];
  meetingTimes: string | null;
  visitorInfo: string;
  publicEmail: string | null;
  publicPhone: string | null;
  website: string | null;
  socialLinks: Record<string, string>;
};

export const COMMUNITY_PROFILES: CommunityProfile[] = [
  {
    slug: "unza-catholic-community",
    name: "UNZA Catholic Community",
    affiliation: "Roman Catholic",
    description:
      "The Catholic Community of the University of Zambia (UNZA): a place where Catholic students can commune as one family.",
    meetingDays: [],
    meetingTimes: null,
    visitorInfo: `Based at the University of Zambia, Great East Road Campus. ${SOURCE_NOTE}`,
    publicEmail: "unza.catholichapel.council@gmail.com",
    publicPhone: "+260 977 953 609",
    website: null,
    socialLinks: { facebook: "https://www.facebook.com/unzacatholic" },
  },
  {
    slug: "ucz-unza",
    name: "UCZ UNZA",
    affiliation: "United Church of Zambia (St. Matthews Congregation, Lusaka)",
    description:
      "The UCZ UNZA Main Campus Fellowship, affiliated to St. Matthews Congregation in Lusaka.",
    meetingDays: [],
    meetingTimes: null,
    visitorInfo: `Sunday services are streamed from UCZ St. Matthews Congregation, Olympia, Lusaka. ${SOURCE_NOTE}`,
    publicEmail: null,
    publicPhone: "+260 976 997 687",
    website: null,
    socialLinks: { facebook: "https://www.facebook.com/profile.php?id=100064423190375" },
  },
  {
    slug: "chi-alpha-unza",
    name: "Chi-Alpha Christian Fellowship UNZA",
    affiliation: "Interdenominational",
    description: "An interdenominational fellowship at the University of Zambia.",
    meetingDays: [],
    meetingTimes: null,
    visitorInfo: SOURCE_NOTE,
    publicEmail: "chialphaunza@gmail.com",
    publicPhone: "+260 971 690 728",
    website: null,
    socialLinks: { facebook: "https://www.facebook.com/ChiAlphaUnza" },
  },
  {
    slug: "unza-anglican-church-fellowship",
    name: "UNZA Anglican Church Fellowship",
    affiliation: "Anglican (Cathedral of the Holy Cross, Lusaka)",
    description:
      "The Anglican fellowship on campus. Members meet weekly at the Side Chapel and attend Sunday service at the Anglican Cathedral of the Holy Cross.",
    meetingDays: ["Tuesday", "Thursday", "Saturday", "Sunday"],
    meetingTimes:
      "Tuesday 21:00 Intercessory Prayers; Thursday 21:00-22:00 Fellowship Night at the Side Chapel; Saturday 14:00 Bible Study; Sunday 08:00 Church Service at the Cathedral of the Holy Cross",
    visitorInfo: `Sunday service is at the Anglican Cathedral of the Holy Cross. ${SOURCE_NOTE}`,
    publicEmail: null,
    publicPhone: "+260 970 093 839",
    website: null,
    socialLinks: { facebook: "https://www.facebook.com/profile.php?id=100064825689007" },
  },
  {
    slug: "unza-sda-public-campus-ministries",
    name: "UNZA SDA Public Campus Ministries",
    affiliation: "Seventh-day Adventist",
    description:
      "UNZA Seventh-day Adventist Public Campus Ministries, at the University of Zambia Great East Road main campus, with the sole purpose of leading people to Christ.",
    meetingDays: [],
    meetingTimes: null,
    visitorInfo: `UNZA Great East Road Campus, Lusaka. ${SOURCE_NOTE}`,
    publicEmail: null,
    publicPhone: null,
    website: "https://unzasdacampusministries.com",
    socialLinks: { facebook: "https://www.facebook.com/UNZAPCM" },
  },
  {
    slug: "university-christian-community-ucc",
    name: "University Christian Community (UCC)",
    affiliation: "Interdenominational",
    description:
      "UCC is an inter-denominational church at the University of Zambia Great East Campus. UCC has declared 2026 its Year of Revival and Transformation for the Manifestation of the Glory of God (Isaiah 60:1-2, Romans 13:11, 2 Corinthians 3:18).",
    meetingDays: ["Sunday"],
    meetingTimes: "Sunday service (time and venue to be confirmed)",
    visitorInfo: `University of Zambia, Great East Road Campus, Lusaka. Sunday services are streamed live on the UCC Facebook page. ${SOURCE_NOTE}`,
    publicEmail: null,
    publicPhone: null,
    website: null,
    socialLinks: { facebook: "https://www.facebook.com/profile.php?id=100066396376917" },
  },
];

/** Logo and cover photos downloaded from each group's public Facebook page. */
const COMMUNITY_IMAGES: Record<string, { logoUrl?: string; coverImageUrl?: string }> = {
  "unza-catholic-community": {
    logoUrl: "/images/communities/unza-catholic-community-logo.jpg",
    coverImageUrl: "/images/communities/unza-catholic-community-cover.jpg",
  },
  "ucz-unza": {
    logoUrl: "/images/communities/ucz-unza-logo.jpg",
    coverImageUrl: "/images/communities/ucz-unza-cover.jpg",
  },
  "unza-anglican-church-fellowship": {
    logoUrl: "/images/communities/unza-anglican-church-fellowship-logo.jpg",
    coverImageUrl: "/images/communities/unza-anglican-church-fellowship-cover.jpg",
  },
  "unza-sda-public-campus-ministries": {
    logoUrl: "/images/communities/unza-sda-public-campus-ministries-logo.jpg",
  },
  "university-christian-community-ucc": {
    coverImageUrl: "/images/communities/university-christian-community-ucc-cover.jpg",
  },
};

/**
 * Hidden from the public site (archived, not deleted):
 * - grace-gospel-dominion-fellowship: replaced by University Christian Community (UCC) on 26 Oct 2026.
 * - the three fictional placeholder profiles from the demo seed, so they aren't confused with real groups.
 */
const RETIRED_COMMUNITY_SLUGS = [
  "grace-gospel-dominion-fellowship",
  "sample-campus-fellowship",
  "catholic-side-chapel-community",
  "ucc-protestant-side-chapel-community",
];

export async function seedCommunityProfiles(prisma: PrismaClient) {
  for (const p of COMMUNITY_PROFILES) {
    const data = {
      ...p,
      ...(COMMUNITY_IMAGES[p.slug] ?? {}),
      profileStatus: ContentStatus.PUBLISHED,
      isPublic: true,
    };
    await prisma.organisation.upsert({
      where: { slug: p.slug },
      update: data,
      create: data,
    });
  }
  // Profiles that were replaced: archive (hide) rather than delete, so nothing linked to them breaks.
  await prisma.organisation.updateMany({
    where: { slug: { in: RETIRED_COMMUNITY_SLUGS } },
    data: { isPublic: false, profileStatus: ContentStatus.ARCHIVED },
  });
  console.log(`Seeded ${COMMUNITY_PROFILES.length} community profiles (from public Facebook pages, unverified).`);
}

const GRADUATION_GALLERY = Array.from(
  { length: 9 },
  (_, i) => `/images/events/graduation-mass-2026/graduation-mass-${i + 1}.jpg`,
);

const GRADUATION_BODY = `"UNZA Catholic Community was full of Thanksgiving and Gratitude during the Graduation Mass 2026.... Thank you all for the Prayers, Collaboration and Generous Support."

Photos and text shared publicly on Facebook by Emmanuel Haambokoma on 26 May 2026. Further details of the Mass are pending confirmation by the UNZA Catholic Community.`;

/** Graduation Mass 2026 photo story for the UNZA Catholic Community. */
export async function seedGraduationMass2026(prisma: PrismaClient) {
  const org = await prisma.organisation.findUnique({ where: { slug: "unza-catholic-community" } });
  const author =
    (await prisma.user.findUnique({ where: { email: "chaplaincy.admin@example.com" } })) ??
    (await prisma.user.findUnique({ where: { email: "superadmin@example.com" } }));
  if (!author) return;
  const data = {
    organisationId: org?.id ?? null,
    title: "Graduation Mass 2026 at the UNZA Catholic Community",
    summary:
      "The UNZA Catholic Community gathered in thanksgiving and gratitude for the Graduation Mass 2026.",
    body: GRADUATION_BODY,
    byline: "Photos: Emmanuel Haambokoma",
    coverImageUrl: GRADUATION_GALLERY[0],
    galleryUrls: GRADUATION_GALLERY,
    photoCaption: "Graduation Mass 2026, UNZA Catholic Community. Photos: Emmanuel Haambokoma.",
    status: ContentStatus.PUBLISHED,
    publishedAt: new Date("2026-05-26T12:00:00+02:00"),
  };
  await prisma.article.upsert({
    where: { slug: "graduation-mass-2026" },
    update: data,
    create: { ...data, slug: "graduation-mass-2026", authorId: author.id },
  });
  console.log("Seeded Graduation Mass 2026 article.");
}
