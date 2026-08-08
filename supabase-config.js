const SUPABASE_URL  = 'https://vrapervmwotqbprtjzzv.supabase.co';
const SUPABASE_ANON = 'sb_publishable_eRn094M-jMHaGLQJFxdkAQ_q_M4YDgZ';

const ADMIN_EMAIL = 'abdirizakaabdimohamed@gmail.com';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON);
