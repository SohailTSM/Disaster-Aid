require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error.middleware');

const authRoutes = require('./routes/auth.routes');
const orgRoutes = require('./routes/organizations.routes');
const reqRoutes = require('./routes/requests.routes');
const assignRoutes = require('./routes/assignments.routes');

const app = express();
const PORT = process.env.PORT || 4000;

connectDB(process.env.MONGO_URI);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// simple health route
app.get('/', (req, res) => res.send('DisasterAid API (Phase 1)'));

app.use('/api/auth', authRoutes);
app.use('/api/organizations', orgRoutes);
app.use('/api/requests', reqRoutes);
app.use('/api/assignments', assignRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const requestComponentRoutes = require('./routes/requestComponents.routes');
app.use('/api/request-components', requestComponentRoutes);
