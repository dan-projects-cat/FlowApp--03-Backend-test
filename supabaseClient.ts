
import { createClient } from '@supabase/supabase-js';

// --- ACTION REQUIRED ---
// 1. Go to supabase.com
// 2. Create a project
// 3. Go to Project Settings -> API
// 4. Copy the URL and Anon Key below.

const supabaseUrl = 'https://ugtjuwkrsvoiaxygucab.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVndGp1d2tyc3ZvaWF4eWd1Y2FiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5MDM5MjgsImV4cCI6MjA4MTQ3OTkyOH0.pI7RYK8GPQrFy-9ju3CI0dfcgVkmel8dQL5udVndh5M';

export const supabase = createClient(supabaseUrl, supabaseKey);
