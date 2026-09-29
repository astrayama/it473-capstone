import { Readable } from "node:stream";
import { openMediaObject } from "@/lib/storage";
import { isAllowedMediaPath, PRODUCT_FALLBACK } from "@/lib/media";

/**
 * Streams product photos out of the private media bucket:
 *   GET /media/products/sku-1001/images/primary.jpg[?v=<updatedAt>]
 *
 * Only product image paths are served. Missing objects (or a server that isn't allowed
 * to read the bucket yet) redirect to the brand fallback without caching, so photos
 * appear on their own once access is granted.
 */
async function serve(req: Request, ctx: RouteContext<"/media/[...path]">, withBody: boolean) {
  const { path: segments } = await ctx.params;
  const path = segments.map((s) => decodeURIComponent(s)).join("/");
  if (!isAllowedMediaPath(path)) return new Response("Not found", { status: 404 });

  const obj = await openMediaObject(path).catch((err: unknown) => {
    // e.g. no credentials on a dev machine: show the fallback rather than a broken image.
    console.error(`Media unavailable for ${path}:`, (err as Error).message);
    return null;
  });
  if (!obj) {
    return new Response(null, {
      status: 307,
      headers: { Location: new URL(PRODUCT_FALLBACK, req.url).toString(), "Cache-Control": "no-store" },
    });
  }

  const versioned = new URL(req.url).searchParams.has("v");
  const headers = new Headers({
    "Content-Type": obj.contentType,
    "Cache-Control": versioned
      ? "public, max-age=31536000, immutable"
      : "public, max-age=3600, stale-while-revalidate=86400",
    "X-Content-Type-Options": "nosniff",
  });
  if (obj.etag) headers.set("ETag", obj.etag);

  if (obj.etag && req.headers.get("if-none-match") === obj.etag) {
    return new Response(null, { status: 304, headers });
  }
  if (obj.size !== undefined) headers.set("Content-Length", String(obj.size));
  if (!withBody) return new Response(null, { status: 200, headers });

  const stream = obj.file.createReadStream();
  req.signal.addEventListener("abort", () => stream.destroy(), { once: true });
  const body = Readable.toWeb(stream) as unknown as ReadableStream<Uint8Array>;
  return new Response(body, { status: 200, headers });
}

export function GET(req: Request, ctx: RouteContext<"/media/[...path]">) {
  return serve(req, ctx, true);
}

export function HEAD(req: Request, ctx: RouteContext<"/media/[...path]">) {
  return serve(req, ctx, false);
}
