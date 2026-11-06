require('dotenv').config();
const express = require('express'), cors = require('cors'), mongoose = require('mongoose');
const app = express();
app.use(cors()); app.use(express.json());

// Har request par DB connect (connection reuse hota hai)
let conn;
app.use(async (req, res, next) => {
  try {
    conn = conn || mongoose.connect(process.env.MONGO_URI);
    await conn;
    next();
  } catch (e) {
    conn = null;
    res.status(500).json({ message: 'DB connection failed: ' + e.message });
  }
});

app.use('/api/students', require('./routes/students'));

// Local par chalane ke liye (npm run dev)
if (require.main === module) {
  app.listen(process.env.PORT || 5000, () => console.log('API running'));
}

module.exports = app; // Vercel isse use karta hai