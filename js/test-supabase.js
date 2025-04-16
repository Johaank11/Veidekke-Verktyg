// Simple test script for Supabase connection

document.addEventListener('DOMContentLoaded', function() {
  console.log('Test script loaded');
  
  const testBtn = document.getElementById('test-connection');
  const resultDiv = document.getElementById('test-results');
  
  if (testBtn) {
    testBtn.addEventListener('click', async function() {
      console.log('Test button clicked');
      resultDiv.innerHTML = '<p>Testing Supabase connection...</p>';
      
      try {
        // Initialize Supabase client
        const supabaseUrl = 'https://tmxnvvzasvozysxighcf.supabase.co';
        const supabaseKey = window.SUPABASE_KEY;
        const supabase = supabaseClient.createClient(supabaseUrl, supabaseKey);
        
        // Test connection with a simple query
        const { data, error } = await supabase
          .from('workplaces')
          .select('count', { count: 'exact' });
        
        if (error) throw error;
        
        resultDiv.innerHTML = `
          <p class="success">Connection successful!</p>
          <p>Supabase is properly configured and the connection works.</p>
        `;
        
      } catch (error) {
        console.error('Connection error:', error);
        resultDiv.innerHTML = `
          <p class="error">Connection failed!</p>
          <p>Error message: ${error.message}</p>
          <p>Please check your Supabase URL and API key.</p>
        `;
      }
    });
  }
}); 