const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function getCols() {
  const { data, error } = await supabase.from('garage_vehicles').select('*').limit(1);
  if (error) console.error(error);
  else console.log(data.length ? Object.keys(data[0]) : "No rows, cannot infer completely but no error means table exists");
}
getCols();
