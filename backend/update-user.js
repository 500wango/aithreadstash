const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'aithreadstash',
  user: 'postgres',
  password: '740135'
});

async function updateUser() {
  try {
    await client.connect();
    
    // Update user 12 with mock notion token
    const updateResult = await client.query(
      'UPDATE users SET "notionAccessToken" = $1, "notionWorkspaceName" = $2 WHERE id = $3',
      ['mock_notion_token_encrypted', 'My Workspace', 12]
    );
    
    console.log('Updated rows:', updateResult.rowCount);
    
    // Check if user exists
    const selectResult = await client.query(
      'SELECT id, email, "notionAccessToken", "notionWorkspaceName" FROM users WHERE id = $1',
      [12]
    );
    
    console.log('User 12:', selectResult.rows[0] || 'User not found');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

updateUser();