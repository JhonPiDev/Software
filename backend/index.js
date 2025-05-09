const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const cors = require('cors');
const router = express.Router();
const multer = require('multer');
const { jsPDF } = require('jspdf');
const { autoTable } = require('jspdf-autotable');
const path = require('path');
const nodemailer = require('nodemailer');


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


app.post('/enviar-correo', (req, res) => {
  const { id } = req.body;

  db.query(`
    SELECT 
      u.correo, 
      u.razon_social, 
      u.nit,
      r.id AS registro_id,
      r.fecha_revision,
      r.estado_prueba,
      r.observaciones
    FROM registros_tecnicos r
    JOIN usuario u ON r.usuario_nit = u.nit
    WHERE r.id = ?
  `, [id], async (err, results) => {
    if (err) {
      console.error('Error en la consulta:', err);
      return res.status(500).json({ error: 'Error en la base de datos' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Registro técnico no encontrado o usuario sin correo.' });
    }

    const {
      nit,
      correo,
      razon_social,
      registro_id,
      fecha_revision,
      estado_prueba,
      observaciones
    } = results[0];

    const fecha = new Date(fecha_revision);
    const fechaFormateada = fecha.toLocaleString('es-CO', {
      dateStyle: 'long',
      timeStyle: 'medium'
    });

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'jhonpinto008@gmail.com',
        pass: 'pfjjwkwdeodyeacw'
      }
    });

    const mailOptions = {
      from: 'jhonpinto008@gmail.com',
      to: correo,
      subject: `Informe de Inspección Técnica – Registro N.º ${registro_id}`,
      html: `
        <p>Estimado/a <strong>${razon_social}</strong>,</p>

        <p>Nos permitimos informarle que el proceso de inspección correspondiente al registro técnico N.º <strong>${registro_id}</strong> ha sido finalizado exitosamente.</p>

        <p>A continuación, encontrará un resumen detallado de la inspección realizada:</p>

        <table style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif;">
          <tr><td><strong>ID del Registro:</strong></td><td>${registro_id}</td></tr>
          <tr><td><strong>NIT:</strong></td><td>${nit}</td></tr>
          <tr><td><strong>Razón Social:</strong></td><td>${razon_social}</td></tr>
          <tr><td><strong>Fecha de Inspección:</strong></td><td>${fechaFormateada}</td></tr>
          <tr><td><strong>Tipo de Prueba:</strong></td><td>${estado_prueba}</td></tr>
          <tr><td><strong>Observaciones:</strong></td><td>${observaciones || 'Ninguna'}</td></tr>
        </table>

        <p>Le recordamos que este informe forma parte del cumplimiento normativo y garantiza que los procedimientos han sido realizados conforme a los estándares establecidos por Truck Services SAS.</p>

        <p>Si tiene alguna duda o desea obtener una copia del acta oficial, no dude en comunicarse con nuestro equipo de soporte.</p>

        <br>
        <p>Gracias por su confianza.</p>

        <p>Atentamente,</p>
        <p><strong>Equipo Técnico de Truck Services SAS</strong></p>
        <p>NIT: 901.705.963-2</p>
        <p>📧 contacto@truckservices.com.co</p>
        <p>🌐 <a href="https://www.truckservices.com.co" target="_blank">www.truckservices.com.co</a></p>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      res.json({ message: 'Correo enviado exitosamente' });
    } catch (error) {
      console.error('Error al enviar correo:', error);
      res.status(500).json({ error: 'Error al enviar el correo' });
    }
  });
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
app.post('/registros_tecnicos', upload.array('imagenes'), (req, res) => {
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

  // 🔍 Validación: Limitar a máximo 10 imágenes
  if (req.files && req.files.length > 10) {
    return res.status(400).json({ message: 'Solo se permiten un máximo de 10 imágenes.' });
  }

  // 🛠 SQL para insertar en la tabla registros_tecnicos
  const sqlRegistro = `
    INSERT INTO registros_tecnicos 
    (usuario_id, material, tipo_tanque, capacidad, anio_fabricacion, producto, 
    presion, temperatura, fecha_prueba, hora_prueba, observaciones, usuario_nit, equipo_id) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const valuesRegistro = [
    userId, material, tipoTanque, capacidad, anioFabricacion,
    producto, presion, temperatura, fechaPrueba, horaPrueba, observaciones,
    selectedNit, selectedTankId
  ];

  // 🔥 Guardar el registro técnico en la base de datos
  db.query(sqlRegistro, valuesRegistro, (err, result) => {
    if (err) {
      console.error('❌ Error al insertar en MySQL:', err);
      return res.status(500).json({ message: 'Error al guardar en la base de datos.' });
    }

    const registroTecnicoId = result.insertId; // Obtener el ID del registro técnico insertado

    // 🔹 Insertar imágenes en la tabla imagenes_registro si existen
    if (req.files && req.files.length > 0) {
      const sqlImagenes = `
        INSERT INTO imagenes_registro (registro_tecnico_id, imagen_base64) 
        VALUES (?, ?)
      `;

      const imagenesPromises = req.files.map(file => {
        const imagenBase64 = file.buffer.toString('base64');
        return new Promise((resolve, reject) => {
          db.query(sqlImagenes, [registroTecnicoId, imagenBase64], (err, result) => {
            if (err) {
              console.error('❌ Error al insertar imagen en MySQL:', err);
              return reject(err);
            }
            resolve(result);
          });
        });
      });

      // Esperar a que todas las imágenes se guarden
      Promise.all(imagenesPromises)
        .then(() => {
          console.log('✅ Registro y sus imágenes guardados con éxito');
          res.status(201).json({ message: 'Registro y sus imágenes guardados correctamente.', id: registroTecnicoId });
        })
        .catch(err => {
          console.error('❌ Error al guardar imágenes:', err);
          res.status(500).json({ message: 'Error al guardar las imágenes.' });
        });
    } else {
      console.log('✅ Registro guardado sin imágenes');
      res.status(201).json({ message: 'Registro guardado correctamente.', id: registroTecnicoId });
    }
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
    ORDER BY rt.id DESC
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
  const { estado_prueba, firma_inspector, inspector_id } = req.body;

  const fecha_revision = new Date(); // Fecha actual

  const query = `
    UPDATE registros_tecnicos 
    SET estado_prueba = ?, firma_inspector = ?, inspector_id = ?, fecha_revision = ?
    WHERE id = ?
  `;

  db.query(query, [estado_prueba, firma_inspector, inspector_id, fecha_revision, id], (err, result) => {
    if (err) {
      console.error('Error al actualizar el estado del registro:', err);
      return res.status(500).json({ message: 'Error en la base de datos' });
    }
    res.status(200).json({ message: 'Registro actualizado correctamente' });
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
  const { nit, razonSocial, direccion, telefono, establecimiento, correo  } = req.body;

  if (!nit || !razonSocial || !direccion  || !telefono || !establecimiento || !correo) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios' });
  }

  try {
    // Insertar el cliente en la base de datos
    const query = 'INSERT INTO usuario (nit, razon_social, direccion, telefono, establecimiento, correo) VALUES (?, ?, ?, ?, ?,?)';
    db.query(query, [nit, razonSocial, direccion, telefono, establecimiento, correo], (err, result) => {
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
  const query = 'SELECT nit, razon_social, direccion, telefono, establecimiento, correo FROM usuario'; // Solo selecciona los campos necesarios
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
  // Consulta principal para obtener los registros técnicos
  const query = `
   SELECT 
  rt.id, rt.material, rt.tipo_tanque, rt.capacidad, rt.anio_fabricacion, 
  rt.producto, rt.presion, rt.temperatura, rt.fecha_prueba, rt.hora_prueba, 
  rt.estado_prueba, rt.observaciones, rt.usuario_nit, rt.equipo_id,firma_inspector,
  e.idtanque AS idtanque, -- ← Este es el campo que necesitas
  e.fabricante AS fabricante,
  u.razon_social AS cliente_nombre,
  u.direccion AS cliente_direccion,
  u.correo AS cliente_correo
  FROM registros_tecnicos rt
  LEFT JOIN usuario u ON rt.usuario_nit = u.nit
  LEFT JOIN equipos e ON rt.equipo_id = e.id;

  `;

  // Consulta para obtener las imágenes asociadas
  const imagesQuery = `
    SELECT 
      ir.registro_tecnico_id,
      ir.imagen_base64
    FROM imagenes_registro ir
    WHERE ir.registro_tecnico_id IN (?)
  `;

  // Primero, obtener todos los registros
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener historial:', err);
      return res.status(500).json({ message: 'Error al obtener historial' });
    }

    // Extraer los IDs de los registros
    const registroIds = results.map(registro => registro.id);

    // Si no hay registros, devolver el array vacío
    if (registroIds.length === 0) {
      return res.json([]);
    }

    // Obtener las imágenes asociadas a los registros
    db.query(imagesQuery, [registroIds], (err, imagesResults) => {
      if (err) {
        console.error('Error al obtener imágenes:', err);
        return res.status(500).json({ message: 'Error al obtener las imágenes' });
      }

      // Asociar las imágenes a los registros
      const registrosConImagenes = results.map(registro => {
        const imagenesRelacionadas = imagesResults
          .filter(image => image.registro_tecnico_id === registro.id)
          .map(image => image.imagen_base64);
        return {
          ...registro,
          imagenes: imagenesRelacionadas.length > 0 ? imagenesRelacionadas : [],
          imagen_base64: imagenesRelacionadas.length > 0 ? imagenesRelacionadas[0] : null // Para compatibilidad con el HTML actual
        };
      });

      console.log('Registros con imágenes:', registrosConImagenes); // Log para depurar
      res.json(registrosConImagenes);
    });
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
      DATE_FORMAT(fecha_registro, '%Y-%m-%d %H:%i:%s') AS fechaRegistro,
      fabricante, 
      idtanque AS idTanque
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

// Actualizar un equipo existente
app.put('/equipos/:id', (req, res) => {
  const { id } = req.params;
  const { material, tipoTanque, capacidad, anioFabricacion, producto, fabricante, idtanque } = req.body;

  const sql = `
    UPDATE equipos 
    SET material = ?, tipo_tanque = ?, capacidad = ?, anio_fabricacion = ?, producto = ?, fabricante = ?, idtanque = ?
    WHERE id = ?
  `;

  db.query(sql, [material, tipoTanque, capacidad, anioFabricacion, producto, fabricante, idtanque, id], (err, result) => {
    if (err) {
      console.error('Error al actualizar el equipo:', err);
      return res.status(500).send('Error al actualizar el equipo');
    }

    res.json({ message: 'Equipo actualizado correctamente' });
  });
});


// Insertar un nuevo equipo
app.post('/equipos', (req, res) => {
  const { material, tipoTanque, capacidad, anioFabricacion, producto, fabricante,idtanque } = req.body;
  const sql = "INSERT INTO equipos (material, tipo_tanque, capacidad, anio_fabricacion, producto, fabricante,idtanque) VALUES (?, ?,?, ?, ?, ?,?)";
  db.query(sql, [material, tipoTanque, capacidad, anioFabricacion, producto, fabricante,idtanque], (err, result) => {
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
  const query = `
    SELECT 
      ats.id, ats.lugar, ats.fecha, ats.procedimiento, ats.nivel_ruido, ats.material_filo, 
      ats.quimicos, ats.iluminacion, ats.ventilacion, ats.caidas, ats.gafas_seguridad, 
      ats.arnes, ats.guantes, ats.casco, ats.usuario_nit, usuario.razon_social AS razon_social
    FROM ats
    JOIN usuario ON ats.usuario_nit = usuario.nit
  `;

  db.query(query, (err, results) => {
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
app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor corriendo en ${port}`);
});
  