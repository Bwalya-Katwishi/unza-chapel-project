import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { AuditAction } from "@prisma/client";
import { writeAuditLog } from "@/lib/audit";
import { auth } from "@/lib/auth/config";
import { canEditFacilityListing, loadAccessContext } from "@/lib/auth/permissions";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_UPLOAD_BYTES,
} from "@/lib/media/facilities";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function uploadsDir() {
  return path.join(process.cwd(), "public", "uploads", "facilities");
}

function extensionFor(type: string) {
  switch (type) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return "jpg";
  }
}

async function loadManagedFacility(facilityId: string, userId: string) {
  const facility = await prisma.facility.findUnique({ where: { id: facilityId } });
  if (!facility) return { error: NextResponse.json({ error: "Facility not found" }, { status: 404 }) };

  const ctx = await loadAccessContext(userId);
  if (!canEditFacilityListing(ctx, facility)) {
    return { error: NextResponse.json({ error: "Forbidden for this facility" }, { status: 403 }) };
  }

  return { facility, ctx };
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const loaded = await loadManagedFacility(id, session.user.id);
  if ("error" in loaded && loaded.error) return loaded.error;
  const facility = loaded.facility!;

  const form = await req.formData();
  const file = form.get("file");
  const role = String(form.get("role") || "cover");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Image file is required" }, { status: 400 });
  }
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Only JPEG, PNG, WebP, or GIF images are allowed" }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "Image must be 8MB or smaller" }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const dir = uploadsDir();
  await mkdir(dir, { recursive: true });
  const filename = `${facility.id}-${Date.now()}.${extensionFor(file.type)}`;
  await writeFile(path.join(dir, filename), bytes);
  const publicUrl = `/uploads/facilities/${filename}`;

  let coverImageUrl = facility.coverImageUrl;
  let galleryUrls = [...facility.galleryUrls];

  if (role === "gallery") {
    galleryUrls = [...galleryUrls, publicUrl];
  } else {
    coverImageUrl = publicUrl;
    if (!galleryUrls.includes(publicUrl)) {
      galleryUrls = [publicUrl, ...galleryUrls.filter((u) => u !== facility.coverImageUrl)];
    }
  }

  const updated = await prisma.facility.update({
    where: { id: facility.id },
    data: { coverImageUrl, galleryUrls },
  });

  await writeAuditLog({
    actorId: session.user.id,
    action: AuditAction.UPDATE,
    entityType: "Facility",
    entityId: facility.id,
    summary: `Uploaded ${role} image for ${facility.name}`,
    metadata: { url: publicUrl, role },
  });

  return NextResponse.json({
    coverImageUrl: updated.coverImageUrl,
    galleryUrls: updated.galleryUrls,
    url: publicUrl,
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const loaded = await loadManagedFacility(id, session.user.id);
  if ("error" in loaded && loaded.error) return loaded.error;
  const facility = loaded.facility!;

  const body = await req.json().catch(() => ({}));
  const coverImageUrl = typeof body.coverImageUrl === "string" ? body.coverImageUrl : null;
  if (!coverImageUrl) {
    return NextResponse.json({ error: "coverImageUrl is required" }, { status: 400 });
  }

  const known = new Set([
    ...(facility.coverImageUrl ? [facility.coverImageUrl] : []),
    ...facility.galleryUrls,
  ]);
  if (!known.has(coverImageUrl) && !coverImageUrl.startsWith("/images/")) {
    return NextResponse.json({ error: "Unknown image URL for this facility" }, { status: 400 });
  }

  const galleryUrls = [
    coverImageUrl,
    ...facility.galleryUrls.filter((u) => u !== coverImageUrl),
  ];

  const updated = await prisma.facility.update({
    where: { id: facility.id },
    data: { coverImageUrl, galleryUrls },
  });

  await writeAuditLog({
    actorId: session.user.id,
    action: AuditAction.UPDATE,
    entityType: "Facility",
    entityId: facility.id,
    summary: `Set cover image for ${facility.name}`,
    metadata: { coverImageUrl },
  });

  return NextResponse.json({
    coverImageUrl: updated.coverImageUrl,
    galleryUrls: updated.galleryUrls,
  });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const loaded = await loadManagedFacility(id, session.user.id);
  if ("error" in loaded && loaded.error) return loaded.error;
  const facility = loaded.facility!;

  const body = await req.json().catch(() => ({}));
  const url = typeof body.url === "string" ? body.url : "";
  if (!url) {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  const galleryUrls = facility.galleryUrls.filter((u) => u !== url);
  const coverImageUrl =
    facility.coverImageUrl === url ? galleryUrls[0] ?? null : facility.coverImageUrl;

  const updated = await prisma.facility.update({
    where: { id: facility.id },
    data: { coverImageUrl, galleryUrls },
  });

  if (url.startsWith("/uploads/facilities/")) {
    const filePath = path.join(process.cwd(), "public", url.replace(/^\//, ""));
    await unlink(filePath).catch(() => undefined);
  }

  await writeAuditLog({
    actorId: session.user.id,
    action: AuditAction.DELETE,
    entityType: "Facility",
    entityId: facility.id,
    summary: `Removed image from ${facility.name}`,
    metadata: { url },
  });

  return NextResponse.json({
    coverImageUrl: updated.coverImageUrl,
    galleryUrls: updated.galleryUrls,
  });
}
