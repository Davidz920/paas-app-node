const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Cadena de conexión obligatoria mediante Variable de Entorno
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// Inicialización de tabla en PostgreSQL
async function initDB() {
  try {
    if (process.env.DATABASE_URL) {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS tareas (
          id SERIAL PRIMARY KEY,
          titulo VARCHAR(150) NOT NULL,
          completada BOOLEAN DEFAULT FALSE,
          fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('Tabla de tareas verificada/creada en PostgreSQL');
    }
  } catch (err) {
    console.error('Error inicializando base de datos:', err.message);
  }
}
initDB();

// Endpoint raíz informativo
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    servicio: 'PaaS App 2 - Stack Node.js/Express',
    db_conectada: Boolean(process.env.DATABASE_URL),
    endpoints: {
      listar_tareas: 'GET /api/tareas',
      crear_tarea: 'POST /api/tareas',
      eliminar_tarea: 'DELETE /api/tareas/:id'
    }
  });
});

// Endpoint GET: Listar registros
app.get('/api/tareas', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM tareas ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint POST: Crear registro
app.post('/api/tareas', async (req, res) => {
  const { titulo } = req.body;
  if (!titulo) return res.status(400).json({ error: 'El campo titulo es requerido' });
  try {
    const { rows } = await pool.query(
      'INSERT INTO tareas (titulo) VALUES ($1) RETURNING *',
      [titulo]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint DELETE: Eliminar registro
app.delete('/api/tareas/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM tareas WHERE id = $1', [id]);
    res.json({ mensaje: `Tarea ${id} eliminada exitosamente` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Servidor API corriendo en el puerto ${port}`);
});
