const path = require('path');
const fs = require('fs');

const productsPath = path.join(__dirname, 'products.json');
const usersPath = path.join(__dirname, 'users.json');

// Funciones para productos
function readProducts() {
    try {
        const jsonData = fs.readFileSync(productsPath, 'utf-8');
        return JSON.parse(jsonData);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return [];
        }
        console.error('Error al leer o parsear products.json:', error);
        return [];
    }
}

function writeProducts(products) {
    try {
        fs.writeFileSync(productsPath, JSON.stringify(products, null, 2));
    } catch (error) {
        console.error('Error al escribir en products.json:', error);
    }
}

// Funciones para usuarios
function readUsers() {
    try {
        const jsonData = fs.readFileSync(usersPath, 'utf-8');
        return JSON.parse(jsonData);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return [];
        }
        console.error('Error al leer o parsear users.json:', error);
        return [];
    }
}

function writeUsers(users) {
    try {
        fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
    } catch (error) {
        console.error('Error al escribir en users.json:', error);
    }
}

module.exports = {
    readProducts,
    writeProducts,
    readUsers,
    writeUsers
};