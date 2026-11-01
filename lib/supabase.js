import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// false until real keys are put in the .env file
export const configured = !!url && !!key && !/YOUR-PROJECT|YOUR-ANON/i.test(url + key);

export const supabase = createClient(
  configured ? url : 'https://example.supabase.co',
  configured ? key : 'public-anon-key',
  { auth: { persistSession: true, autoRefreshToken: true } }
);

export const BUCKET = 'media';
