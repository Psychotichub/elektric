// Minimal express app mounting the same routes for testing without starting a listener
require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const authRoutes = require('../src/routes/authRoutes');

const app = express();
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '..', 'Public')));

app.use('/api/auth', authRoutes);

module.exports = app;

