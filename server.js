const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/league-quiz')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Session setup with MongoDB store
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/league-quiz'
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
  }
}));

// User Schema
const userSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  currentPage: { type: String, default: 'index' },
  selectedRole: { type: String, default: null },
  quizProgress: {
    score: { type: Number, default: 0 },
    questionsAnswered: { type: Number, default: 0 },
    answers: [{
      questionId: String,
      answer: String,
      correct: Boolean
    }]
  },
  createdAt: { type: Date, default: Date.now },
  lastActive: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// API Routes
app.get('/api/state', async (req, res) => {
  try {
    let user = await User.findOne({ sessionId: req.session.id });
    
    if (!user) {
      user = new User({ sessionId: req.session.id });
      await user.save();
    }
    
    res.json({
      currentPage: user.currentPage,
      selectedRole: user.selectedRole,
      quizProgress: user.quizProgress
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user state' });
  }
});

app.post('/api/state', async (req, res) => {
  try {
    const { currentPage, selectedRole, quizProgress } = req.body;
    
    let user = await User.findOne({ sessionId: req.session.id });
    
    if (!user) {
      user = new User({ sessionId: req.session.id });
    }
    
    if (currentPage) user.currentPage = currentPage;
    if (selectedRole) user.selectedRole = selectedRole;
    if (quizProgress) user.quizProgress = { ...user.quizProgress, ...quizProgress };
    
    user.lastActive = Date.now();
    await user.save();
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user state' });
  }
});

// Serve HTML files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/role-select.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'role-select.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
