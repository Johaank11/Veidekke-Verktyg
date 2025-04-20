// Simple test script for Supabase connection

document.addEventListener('DOMContentLoaded', function() {
  console.log('Test script loaded');
  
  const testBtn = document.getElementById('test-connection');
  const resultDiv = document.getElementById('test-results');
  
  if (testBtn) {
    testBtn.addEventListener('click', async function() {
      console.log('Test button clicked');§
      resultDiv.innerHTML = '<p>Testing Supabase connection...</p>';
      
      try {
        // Initialize Supabase client
        const supabaseUrl = 'https://tmxnvvzasvozysxighcf.supabase.co';
        const supabaseKey = window.SUPABASE_KEY;
        const supabase = supabaseClient.createClient(supabaseUrl, supabaseKey);
        
        // Test connection with a simple query
        console.log('Testing Supabase connection...');
        const { data, error } = await supabase.from('workplaces').select('count');
        if (error) {
          console.error('Supabase connection test failed:', error);
          resultDiv.innerHTML = `
            <p class="error">Connection failed!</p>
            <p>Error message: ${error.message}</p>
            <p>Please check your Supabase URL and API key.</p>
          `;
        } else {
          console.log('Supabase connection successful, count:', data);
          resultDiv.innerHTML = `
            <p class="success">Connection successful!</p>
            <p>Supabase is properly configured and the connection works.</p>
          `;
        }
      } catch (e) {
        console.error('Supabase test exception:', e);
        resultDiv.innerHTML = `
          <p class="error">Connection failed!</p>
          <p>Error message: ${e.message}</p>
          <p>Please check your Supabase URL and API key.</p>
        `;
      }
    });
  }
}); 