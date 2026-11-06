require('dotenv').config();
const express = require('express'), cors = require('cors'), mongoose = require('mongoose');
const app = express();
app.use(cors()); app.use(express.json());
app.use('/api/students', require('./routes/students'));
mongoose.connect(process.env.MONGO_URI)
  .then(() => app.listen(process.env.PORT || 5000, () => console.log('API running')))
  .catch(e => { console.error('MongoDB connection failed:', e.message); process.exit(1); });
