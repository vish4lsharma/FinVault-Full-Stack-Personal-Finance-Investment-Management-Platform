const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const bankingRoutes = require('./routes/banking');
const financeRoutes = require('./routes/finance');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/banking', bankingRoutes);
app.use('/api/finance', financeRoutes);

app.get('/health', (req, res) => res.json({ status: 'OK' }));

// Swagger setup
try {
    const swaggerDocument = YAML.load('./swagger.yaml');
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch (e) {
    console.log('Swagger not found, skipping api-docs');
}

app.listen(PORT, () => console.log(`Backend listening on port ${PORT}`));
