const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://cxhkpnedzmqwymgiwvir.supabase.co";
const serviceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4aGtwbmVkem1xd3ltZ2l3dmlyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTM1MDYxMCwiZXhwIjoyMDg0OTI2NjEwfQ.tV8yHTa1BpglIM6VcXBHMl4lL9rmYCV0Qaxq8pudM8s";

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function confirmUser() {
  console.log("Starting confirmation...");
  const email = 'rendyaku   n50@gmail.com';
  
  // Find user
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    console.error('Error listing users:', listError);
    return;
  }
  
  const user = users.find(u => u.email === email);
  if (!user) {
    console.error('User not found:', email);
    // Maybe user deleted it? Or hasn't created it properly?
    // User said "sudah saya daftarkan" (I verified/registered it).
    // Let's assume it exists.
    return;
  }

  console.log("Found user:", user.id);

  const { data, error } = await supabase.auth.admin.updateUserById(
    user.id,
    { email_confirm: true }
  );

  if (error) {
    console.error('Error confirming user:', error);
  } else {
    console.log('Successfully confirmed user:', email);
  }
}

confirmUser();
