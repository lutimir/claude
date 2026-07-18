import { revalidateTag } from "next/cache";
import { CATALOG_TAG } from "@/lib/cachedQueries";

/** Invalidácia katalógovej cache — volá worker po každom importe. */
export async function POST(request: Request): Promise<Response> {
  const secret = process.env.REVALIDATE_SECRET;
  const authorization = request.headers.get("authorization");
  if (!secret || authorization !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  revalidateTag(CATALOG_TAG);
  return Response.json({ revalidated: true, at: new Date().toISOString() });
}
