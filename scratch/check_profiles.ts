
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkProfilesSchema() {
    // We can't easily get schema via JS without RPC, but we can try a select to see what fields exist
    const { data, error } = await supabase.from('profiles').select('*').limit(1);
    if (error) {
        console.error('Error fetching profiles:', error);
    } else {
        console.log('Profile columns:', Object.keys(data[0] || {}));
    }
}

checkProfilesSchema();
