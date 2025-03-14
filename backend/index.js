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
    console.error('Error conectando a MySQL:', err);
    return;
  }
  console.log('✅ Conectado a MySQL');
});

/** 🔹 RUTA PARA OBTENER EL HISTORIAL DE PRUEBAS */
// Ruta para registrar información técnica
app.post('/registros-tecnicos', (req, res) => {
  console.log('📩 Datos recibidos en el backend:', req.body);

  const {
    material,
    tipoTanque,
    capacidad,
    anioFabricacion,
    producto,
    presion,
    temperatura,
    fechaPrueba,
    horaPrueba,
    estadoPrueba,
    observaciones
  } = req.body;

  // Verificación de datos
  if (!material || !tipoTanque || !capacidad || !anioFabricacion || !producto || !presion || !temperatura || !fechaPrueba || !horaPrueba || !estadoPrueba) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
  }

  // Query con nombres de columna corregidos
  const sql = `
    INSERT INTO registros_tecnicos 
    (material, tipo_tanque, capacidad, anio_fabricacion, producto, presion, temperatura, fecha_prueba, hora_prueba, estado_prueba, observaciones) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [material, tipoTanque, capacidad, anioFabricacion, producto, presion, temperatura, fechaPrueba, horaPrueba, estadoPrueba, observaciones];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('❌ Error al insertar en MySQL:', err);
      return res.status(500).json({ message: 'Error al guardar en la base de datos.' });
    }
    console.log('✅ Registro guardado con éxito:', result);
    res.status(201).json({ message: 'Registro de prueba guardado correctamente.', id: result.insertId });
  });
});

// Ruta para actualizar un registro técnico
app.put('/registros/:id', (req, res) => {
  const registroId = req.params.id; // Obtén el ID del registro a actualizar
  const { material, producto, fecha_prueba, estado_prueba } = req.body; // Datos actualizados

  const query = `
    UPDATE registros_tecnicos
    SET material = ?, producto = ?, fecha_prueba = ?, estado_prueba = ?
    WHERE id = ?
  `;

  db.query(query, [material, producto, fecha_prueba, estado_prueba, registroId], (err, result) => {
    if (err) {
      console.error('Error al actualizar registro:', err);
      return res.status(500).json({ message: 'Error al actualizar registro' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Registro no encontrado' });
    }

    res.json({ message: 'Registro actualizado correctamente' });
  });
});

// ** Ruta para registrar un usuario **
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
// Ruta para enlistar un registro técnico
app.get('/registros', (req, res) => {
  const query = 'SELECT id, material, producto, fecha_prueba, estado_prueba FROM registros_tecnicos';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener historial:', err);
      return res.status(500).json({ message: 'Error al obtener historial' });
    }
    res.json(results);
  });
});
// Ruta para eliminar un registro técnico
app.delete('/registros/:id', (req, res) => {
  const registroId = req.params.id;
  console.log('Intentando eliminar registro con ID:', registroId); // Depuración

  const query = 'DELETE FROM registros_tecnicos WHERE id = ?';
  db.query(query, [registroId], (err, result) => {
    if (err) {
      console.error('Error al eliminar registro:', err);
      return res.status(500).json({ message: 'Error al eliminar registro' });
    }

    if (result.affectedRows === 0) {
      console.log('Registro no encontrado'); // Depuración
      return res.status(404).json({ message: 'Registro no encontrado' });
    }

    console.log('Registro eliminado correctamente'); // Depuración
    res.json({ message: 'Registro eliminado correctamente' });
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