// AUTO-GENERATED from /shared/supabase.ts — do not edit this copy.
// Edit the source file, then run `node shared/sync.mjs` (or just
// `npm install` in admin/ or storefront/, which does it automatically).

import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const hasSupabase = Boolean(url && key);

export const supabase = hasSupabase ? createClient(url!, key!) : null;
