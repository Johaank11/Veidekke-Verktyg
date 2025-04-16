// Script to migrate data from localStorage to Supabase
const supabaseUrl = 'https://tmxnvvzasvozysxighcf.supabase.co';
const supabaseKey = window.SUPABASE_KEY;
const supabase = supabaseClient.createClient(supabaseUrl, supabaseKey);

// Main migration function
async function migrateToSupabase() {
  const resultContainer = document.getElementById('migration-results');
  resultContainer.innerHTML = '<p>Starting migration...</p>';
  
  try {
    // Migrate workplaces
    const workplaces = JSON.parse(localStorage.getItem('workplaces')) || [];
    resultContainer.innerHTML += `<p>Found ${workplaces.length} workplaces in localStorage</p>`;
    
    if (workplaces.length > 0) {
      const { error: workplacesError } = await supabase
        .from('workplaces')
        .upsert(workplaces, { onConflict: 'id' });
      
      if (workplacesError) throw workplacesError;
      resultContainer.innerHTML += `<p class="success">Successfully migrated ${workplaces.length} workplaces to Supabase</p>`;
    }
    
    // Migrate tools
    const tools = JSON.parse(localStorage.getItem('tools')) || [];
    resultContainer.innerHTML += `<p>Found ${tools.length} tools in localStorage</p>`;
    
    if (tools.length > 0) {
      const { error: toolsError } = await supabase
        .from('tools')
        .upsert(tools, { onConflict: 'id' });
      
      if (toolsError) throw toolsError;
      resultContainer.innerHTML += `<p class="success">Successfully migrated ${tools.length} tools to Supabase</p>`;
    }
    
    resultContainer.innerHTML += '<p class="success">Migration completed successfully!</p>';
    resultContainer.innerHTML += '<p>You can now <a href="index.html">return to the main application</a>.</p>';
    
  } catch (error) {
    console.error('Migration error:', error);
    resultContainer.innerHTML += `<p class="error">Error during migration: ${error.message}</p>`;
    resultContainer.innerHTML += '<p>Please check the console for more details.</p>';
  }
}

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('Migration script loaded');
  const startMigrationBtn = document.getElementById('start-migration');
  
  if (startMigrationBtn) {
    console.log('Migration button found, adding event listener');
    startMigrationBtn.addEventListener('click', function() {
      console.log('Migration button clicked');
      migrateToSupabase();
    });
  } else {
    console.error('Migration button not found!');
  }
}); 