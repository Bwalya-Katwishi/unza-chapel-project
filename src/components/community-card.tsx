import Image from "next/image";
import Link from "next/link";

type CommunityCardProps = {
  slug: string;
  name: string;
  affiliation?: string | null;
  coverImageUrl?: string | null;
  logoUrl?: string | null;
};

export function CommunityCard({
  slug,
  name,
  affiliation,
  coverImageUrl,
  logoUrl,
}: CommunityCardProps) {
  return (
    <Link href={`/communities/${slug}`} className="community-card ui-card--interactive">
      <div className="community-card-cover">
        {coverImageUrl ? (
          <Image
            src={coverImageUrl}
            alt=""
            fill
            sizes="(max-width: 720px) 100vw, 33vw"
            className="community-card-cover-img"
          />
        ) : (
          <div className="community-card-cover-fallback" aria-hidden />
        )}
      </div>
      {logoUrl ? (
        <div className="community-card-logo">
          <Image
            src={logoUrl}
            alt=""
            width={64}
            height={64}
            className="community-card-logo-img"
          />
        </div>
      ) : (
        <div className="community-card-logo community-card-logo--empty" aria-hidden />
      )}
      <div className="community-card-body">
        <h3>{name}</h3>
        {affiliation ? <p>{affiliation}</p> : null}
      </div>
    </Link>
  );
}
