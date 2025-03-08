const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const cors = require('cors');
 // Asegúrate de instalar bcrypt con npm install bcrypt

const app = express();
const port = 3000;

// Configura CORS para permitir solicitudes desde Angular
app.use(cors());

// Configura body-parser para analizar el cuerpo de las solicitudes
app.use(bodyParser.json());

// Configura la conexión a la base de datos MySQL
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '2004', // Cambia esto por tu contraseña
  database: 'login_db',
});

// Conecta a la base de datos
db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

// ** Ruta para registrar un usuario **
// Ruta para registrar usuario
app.post('/register', async (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password || !role) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios' });
  }

  try {
    // Encriptar la contraseña
    
    // Insertar el usuario en la base de datos
    const query = 'INSERT INTO users (username, password, role) VALUES (?, ?, ?)';
    db.query(query, [username, password, role], (err, result) => {
      if (err) {
        console.error('Error al registrar el usuario:', err);
        return res.status(500).json({ message: 'Error al registrar el usuario' });
      }
      res.status(201).json({ message: 'Usuario registrado correctamente' });
    });
  } catch (error) {
    console.error('Error en el servidor:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Ruta para manejar el login
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Buscar el usuario por username
  const query = 'SELECT * FROM users WHERE username = ?';
  db.query(query, [username], (err, results) => {
    if (err) {
      console.error('Error en la consulta:', err);
      return res.status(500).json({ message: 'Error interno del servidor' });
    }

    if (results.length === 0) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }

    const user = results[0];

    // Verificar contraseña (sin hash, solo para pruebas)
    if (user.password !== password) {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }

    // Verificar el rol del usuario
    if (user.role === 'admin') {
      return res.status(200).json({ message: 'Login exitoso', role: 'admin' });
    } else {
      return res.status(200).json({ message: 'Login exitoso', role: 'user' });
    }
  });
});

// ** Ruta para las listas **
app.get('/users', (req, res) => {
  const query = 'SELECT id, username, role FROM users'; // Selecciona solo los campos necesarios
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener usuarios:', err);
      return res.status(500).json({ message: 'Error al obtener usuarios' });
    }
    res.json(results); // Envía la lista de usuarios como respuesta
  });
});

// ** Ruta para eliminar un usuario **
app.delete('/users/:id', (req, res) => {
  const userId = req.params.id;
  const query = 'DELETE FROM users WHERE id = ?';
  db.query(query, [userId], (err, result) => {
    if (err) {
      console.error('Error al eliminar usuario:', err);
      return res.status(500).json({ message: 'Error al eliminar usuario' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.json({ message: 'Usuario eliminado correctamente' });
  });
});

// Inicia el servidor
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});