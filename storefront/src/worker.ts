/* Cloudflare Worker behind the storefront: notifies customer support on
 * Telegram when a customer places an order. The order itself is stored in
 * Supabase (orders/order_items) by the client — this worker is just the
 * heads-up ping, so its failure doesn't block placing the order.
 * Secrets (set via `wrangler secret put`): TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID.
 */

type Env = {
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

async function telegram(env: Env, method: string, form: FormData): Promise<void> {
  const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${method}`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Telegram ${method} failed (${res.status}): ${detail.slice(0, 200)}`);
  }
}

const field = (form: FormData, name: string) => {
  const v = form.get(name);
  return typeof v === 'string' ? v.trim() : '';
};

// This endpoint relays whatever files it's handed straight to the Telegram
// Bot API using our own bot token — without a check here, anyone who finds
// the endpoint (it isn't otherwise authenticated) could use it to push
// arbitrary files to that chat, or just abuse it as a free upload relay.
// A real Casey design is always a PNG the app itself generated, so a cheap
// magic-byte check is enough to reject anything that isn't one.
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_TOTAL_BYTES = 40 * 1024 * 1024;

// previewBlob/printBlob are always PNG (html-to-image's default); photo_N
// layers are JPEG (loadAndResizeImage in App.tsx always re-encodes through a
// canvas as JPEG) — accept either real signature regardless of which field.
async function isImageFile(file: File): Promise<boolean> {
  const head = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  const isPng =
    head.length === 8 &&
    head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47 &&
    head[4] === 0x0d && head[5] === 0x0a && head[6] === 0x1a && head[7] === 0x0a;
  const isJpeg = head.length >= 3 && head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
  return isPng || isJpeg;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname !== '/api/send') return json({ error: 'not found' }, 404);
    if (request.method !== 'POST') return json({ error: 'method not allowed' }, 405);
    if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
      return json({ error: 'sending is not configured yet' }, 503);
    }

    const contentLength = Number(request.headers.get('content-length') ?? '0');
    if (contentLength && contentLength > MAX_TOTAL_BYTES) {
      return json({ error: 'request too large' }, 413);
    }

    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return json({ error: 'bad request' }, 400);
    }

    for (const [key, value] of form.entries()) {
      if (!(value instanceof File) || value.size === 0) continue;
      if (key !== 'preview' && key !== 'print' && !key.startsWith('photo_')) continue;
      if (value.size > MAX_FILE_BYTES || !(await isImageFile(value))) {
        return json({ error: `${key} is not a valid image` }, 400);
      }
    }

    const name = field(form, 'name');
    const phone = field(form, 'phone');
    if (!name || !phone) return json({ error: 'name and phone are required' }, 400);
    const email = field(form, 'email');
    const address = field(form, 'address');
    const lat = field(form, 'lat');
    const lng = field(form, 'lng');
    const note = field(form, 'note');
    const model = field(form, 'model');

    // Plain text on purpose — no parse_mode, so user input can't break formatting.
    const caption = [
      '🐰 New Casey case design!',
      '',
      `Phone: ${model || 'unknown model'}`,
      `Name: ${name}`,
      `Phone number: ${phone}`,
      email ? `Email: ${email}` : null,
      address ? `Address: ${address}` : null,
      lat && lng ? `Map: https://maps.google.com/?q=${lat},${lng}` : null,
      note ? `Note: ${note}` : null,
    ].filter((l) => l !== null).join('\n');

    try {
      const preview = form.get('preview');
      // Camera overlay included — a preview of how the real case looks, not
      // what should be printed (see 'print' below).
      if (preview instanceof File && preview.size > 0) {
        const tg = new FormData();
        tg.append('chat_id', env.TELEGRAM_CHAT_ID);
        tg.append('caption', caption);
        tg.append('photo', preview, 'design.png');
        await telegram(env, 'sendPhoto', tg);
      } else {
        const tg = new FormData();
        tg.append('chat_id', env.TELEGRAM_CHAT_ID);
        tg.append('text', caption);
        await telegram(env, 'sendMessage', tg);
      }

      // Camera overlay hidden, full quality — this is the actual file to
      // feed the printing machine (design wraps continuously; the camera
      // hole gets die-cut after printing, so it shouldn't be painted black
      // in the art). sendPhoto above compresses/resizes for the chat
      // thumbnail, so send this separately as an uncompressed document too.
      const print = form.get('print');
      const printFile = print instanceof File && print.size > 0 ? print : preview;
      if (printFile instanceof File && printFile.size > 0) {
        const tgDoc = new FormData();
        tgDoc.append('chat_id', env.TELEGRAM_CHAT_ID);
        tgDoc.append('document', printFile, 'design-print-ready.png');
        tgDoc.append('caption', 'Full-quality print-ready design (camera cutout left continuous — die-cut after printing).');
        await telegram(env, 'sendDocument', tgDoc);
      }

      // Customer's original photos at full quality, for printing — NOT
      // masked, so the camera cutout must be re-applied by hand against
      // design-print-ready.png above before these go to the machine.
      for (const [key, value] of form.entries()) {
        if (key.startsWith('photo_') && value instanceof File && value.size > 0) {
          const tg = new FormData();
          tg.append('chat_id', env.TELEGRAM_CHAT_ID);
          tg.append('document', value, value.name || `${key}.png`);
          tg.append('caption', `Original photo from ${name}'s design (print quality)`);
          await telegram(env, 'sendDocument', tg);
        }
      }
    } catch (e) {
      console.error('send failed:', e instanceof Error ? e.message : e);
      return json({ error: 'could not deliver the design' }, 502);
    }

    return json({ ok: true });
  },
};
