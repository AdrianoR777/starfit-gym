import "server-only";
import { existsSync } from "node:fs";
import path from "node:path";
import { gym } from "./config";

import { instagramProfile } from "./instagram";
import { getSite } from "./site";

export async function logoSrc(): Promise<string | null> {
  const site = await getSite();
  if (site.logo) return site.logo;
  if (gym.logo) return gym.logo;
  const f = ["logo.svg", "logo.png", "logo.webp"].find((n) => existsSync(path.join(process.cwd(), "public/brand", n)));
  if (f) return `/brand/${f}`;
  return (await instagramProfile())?.profile_picture_url ?? null;
}
