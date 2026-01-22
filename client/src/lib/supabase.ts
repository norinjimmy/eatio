import { createClient } from '@supabase/supabase-js';

// Hardcoded for mobile - env vars not reliable in production build
const supabaseUrl = 'https://tburnenhlrnlgiismhdg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRidXJuZW5obHJubGdpaXNtaGRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4Mjc2MjYsImV4cCI6MjA4NDQwMzYyNn0.T77bS8sFAX_hajNxUxJXJ7R6GdGB61y0SZJ9wv-CgW4';

// Frontend Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
