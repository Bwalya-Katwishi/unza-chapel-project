import { FacilityCode } from "@prisma/client";

/** Site-wide hero (main promotional photo). */
export const HERO_IMAGE = "/images/hero.jpg";

/** Dedicated Main Chapel listing photo. */
export const MAIN_CHAPEL_IMAGE = "/images/main-chapel.jpg";

/** Fallback for rooms without a dedicated photograph yet. */
export const SECONDARY_FACILITY_IMAGE = "/images/secondary.jpg";

export const SITE_GALLERY = [HERO_IMAGE, MAIN_CHAPEL_IMAGE, SECONDARY_FACILITY_IMAGE] as const;

const DEFAULT_COVER: Record<FacilityCode, string> = {
  MAIN_CHAPEL: MAIN_CHAPEL_IMAGE,
  READING_ROOM: SECONDARY_FACILITY_IMAGE,
  CONFERENCE_ROOM: SECONDARY_FACILITY_IMAGE,
  CATHOLIC_SIDE_CHAPEL: SECONDARY_FACILITY_IMAGE,
  PROTESTANT_SIDE_CHAPEL: SECONDARY_FACILITY_IMAGE,
};

export function defaultCoverForFacility(code: FacilityCode) {
  return DEFAULT_COVER[code];
}

export function facilityCoverUrl(facility: {
  code: FacilityCode;
  coverImageUrl?: string | null;
}) {
  return facility.coverImageUrl || defaultCoverForFacility(facility.code);
}

export function facilityGalleryUrls(facility: {
  code: FacilityCode;
  coverImageUrl?: string | null;
  galleryUrls?: string[] | null;
}) {
  const cover = facilityCoverUrl(facility);
  const extras = (facility.galleryUrls ?? []).filter((url) => url && url !== cover);
  return [cover, ...extras];
}

export const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
