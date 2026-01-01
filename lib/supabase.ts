
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lduopukaqjjuqknirrvz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkdW9wdWthcWpqdXFrbmlycnZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyMDU1NTUsImV4cCI6MjA4Mjc4MTU1NX0.4tgPhW06IGY1OF7ofi1iwOAIzd7uK8fY3nznSLOYd5E';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
