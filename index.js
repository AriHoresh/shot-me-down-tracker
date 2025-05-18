const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'data.db');
const db = new sqlite3.Database(DB_PATH);

// initialize database tables
function initDb() {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      username TEXT,
      password TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS shots (
      id INTEGER PRIMARY KEY,
      name TEXT
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS progress (
      user_id INTEGER,
      shot_id INTEGER,
      PRIMARY KEY (user_id, shot_id)
    )`);
  });
}

function seedShots() {
  db.get('SELECT COUNT(*) AS count FROM shots', (err, row) => {
    if (row.count === 0) {
      const stmt = db.prepare('INSERT INTO shots (id, name) VALUES (?, ?)');
      for (let i = 1; i <= 450; i++) {
        stmt.run(i, `Shot ${i}`);
      }
      stmt.finalize();
    }
  });
}

initDb();
seedShots();

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: 'shot-secret',
    resave: false,
    saveUninitialized: false,
  })
);

function ensureAuth(req, res, next) {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  next();
}

app.get('/', (req, res) => {
  if (req.session.userId) {
    res.redirect('/dashboard');
  } else {
    res.redirect('/login');
  }
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.post('/register', async (req, res) => {
  const { email, username, password } = req.body;
  const hash = await bcrypt.hash(password, 10);
  db.run(
    'INSERT INTO users (email, username, password) VALUES (?, ?, ?)',
    [email, username, hash],
    function (err) {
      if (err) {
        return res.render('register', { error: 'Email already used' });
      }
      req.session.userId = this.lastID;
      res.redirect('/dashboard');
    }
  );
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (!user) {
      return res.render('login', { error: 'Invalid credentials' });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.render('login', { error: 'Invalid credentials' });
    }
    req.session.userId = user.id;
    res.redirect('/dashboard');
  });
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

app.get('/dashboard', ensureAuth, (req, res) => {
  db.all('SELECT * FROM shots', (err, shots) => {
    db.all(
      'SELECT shot_id FROM progress WHERE user_id = ?',
      [req.session.userId],
      (err, rows) => {
        const completed = new Set(rows.map((r) => r.shot_id));
        res.render('dashboard', { shots, completed });
      }
    );
  });
});

app.post('/toggle-shot/:id', ensureAuth, (req, res) => {
  const shotId = parseInt(req.params.id, 10);
  db.get(
    'SELECT 1 FROM progress WHERE user_id = ? AND shot_id = ?',
    [req.session.userId, shotId],
    (err, row) => {
      if (row) {
        db.run(
          'DELETE FROM progress WHERE user_id = ? AND shot_id = ?',
          [req.session.userId, shotId],
          () => res.redirect('/dashboard')
        );
      } else {
        db.run(
          'INSERT INTO progress (user_id, shot_id) VALUES (?, ?)',
          [req.session.userId, shotId],
          () => res.redirect('/dashboard')
        );
      }
    }
  );
});

app.get('/stats', ensureAuth, (req, res) => {
  db.all('SELECT COUNT(*) AS total FROM shots', (err, rows) => {
    const totalShots = rows[0].total;
    db.all(
      'SELECT COUNT(*) AS done FROM progress WHERE user_id = ?',
      [req.session.userId],
      (err, rows2) => {
        const done = rows2[0].done;
        res.render('stats', { totalShots, done });
      }
    );
  });
});

// simple leaderboard based on shots completed
app.get('/leaderboard', (req, res) => {
  const sql = `SELECT username, COUNT(progress.shot_id) AS done
               FROM users LEFT JOIN progress ON users.id = progress.user_id
               GROUP BY users.id
               ORDER BY done DESC
               LIMIT 10`;
  db.all(sql, (err, rows) => {
    res.render('leaderboard', { rows });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

