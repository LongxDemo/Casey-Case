// Creates a brand-new Supabase auth user (email + password set by the caller)
// and grants them dashboard access via the `admins` table. Needs the service
// role key to call auth.admin.createUser(), which is why this can't be done
// straight from the browser — the admin dashboard calls this function instead.
import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  // supabase-js's functions.invoke() always sends apikey and x-client-info
  // alongside authorization/content-type — a preflight that doesn't allow
  // all four fails in the browser (blocked before the actual POST is even
  // sent), surfacing as "Failed to send a request to the Edge Function"
  // with no server-side log at all, since the request never arrives.
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const url = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Who's calling? Verify via their own JWT against the anon client first.
    const caller = createClient(url, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await caller.auth.getUser();
    if (!user) return json({ ok: false, error: "Not signed in" });

    // Service-role client for the privileged checks/writes below.
    const admin = createClient(url, serviceKey);
    const { data: callerRow } = await admin
      .from("admins")
      .select("role")
      .eq("user_id", user.id)
      .single();
    if (callerRow?.role !== "admin") {
      return json({ ok: false, error: "Only admins can add new admins" });
    }

    const { email, password, role } = await req.json();
    if (typeof email !== "string" || !email.includes("@")) {
      return json({ ok: false, error: "A valid email is required" });
    }
    if (typeof password !== "string" || password.length < 8) {
      return json({ ok: false, error: "Password must be at least 8 characters" });
    }
    if (role !== "admin" && role !== "staff") {
      return json({ ok: false, error: "Role must be 'admin' or 'staff'" });
    }

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (createErr) return json({ ok: false, error: createErr.message });

    const { error: insertErr } = await admin.from("admins").insert({
      user_id: created.user.id,
      email,
      role,
    });
    if (insertErr) {
      // Roll back the auth user so a failed insert doesn't leave an orphaned
      // account with no dashboard row and no way to retry the same email.
      await admin.auth.admin.deleteUser(created.user.id);
      return json({ ok: false, error: insertErr.message });
    }

    return json({ ok: true });
  } catch (e) {
    return json({ ok: false, error: String(e) });
  }
});
