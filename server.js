const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const { Low, JSONFile } = require('lowdb');
const path = require('path');

const app = express();
const db = new Low(new JSONFile('db.json'));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({ secret: 'shotsecret', resave: false, saveUninitialized: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));

(async () => {
  await db.read();
  db.data = db.data || { users: [] };
  await db.write();
})();

function findUser(username) {
  return db.data.users.find(u => u.name === username);
}

app.get('/', (req, res) => {
  if (!req.session.user) {
    res.render('login');
  } else {
    res.redirect('/shots');
  }
});

app.post('/login', async (req, res) => {
  const { username } = req.body;
  if (!username) return res.redirect('/');
  let user = findUser(username);
  if (!user) {
    user = { name: username, shots: [] };
    db.data.users.push(user);
    await db.write();
  }
  req.session.user = user.name;
  res.redirect('/shots');
});

app.get('/shots', (req, res) => {
  if (!req.session.user) return res.redirect('/');
  const user = findUser(req.session.user);
  res.render('shots', { user });
});

app.post('/shots', async (req, res) => {
  if (!req.session.user) return res.redirect('/');
  const user = findUser(req.session.user);
  const { shotName, location } = req.body;
  const entry = { name: shotName, location, date: new Date().toISOString() };
  user.shots.push(entry);
  await db.write();
  res.redirect('/shots');
});

app.get('/stats', (req, res) => {
  if (!req.session.user) return res.redirect('/');
  const user = findUser(req.session.user);
  const count = user.shots.length;
  const first = user.shots[0] ? new Date(user.shots[0].date) : new Date();
  const days = Math.max(1, Math.ceil((Date.now() - first.getTime()) / (24*60*60*1000)));
  const avg = (count / days).toFixed(2);
  res.render('stats', { count, days, avg });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on ${PORT}`));
