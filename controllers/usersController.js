

const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const { readUsers, writeUsers } = require('../data/models');

const usersController = {
    postRegister: (req, res) => {
        const { firstName, lastName, email, password, dob, gender } = req.body;
        const usersData = readUsers();

        let errorMessage = null;
        if (!firstName || !lastName || !email || !password) {
            errorMessage = 'Todos los campos obligatorios deben ser completados.';
        } else if (!email.includes('@') || !email.includes('.')) {
            errorMessage = 'Por favor, introduce un email válido.';
        } else if (password.length < 8) {
            errorMessage = 'La contraseña debe tener al menos 8 caracteres.';
        } else if (usersData.some(user => user.email === email)) {
            errorMessage = 'Este email ya está registrado.';
        }

        if (errorMessage) {
            return res.status(400).render('users/register', { message: errorMessage });
        }

        bcrypt.hash(password, 10, (err, hashedPassword) => {
            if (err) {
                console.error('Error al hashear la contraseña:', err);
                return res.status(500).render('users/register', { message: 'Error del servidor.' });
            }

            const newUser = {
                id: uuidv4(),
                firstName,
                lastName,
                email,
                password: hashedPassword,
                category: "cliente",
                image: "/images/users/default.jpg",
                dob: dob || null,
                gender: gender || null
            };

            usersData.push(newUser);
            writeUsers(usersData);

            res.redirect('/sign_in?registrationSuccess=true');
        });
    },
};

module.exports = usersController;