require('dotenv').config();
const express = require('express');
const http = require('http');

const app = express();
const server = http.Server(app);

app.use(express.static('public'));

const PORT = process.env.PORT || process.env.LOCAL_PORT;
server.listen(PORT, () => console.log(`Listening on port ${PORT}`));