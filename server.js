const express = require('express');
const fs = require('fs');

const dotenv = require('dotenv');
dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT;
const DB_PATH = process.env.DB_PATH;

const TRAILERFLIX = (() => {
    try {
        const trailerflixParse = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8')); 
        return trailerflixParse;
    }
    catch(error) {
        console.error('Error al leer el archivo de la base de datos:', error);
    }
    finally {
        console.log(`Base de datos cargada correctamente.`);
    }
})();

app.get('/', (req, res) => {
    res.send(`
        <h1 style="color: #6200ea; font-family: sans-serif;">Bienvenidos a Trailerflix 🎬</h1>
    `);
});

app.get('/catalogo', (req, res) => {
    if (TRAILERFLIX.length === 0) {
        return res.status(404).json({ error: 'El catálogo se encuentra vacío o no pudo ser cargado.' });
    }
    res.json(TRAILERFLIX);
});

app.get('/titulo/:title', (req, res) => {
    const tituloBuscado = req.params.title.toLowerCase();
    const resultados = TRAILERFLIX.filter(item => item.titulo.toLowerCase().includes(tituloBuscado));

    if (resultados.length === 0) {
        return res.status(404).json({ error: `No se encontraron películas o series que coincidan con el título ${req.params.title}.` });
    }

    const resultadoMap = resultados.map(item => ({
        titulo: item.titulo}));
    res.json(resultadoMap);
});

app.get('/categoria/:cat', (req, res) => {
    const categoriaBuscada = req.params.cat.toLowerCase();
    
    if (categoriaBuscada !== 'película' && categoriaBuscada !== 'serie' && categoriaBuscada !== 'pelicula') {
        return res.status(400).json({ error: 'Categoría inválida. Debe buscar por "película" o "serie".' });
    }

    const resultados = TRAILERFLIX.filter(item => item.categoria.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === categoriaBuscada.normalize("NFD").replace(/[\u0300-\u036f]/g, ""));

    if (resultados.length === 0) {
        return res.status(404).json({ error: `No se encontraron registros para la categoría ${req.params.cat}.` });
    }

    res.json(resultados);
});

app.get('/reparto/:act', (req, res) => {
    const actorBuscado = req.params.act.toLowerCase();
    const resultados = TRAILERFLIX.filter(item => item.reparto.toLowerCase().includes(actorBuscado));

    if (resultados.length === 0) {
        return res.status(404).json({ error: `No se encontró ningún título en el que participe el actor/actriz ${req.params.act}.` });
    }

    const resultadoMap = resultados.map(item => ({
        titulo: item.titulo,
        reparto: item.reparto
    }));
    res.json(resultadoMap);
});

app.get('/trailer/:id', (req, res) => {
    const idBuscado = Number(req.params.id);

    if (isNaN(idBuscado)) {
        return res.status(400).json({ error: 'El código ingresado debe ser un número válido.' });
    }

    const item = TRAILERFLIX.find(f => f.id === idBuscado);

    if (!item) {
        return res.status(404).json({ error: `No se encontró ninguna película o serie con el id: ${idBuscado}.` });
    }

    if (!item?.trailer || item?.trailer.trim() === '') {
        return res.status(404).json({
            id: item.id,
            titulo: item.titulo,
            mensaje: 'El título solicitado no tiene un trailer asociado.' 
        });
    }

    res.json({ 
        id: item.id,
        titulo: item.titulo, 
        trailer: item.trailer 
    });
});

app.use((req, res) => {
    res.status(404).json({ error: 'Recurso no encontrado. Verifique la ruta e intente nuevamente.' });
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto http://localhost:${PORT}`);
});