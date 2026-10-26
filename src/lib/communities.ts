export const COMMUNITY_FILTERS = [
  { key: "all", label: "All" },
  { key: "catholic", label: "Catholic" },
  { key: "protestant", label: "Protestant" },
  { key: "anglican", label: "Anglican" },
  { key: "sda", label: "SDA" },
  { key: "interdenominational", label: "Interdenominational" },
] as const;

export type CommunityFilterKey = (typeof COMMUNITY_FILTERS)[number]["key"];

export function matchesCommunityFilter(
  affiliation: string | null | undefined,
  filter: string | undefined,
) {
  if (!filter || filter === "all") return true;
  const value = (affiliation || "").toLowerCase();
  switch (filter) {
    case "catholic":
      return value.includes("catholic");
    case "protestant":
      return (
        value.includes("united church") ||
        value.includes("protestant") ||
        value.includes("ucz")
      );
    case "anglican":
      return value.includes("anglican");
    case "sda":
      return value.includes("adventist") || value.includes("sda");
    case "interdenominational":
      return value.includes("interdenominational");
    default:
      return true;
  }
}

export type ScheduleRow = { day: string; detail: string };

/**
 * Turn meetingDays + meetingTimes into a readable schedule list.
 * Supports semicolon-separated day entries (e.g. Anglican seed copy).
 */
export function buildMeetingSchedule(
  meetingDays: string[],
  meetingTimes: string | null | undefined,
): ScheduleRow[] {
  const times = meetingTimes?.trim() || "";
  if (times.includes(";")) {
    return times
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const match = part.match(/^([A-Za-z]+)\s+(.+)$/);
        if (match) return { day: match[1], detail: match[2] };
        return { day: "Meeting", detail: part };
      });
  }

  if (meetingDays.length === 0 && !times) return [];

  if (meetingDays.length === 0) {
    return [{ day: "Weekly", detail: times || "Time to be confirmed" }];
  }

  return meetingDays.map((day) => ({
    day,
    detail: times || "Time to be confirmed",
  }));
}

export function facebookUrl(socialLinks: unknown): string | null {
  if (!socialLinks || typeof socialLinks !== "object" || Array.isArray(socialLinks)) {
    return null;
  }
  const links = socialLinks as Record<string, string>;
  return links.facebook || links.Facebook || null;
}
