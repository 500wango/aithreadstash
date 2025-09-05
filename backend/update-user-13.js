const { Client } = require('pg');

async function updateUser() {
  const client = new Client('postgresql://postgres:740135@localhost:5432/aithreadstash');
  
  try {
    await client.connect();
    
    // Update user 13 with Notion connection info
    await client.query(
      'UPDATE users SET "notionAccessToken" = $1, "notionWorkspaceName" = $2 WHERE id = $3',
      ['mock_notion_token_encrypted', 'My Workspace', 13]
    );
    
    // Query the updated user
    const result = await client.query(
      'SELECT id, email, "notionAccessToken", "notionWorkspaceName" FROM users WHERE id = 13'
    );
    
    console.log('Updated user:', result.rows[0]);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

updateUser();