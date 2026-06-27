const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const connectDB = async () => {
  try {
    const { error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error) throw error;
    console.log('✅ Supabase Connected Successfully');
  } catch (error) {
    console.error('❌ Supabase Connection Error:', error.message);
  }
};

module.exports = { supabase, connectDB };