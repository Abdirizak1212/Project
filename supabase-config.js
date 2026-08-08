// Nadaara Hub — Supabase Configuration
//
// SETUP STEPS:
// 1. Go to https://supabase.com → New Project → "nadaara-hub"
// 2. Settings → API → copy "Project URL" and "anon public" key
// 3. Replace the two values below
// 4. Run db-setup.sql in Supabase → SQL Editor

const SUPABASE_URL  = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON = 'YOUR_SUPABASE_ANON_KEY';

const ADMIN_EMAIL   = 'abdirizakaabdimohamed@gmail.com';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON);
