const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const cors = require('cors');
const router = express.Router();
const multer = require('multer');

 // Asegúrate de instalar bcrypt con npm install bcrypt

const app = express();
const port = 3000;
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

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

// Nuevo endpoint para obtener el resumen de actividad
app.get('/api/resumen', (req, res) => {
  const query = `
    SELECT 
      (SELECT COUNT(*) FROM usuario) AS clientes,
      (SELECT COUNT(*) FROM equipos) AS equipos,
      (SELECT COUNT(*) FROM registros_tecnicos) AS certificados
  `;

  db.query(query, (err, result) => {
    if (err) {
      console.error('Error al obtener resumen:', err);
      return res.status(500).json({ message: 'Error al obtener el resumen' });
    }
    res.status(200).json(result[0]);
  });
});


// Ruta para registrar información técnica
app.post('/registros_tecnicos', upload.single('imagen'), (req, res) => {
  console.log('📩 Datos recibidos:', req.body);
  console.log('📸 Imágenes recibidas:', req.files);

  const {
    userId, material, tipoTanque, capacidad, anioFabricacion, producto,
    presion, temperatura, fechaPrueba, horaPrueba, observaciones,
    selectedTankId, selectedNit
  } = req.body;

  // 🔍 Validación: Asegurar que los campos obligatorios están presentes
  if (!userId || !material || !tipoTanque || !capacidad || !anioFabricacion || 
      !producto || !presion || !temperatura || !fechaPrueba || !horaPrueba || 
      !selectedTankId || !selectedNit) {
    return res.status(400).json({ message: 'Todos los campos obligatorios deben estar completos.' });
  }

  // 🔹 Convertir imágenes a Base64 solo si existen
  let imagenesBase64 = null;
  if (req.files && req.files.length > 0) {
    imagenesBase64 = JSON.stringify(req.files.map(file => file.buffer.toString('base64')));
  }
  const imagenBuffer = req.file ? req.file.buffer : null; // Convertir la imagen a binario

  // 🛠 SQL para insertar en la base de datos
  const sql = `
    INSERT INTO registros_tecnicos 
    (usuario_id, material, tipo_tanque, capacidad, anio_fabricacion, producto, 
    presion, temperatura, fecha_prueba, hora_prueba, observaciones, imagenes_base64, usuario_nit, equipo_id) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    userId, material, tipoTanque, capacidad, anioFabricacion,
    producto, presion, temperatura, fechaPrueba, horaPrueba, observaciones,
    imagenBuffer, // Si no hay imágenes, será NULL
    selectedNit, selectedTankId
  ];

  // 🔥 Guardar en la base de datos
  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('❌ Error al insertar en MySQL:', err);
      return res.status(500).json({ message: 'Error al guardar en la base de datos.' });
    }
    console.log('✅ Registro guardado con éxito:', result);
    res.status(201).json({ message: 'Registro guardado correctamente.', id: result.insertId });
  });
});

// Endpoint para obtener todos los registros técnicos con información del cliente
app.get('/registros_tecnicos', (req, res) => {
  const page = parseInt(req.query.page) || 1; // Número de página (por defecto 1)
  const limit = parseInt(req.query.limit) || 10; // Número de registros por página (por defecto 10)
  const offset = (page - 1) * limit; // Calcular el desplazamiento

  // Consulta para obtener el número total de registros
  const countQuery = `SELECT COUNT(*) as total FROM registros_tecnicos`;

  // Consulta para obtener los registros de la página actual
  const query = `
    SELECT 
      rt.*,
      u.nit AS cliente_nit,
      u.razon_social AS cliente_nombre
    FROM registros_tecnicos rt
    LEFT JOIN usuario u ON rt.usuario_nit = u.nit
    LIMIT ? OFFSET ?
  `;

  // Primero, obtener el número total de registros
  db.query(countQuery, (err, countResult) => {
    if (err) {
      console.error('Error al contar registros:', err);
      return res.status(500).json({ message: 'Error al contar los registros' });
    }

    const totalRegistros = countResult[0].total;
    const totalPages = Math.ceil(totalRegistros / limit);

    // Luego, obtener los registros de la página actual
    db.query(query, [limit, offset], (err, results) => {
      if (err) {
        console.error('Error al obtener registros:', err);
        return res.status(500).json({ message: 'Error al obtener los registros' });
      }

      // Devolver los registros y la información de paginación
      res.status(200).json({
        registros: results,
        totalRegistros,
        totalPages,
        currentPage: page
      });
    });
  });
});
// Endpoint para actualizar el estado de un registro
app.put('/registros_tecnicos/:id', (req, res) => {
  const { id } = req.params;
  const { estado_prueba } = req.body;

  const query = `
    UPDATE registros_tecnicos SET estado_prueba = ? WHERE id = ?
  `;

  db.query(query, [estado_prueba, id], (err, result) => {
    if (err) {
      console.error('Error al actualizar estado:', err);
      return res.status(500).json({ message: 'Error al actualizar el estado' });
    }
    res.status(200).json({ message: 'Estado actualizado correctamente' });
  });
});

// Ruta para actualizar un registro técnico
app.put('/registros/:id', (req, res) => {
  const registroId = req.params.id; // Obtén el ID del registro a actualizar
  const { presion, temperatura, fecha_prueba, observaciones } = req.body; // Datos actualizados

  // Formatear la fecha para MySQL
  let formattedFechaPrueba;
  if (fecha_prueba) {
    const date = new Date(fecha_prueba);
    formattedFechaPrueba = date.toISOString().split('T')[0]; // Para DATE (YYYY-MM-DD)
    // Si la columna es DATETIME, usa:
    // formattedFechaPrueba = date.toISOString().replace('T', ' ').split('.')[0]; // Para DATETIME (YYYY-MM-DD HH:mm:ss)
  } else {
    return res.status(400).json({ message: 'El campo fecha_prueba es obligatorio' });
  }

  const query = `
    UPDATE registros_tecnicos
    SET presion = ?, temperatura = ?, fecha_prueba = ?, observaciones = ?
    WHERE id = ?
  `;

  db.query(query, [presion, temperatura, formattedFechaPrueba, observaciones, registroId], (err, result) => {
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

// ** Ruta para registrar un cliente **
app.post('/agregar', async (req, res) => {
  const { nit, razonSocial, direccion, telefono, establecimiento } = req.body;

  if (!nit || !razonSocial || !direccion || !telefono || !establecimiento) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios' });
  }

  try {
    // Insertar el cliente en la base de datos
    const query = 'INSERT INTO usuario (nit, razon_social, direccion, telefono, establecimiento) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [nit, razonSocial, direccion, telefono, establecimiento], (err, result) => {
      if (err) {
        console.error('Error al registrar el cliente:', err);
        return res.status(500).json({ message: 'Error al registrar el cliente' });
      }
      res.status(201).json({ message: 'Cliente registrado correctamente' });
    });
  } catch (error) {
    console.error('Error en el servidor:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// ** Ruta para obtener la lista de clientes **
app.get('/cliente', (req, res) => {
  const query = 'SELECT nit, razon_social, direccion, telefono, establecimiento FROM usuario'; // Solo selecciona los campos necesarios
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener clientes:', err);
      return res.status(500).json({ message: 'Error al obtener clientes' });
    }
    // Devolvemos un 200 con un array vacío si no hay resultados
    res.status(200).json(results.length === 0 ? [] : results);
  });
});
// ** Ruta para eliminar un cliente **
app.delete('/cliente/:nit', (req, res) => {
  const clienteId = req.params.nit;
  console.log('ID recibido en el backend para eliminar:', clienteId); // 👀 Verifica el ID en consola

  const query = 'DELETE FROM usuario WHERE nit = ?';
  db.query(query, [clienteId], (err, result) => {
    if (err) {
      console.error('Error al eliminar cliente:', err);
      return res.status(500).json({ message: 'Error al eliminar cliente' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }
    res.json({ message: 'Cliente eliminado correctamente' });
  });
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

    // Responder con el ID, username y rol del usuario
    return res.status(200).json({
      message: 'Login exitoso',
      id: user.id,         // Envía el ID del usuario
      username: user.username, // Envía el username
      role: user.role      // Envía el rol
    });
  });
});





// Ruta para enlistar un registro técnico
app.get('/registros', (req, res) => {
  const query = `
    SELECT rt.id, rt.material, rt.tipo_tanque, rt.capacidad, rt.anio_fabricacion, 
           rt.producto, rt.presion, rt.temperatura, rt.fecha_prueba, rt.hora_prueba, 
           rt.estado_prueba, rt.observaciones, 
           TO_BASE64(rt.imagenes_base64) AS imagen_base64, rt.usuario_nit, 
           u.razon_social AS cliente_nombre
    FROM registros_tecnicos rt
    LEFT JOIN usuario u ON rt.usuario_nit = u.nit`;

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


// Obtener todos los equipos con validación de datos
app.get('/equipos', (req, res) => {
  const sql = `
    SELECT 
      id, 
      material, 
      tipo_tanque AS tipoTanque, 
      capacidad, 
      anio_fabricacion AS anioFabricacion, 
      producto, 
      DATE_FORMAT(fecha_registro, '%Y-%m-%d %H:%i:%s') AS fechaRegistro 
    FROM equipos 
    ORDER BY fecha_registro DESC`;

  db.query(sql, (err, result) => {
    if (err) {
      console.error('Error al obtener los equipos:', err);
      return res.status(500).json({ error: 'Error al obtener los equipos' });
    }

    // Devolvemos un 200 con un array vacío si no hay equipos
    res.status(200).json(result.length === 0 ? [] : result);
  });
});


// Insertar un nuevo equipo
app.post('/equipos', (req, res) => {
  const { material, tipoTanque, capacidad, anioFabricacion, producto } = req.body;
  const sql = "INSERT INTO equipos (material, tipo_tanque, capacidad, anio_fabricacion, producto) VALUES (?, ?, ?, ?, ?)";
  db.query(sql, [material, tipoTanque, capacidad, anioFabricacion, producto], (err, result) => {
      if (err) return res.status(500).send(err);
      res.json({ message: 'Equipo registrado', id: result.insertId });
  });
});

// Eliminar un equipo
app.delete('/equipos/:id', (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM equipos WHERE id = ?";
  db.query(sql, [id], (err, result) => {
      if (err) return res.status(500).send(err);
      res.json({ message: 'Equipo eliminado' });
  });
});

// *ruta para ingresar los ats*
app.post('/api/ats', (req, res) => {
  const {
    usuario_nit,
    lugar,
    fecha,
    procedimiento,
    nivel_ruido,
    material_filo,
    quimicos,
    iluminacion,
    ventilacion,
    caidas,
    gafas_seguridad,
    arnes,
    guantes,
    casco,
    estado // Nuevo campo
  } = req.body;

  const query = `
    INSERT INTO ats (
      usuario_nit, lugar, fecha, procedimiento, nivel_ruido, material_filo, quimicos, iluminacion, ventilacion, caidas,
      gafas_seguridad, arnes, guantes, casco, estado
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    usuario_nit,
    lugar,
    fecha,
    procedimiento,
    nivel_ruido ? 1 : 0,
    material_filo ? 1 : 0,
    quimicos ? 1 : 0,
    iluminacion ? 1 : 0,
    ventilacion ? 1 : 0,
    caidas ? 1 : 0,
    gafas_seguridad ? 1 : 0,
    arnes ? 1 : 0,
    guantes ? 1 : 0,
    casco ? 1 : 0,
    estado ? 1 : 0 // Guardar el estado (1 o 0)
  ];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error('Error al guardar ATS:', err);
      return res.status(500).json({ message: 'Error al guardar el ATS' });
    }
    res.status(200).json({ message: 'ATS guardado correctamente' });
  });
});
// * Ruta para obtener el historial ATS *
app.get('/api/historial', (req, res) => {
  const usuario_nit = req.query.nit;
  if (!usuario_nit) {
    return res.status(400).json({ message: 'Falta el NIT del cliente' });
  }

  const query = `
    SELECT id, lugar, fecha, procedimiento, nivel_ruido, material_filo, quimicos, iluminacion, ventilacion, caidas, 
           gafas_seguridad, arnes, guantes, casco 
    FROM ats 
    WHERE usuario_nit = ?
  `;

  db.query(query, [usuario_nit], (err, results) => {
    if (err) {
      console.error('Error al obtener los ATS:', err);
      return res.status(500).json({ message: 'Error al obtener los ATS' });
    }
    res.json(results);
  });
});

app.get('/api/ultimo-ats', (req, res) => {
  const usuario_nit = req.query.nit;
  if (!usuario_nit) {
    return res.status(400).json({ message: 'Falta el NIT del cliente' });
  }

  const query = `
    SELECT id, lugar, fecha, procedimiento, nivel_ruido, material_filo, quimicos, iluminacion, ventilacion, caidas, 
           gafas_seguridad, arnes, guantes, casco 
    FROM ats 
    WHERE usuario_nit = ?
    ORDER BY created_at DESC
    LIMIT 1
  `;

  db.query(query, [usuario_nit], (err, results) => {
    if (err) {
      console.error('Error al obtener el último ATS:', err);
      return res.status(500).json({ message: 'Error al obtener el último ATS' });
    }
    if (results.length === 0) {
      return res.json({ noAts: true });
    }
    res.json(results[0]);
  });
});

// Inicia el servidor
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
  