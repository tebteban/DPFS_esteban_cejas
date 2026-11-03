const db = require('./models');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  try {
    await db.User.create({
      firstName: 'Erica',
      lastName: 'Admin',
      email: 'erica@zona6.com',
      password: bcrypt.hashSync('erica123', 10),
      role: 'admin',
      image: 'default.jpg'
    });
    console.log('✅ Admin user Erica created successfully!');
  } catch (error) {
    console.error('❌ Error creating admin:', error);
  } finally {
    process.exit();
  }
}

createAdmin();
