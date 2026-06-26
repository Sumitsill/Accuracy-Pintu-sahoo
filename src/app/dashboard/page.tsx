import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import StudentPortalClient from "./StudentPortalClient";

// Server Component fetching initial auth state and profile
export default async function StudentDashboard() {
  const supabase = createClient();
  
  // 1. Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    redirect("/login");
  }

  // 2. Fetch the dynamic profile from the database
  let { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    // If the profile is missing, attempt to create a basic one
    const defaultRole = user.user_metadata?.role || "student";
    const { data: newProfile, error: createError } = await supabase
      .from("profiles")
      .insert([{
        id: user.id,
        email: user.email,
        role: defaultRole,
        is_initialized: false
      }])
      .select()
      .maybeSingle();

    if (createError || !newProfile) {
      redirect("/onboarding");
    }
    profile = newProfile;
  }

  // If email or role is missing in the existing profile, auto-heal them
  if (profile && (!profile.email || !profile.role)) {
    const updatedFields: any = {};
    if (!profile.email && user.email) updatedFields.email = user.email;
    if (!profile.role) updatedFields.role = user.user_metadata?.role || "student";

    if (Object.keys(updatedFields).length > 0) {
      const { data: updatedProfile } = await supabase
        .from("profiles")
        .update(updatedFields)
        .eq("id", user.id)
        .select()
        .maybeSingle();

      if (updatedProfile) {
        profile = updatedProfile;
      }
    }
  }

  if (!profile.is_initialized) {
    redirect("/onboarding");
  }

  // Check if they are an admin and verify their email against the whitelist
  const ALLOWED_ADMINS = ["sumitsill2605@gmail.com", "sg.swapnanil.72@gmail.com", "impintusahoo786@gmail.com"];
  
  if (
    profile.role === "admin" && 
    user.email && 
    ALLOWED_ADMINS.includes(user.email.toLowerCase().trim())
  ) {
    redirect("/admin");
  }

  // If they are not a valid admin, send them to the student portal
  return <StudentPortalClient user={user} profile={profile} />;
}
