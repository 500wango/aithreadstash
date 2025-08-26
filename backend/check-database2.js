const { AppDataSource } = require('./dist/database/data-source');

async function checkDatabase() {
  try {
    await AppDataSource.initialize();
    console.log('Database connected successfully');
    
    const userRepository = AppDataSource.getRepository('User');
    const users = await userRepository.find();
    console.log('Users in database:', users);
    
    await AppDataSource.destroy();
  } catch (error) {
    console.error('Database error:', error);
  }
}

checkDatabase();