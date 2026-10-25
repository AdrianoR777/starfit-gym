import { instagramProfile } from "@/lib/instagram";
import { gym } from "@/lib/config";

export async function IgFeed() {
  const ig = await instagramProfile();
  if (!ig?.media.length) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 pb-28 md:px-8">
      <p className="eyebrow mb-6">Instagram · @{process.env.INSTAGRAM_USERNAME ?? "sstarfitgym"}</p>
      {ig.biography && <p data-reveal className="mb-10 max-w-2xl whitespace-pre-line text-xl">{ig.biography}</p>}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {ig.media.slice(0, 8).map((m) => (
          <a key={m.id} href={m.permalink} target="_blank" rel="noopener" data-zoom className="relative aspect-square overflow-hidden rounded-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={m.media_type === "VIDEO" ? m.thumbnail_url : m.media_url} alt={m.caption?.slice(0, 100) ?? gym.name} className="h-full w-full object-cover" loading="lazy" />
          </a>
        ))}
      </div>
    </section>
  );
}
