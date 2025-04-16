// Script to set up Supabase tables
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = 'https://tmxnvvzasvozysxighcf.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseKey) {
  console.error('Error: SUPABASE_KEY is not defined in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupTables() {
  try {
    console.log('Setting up Supabase tables...');

    // Add RLS (Row Level Security) policies if needed here
    // For simplicity, we'll assume public access is OK for this example

    // Migrate data from localStorage to Supabase
    await migrateLocalDataToSupabase();

    console.log('Setup complete!');
  } catch (error) {
    console.error('Error setting up tables:', error);
  }
}

async function migrateLocalDataToSupabase() {
  try {
    // Only run this if you want to import existing localStorage data
    if (typeof window !== 'undefined') {
      console.log('Migrating existing data from localStorage to Supabase...');
      
      // Migrate workplaces
      const localWorkplaces = JSON.parse(localStorage.getItem('workplaces')) || [];
      if (localWorkplaces.length > 0) {
        const { error: workplacesError } = await supabase
          .from('workplaces')
          .upsert(localWorkplaces, { onConflict: 'id' });
        
        if (workplacesError) throw workplacesError;
        console.log(`Migrated ${localWorkplaces.length} workplaces to Supabase`);
      }
      
      // Migrate tools
      const localTools = JSON.parse(localStorage.getItem('tools')) || [];
      if (localTools.length > 0) {
        const { error: toolsError } = await supabase
          .from('tools')
          .upsert(localTools, { onConflict: 'id' });
        
        if (toolsError) throw toolsError;
        console.log(`Migrated ${localTools.length} tools to Supabase`);
      }
    }
  } catch (error) {
    console.error('Error migrating data:', error);
  }
}

// Run the setup
setupTables(); 