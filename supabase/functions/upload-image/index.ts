// Every photo the storefront or admin dashboard "uploads" lands here first,
// instead of going straight from the browser to Storage. The browser cannot
// be trusted to report an honest file type or to have actually resized/
// re-encoded what it claims to — a crafted request can set any Content-Type
// and ext it likes. This function sniffs the real magic bytes, decodes the
// image, and re-encodes it from scratch (which also strips any trailing/
// embedded payload a polyglot file might carry), then writes the result with
// the service-role key so the client never gets direct Storage insert access.
import { createClient } from "jsr:@supabase/supabase-js@2";
import { Image, GIF } from "https://deno.land/x/imagescript@1.3.0/mod.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

// Always 200 — errors travel as { ok: false, error } in the body instead of
// HTTP status, since supabase-js's functions.invoke() doesn't surface a JSON
// body from non-2xx responses to the caller.
function json(body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;
const DEFAULT_MAX_DIM = 1600;
const CAMERA_MAX_DIM = 2000;

const BUCKETS = new Set(["design-photos", "admin-assets"]);
const FOLDERS = new Set(["", "camera-modules", "camera-refs"]);
// Any of these require the caller to be a verified admin — plain customer
// photo uploads (default bucket, no folder) stay open to guests.
function requiresAdmin(bucket: string, folder: string) {
  return bucket === "admin-assets" || folder === "camera-modules" || folder === "camera-refs";
}

type Sniffed = "png" | "jpeg" | "gif";

function sniff(bytes: Uint8Array): Sniffed | null {
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) return "png";
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpeg";
  if (
    bytes.length >= 6 &&
    bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38 &&
    (bytes[4] === 0x37 || bytes[4] === 0x39) && bytes[5] === 0x61
  ) return "gif";
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const contentLength = Number(req.headers.get("content-length") ?? "0");
    if (contentLength && contentLength > MAX_UPLOAD_BYTES) {
      return json({ ok: false, error: "File too large" });
    }

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return json({ ok: false, error: "No file provided" });
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return json({ ok: false, error: "File too large" });
    }

    const bucket = String(form.get("bucket") ?? "design-photos");
    const folder = String(form.get("folder") ?? "");
    if (!BUCKETS.has(bucket) || !FOLDERS.has(folder)) {
      return json({ ok: false, error: "Invalid bucket or folder" });
    }

    const url = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (requiresAdmin(bucket, folder)) {
      const authHeader = req.headers.get("Authorization") ?? "";
      const caller = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
      const { data: { user } } = await caller.auth.getUser();
      if (!user) return json({ ok: false, error: "Not signed in" });
      const { data: isAdmin } = await caller.rpc("am_i_admin");
      if (!isAdmin) return json({ ok: false, error: "Admin access required" });
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const format = sniff(bytes);
    if (!format) {
      return json({ ok: false, error: "File is not a recognized PNG, JPEG, or GIF image" });
    }

    // Decode and re-encode from scratch — never write the original bytes.
    // This also discards EXIF/metadata and any trailing data a polyglot file
    // might carry after the image stream itself.
    let decoded: Image;
    try {
      decoded = format === "gif" ? (await GIF.decode(bytes))[0] : await Image.decode(bytes);
    } catch (e) {
      return json({ ok: false, error: `Could not decode image: ${e instanceof Error ? e.message : String(e)}` });
    }

    const maxDim = folder === "camera-modules" || folder === "camera-refs" ? CAMERA_MAX_DIM : DEFAULT_MAX_DIM;
    if (decoded.width > maxDim || decoded.height > maxDim) {
      if (decoded.width >= decoded.height) decoded.resize(maxDim, Image.RESIZE_AUTO);
      else decoded.resize(Image.RESIZE_AUTO, maxDim);
    }

    // PNG/GIF sources may carry real transparency — re-encode as PNG to
    // preserve it. JPEG has no alpha channel, so JPEG back out is safe and
    // keeps photo uploads small.
    const outputPng = format === "png" || format === "gif";
    const outBytes = outputPng ? await decoded.encode(1) : await decoded.encodeJPEG(88);
    const ext = outputPng ? "png" : "jpg";
    const contentType = outputPng ? "image/png" : "image/jpeg";
    const path = `${folder ? folder + "/" : ""}${crypto.randomUUID()}.${ext}`;

    const admin = createClient(url, serviceKey);
    const { error: uploadErr } = await admin.storage.from(bucket).upload(path, outBytes, { contentType });
    if (uploadErr) return json({ ok: false, error: uploadErr.message });

    if (bucket === "admin-assets") {
      return json({ ok: true, path });
    }
    const { data } = admin.storage.from(bucket).getPublicUrl(path);
    return json({ ok: true, publicUrl: data.publicUrl });
  } catch (e) {
    return json({ ok: false, error: String(e) });
  }
});
