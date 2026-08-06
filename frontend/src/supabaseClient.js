import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client with the provided URL and Anon Key
// In a real app, these should be in environment variables, but we'll hardcode them based on the user's provided key.
// The project ID is diicgeybjhzfkogafiky from the provided JWT.
const supabaseUrl = 'https://diicgeybjhzfkogafiky.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpaWNnZXliamh6ZmtvZ2FmaWt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0ODQ2NjAsImV4cCI6MjEwMTA2MDY2MH0.rKiJAxqePvj-O0cWD6iSCauEiA3zYIh2tO1fSzszYGk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // This satisfies the "login for long time" requirement
    autoRefreshToken: true,
  }
});
