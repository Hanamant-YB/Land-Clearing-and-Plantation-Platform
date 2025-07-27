const express = require('express');
const cors    = require('cors');
require('./config/db');

const userRoutes       = require('./routes/userRoutes');
const landownerRoutes  = require('./routes/landownerRoutes');
const contractorRoutes = require('./routes/contractorRoutes');
const adminRoutes      = require('./routes/adminRoutes');
const photoRoutes      = require('./routes/photoRoutes');
const aiShortlistRoutes = require('./routes/aiShortlistRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const workManagementRoutes = require('./routes/workManagementRoutes');
const paymentManagementRoutes = require('./routes/paymentManagementRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.use('/api/users',       userRoutes);
app.use('/api/landowner',   landownerRoutes);
app.use('/api/contractor',  contractorRoutes);
app.use('/api/admin',       adminRoutes);
app.use('/api/photo',       photoRoutes);
app.use('/api/ai-shortlist', aiShortlistRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/work-progress', workManagementRoutes);
app.use('/api/payments', paymentManagementRoutes);
app.use('/api/feedback', feedbackRoutes);

app.get('/', (req, res) => res.send('Contractor Platform API'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT} and accessible from network`));

module.exports = app;