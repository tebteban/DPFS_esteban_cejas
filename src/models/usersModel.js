const fs = require('fs');
const path = require('path');
const { v4: uuid } = require('uuid');

const filePath = path.join(__dirname, '../data/users.json');

const readUsers = () => {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, 'utf8') || '[]';
  try { return JSON.parse(content); } catch { return []; }
};

const writeUsers = (users) => {
  fs.writeFileSync(filePath, JSON.stringify(users, null, 2), 'utf8');
};

module.exports = {
  all() {
    return readUsers();
  },
  findById(id) {
    return readUsers().find(u => u.id === id);
  },
  findByEmail(email) {
    return readUsers().find(u => u.email?.toLowerCase() === email?.toLowerCase());
  },
  create(userData) {
    const users = readUsers();
    const newUser = {
      id: uuid(),
      name: userData.name,
      email: userData.email,
      password: userData.password, // ya encriptada antes de llamar
      image: userData.image || 'default.png',
      // podes agregar más campos (role, createdAt, etc.)
    };
    users.push(newUser);
    writeUsers(users);
    return newUser;
  },
  saveAll(users) {
    writeUsers(users);
  }
};
