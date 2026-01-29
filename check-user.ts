import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://cxhkpnedzmqwymgiwvir.supabase.co";
// Service role key
const serviceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4aGtwbmVkem1xd3ltZ2l3dmlyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTM1MDYxMCwiZXhwIjoyMDg0OTI2NjEwfQ.tV8yHTa1BpglIM6VcXBHMl4lL9rmYCV0Qaxq8pudM8s";

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function main() {
  const email = 'rendyakun50@gmail.com';
  console.log("Checking user:", email);

  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    console.error("Error listing users:", error);
    return;
  }

  const user = users.find(u => u.email === email);

  if (!user) {
    console.error("User NOT found!");
    return;
  }

  console.log(`User found: ${user.id}`);
  console.log(`Current confirmed_at: ${user.email_confirmed_at}`);

  if (user.email_confirmed_at) {
    console.log("User is ALREADY confirmed.");
  } else {
    console.log("User not confirmed. Confirming now...");
    const { error: updateError } = await supabase.auth.admin.updateUserById(
        user.id,
        { email_confirm: true }
    );
    
    if (updateError) {
        console.error("Failed to confirm:", updateError);
    } else {
        console.log("User confirmed successfully!");
    }
  }
}

main();
