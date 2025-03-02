const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2'); // Usamos mysql2 en lugar de mysql
const cors = require('cors');

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

// Ruta para manejar el login
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Query para buscar el usuario en la base de datos
  const query = 'SELECT * FROM users WHERE username = ? AND password = ?';
  db.query(query, [username, password], (err, results) => {
    if (err) {
      return res.status(500).send(err); // Error del servidor
    }
    if (results.length > 0) {
      // Usuario encontrado
      res.status(200).send({ message: 'Login successful', user: results[0] });
    } else {
      // Usuario no encontrado
      res.status(401).send({ message: 'Invalid credentials' });
    }
  });
});

// Inicia el servidor
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});