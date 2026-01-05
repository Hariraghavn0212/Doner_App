const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// Check if defaults are still in place
const isPlaceholder = supabaseUrl === 'YOUR_SUPABASE_URL' || supabaseKey === 'YOUR_SUPABASE_ANON_KEY';

if (!supabaseUrl || !supabaseKey || isPlaceholder) {
    console.error('\n' + '='.repeat(60));
    console.error('CRITICAL ERROR: Supabase credentials are missing or invalid.');
    console.error('Please update your .env file with actual values from Supabase.');
    console.error('1. Go to your Supabase Project -> Settings -> API');
    console.error('2. Copy Project URL into SUPABASE_URL');
    console.error('3. Copy anon/public Key into SUPABASE_ANON_KEY');
    console.error('='.repeat(60) + '\n');

    // We export a dummy client that will fail gracefully on usage instead of crashing on load
    // or just export null if you prefer, but createClient throws if args are invalid.
}

let supabase;
try {
    supabase = createClient(
        supabaseUrl === 'YOUR_SUPABASE_URL' ? 'https://placeholder.supabase.co' : supabaseUrl,
        supabaseKey === 'YOUR_SUPABASE_ANON_KEY' ? 'placeholder' : supabaseKey
    );
} catch (err) {
    console.error('Failed to initialize Supabase client:', err.message);
    supabase = null;
}

module.exports = supabase;
