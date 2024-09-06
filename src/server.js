const express = require('express');
const server = express();

server.all(`/`, (req, res) => {
    res.send(`Result: [OK].`);
});

function keepAlive() {
    server.listen(3000, () => {
        const now = new Date();
        console.log(`¡El servidor está arriba! | ` + now.toLocaleString('es-CL'));
    });
}

module.exports = keepAlive;