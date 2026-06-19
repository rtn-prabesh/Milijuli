const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://rlecivjydbmwyhsfxydg.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsZWNpdmp5ZGJtd3loc2Z4eWRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2ODE5NDIsImV4cCI6MjA5NTI1Nzk0Mn0.pqVW0UnYkXaWZc3Tq4osxF4-5TabYfrpHeJ3_z1k17o";

console.log('Testing connection to:', supabaseUrl);
console.log('Using Anon Key (first 10 chars):', supabaseAnonKey.substring(0, 10) + '...');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runTest() {
  try {
    console.log('Sending test signup request...');
    const { data, error } = await supabase.auth.signUp({
      email: 'test_connection_check@example.com',
      password: 'some-secure-password-12345',
      options: {
        data: {
          full_name: 'Test Connectivity User',
        }
      }
    });

    if (error) {
      console.log('❌ Supabase returned an error response:', error);
    } else {
      console.log('✅ Signup request completed successfully!', data);
    }
  } catch (err) {
    console.error('💥 Catch block threw an error:', err);
  }
}

runTest();
