require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const SteamStrategy = require('passport-steam').Strategy;
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS si usas peticiones fetch desde otro frontend (puedes quitar si no lo necesitas)
app.use(cors({
  origin: 'https://myskins.store',
  credentials: true,
}));

// Sesiones
app.use(session({
  secret: 'un-secretito-muy-seguro',
  resave: false,
  saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

// Passport Steam
passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((obj, done) => {
  done(null, obj);
});

passport.use(new SteamStrategy({
  returnURL: process.env.STEAM_RETURN_URL,
  realm: process.env.STEAM_REALM,
  apiKey: process.env.STEAM_API_KEY,
}, (identifier, profile, done) => {
  return done(null, profile);
}));

// Rutas de autenticación
app.get('/auth/steam',
  passport.authenticate('steam'),
  (req, res) => {});

app.get('/auth/steam/return',
  passport.authenticate('steam', { failureRedirect: '/' }),
  (req, res) => {
    if (!req.user) return res.redirect('/');
    
    const user = req.user;
    const name = user.displayName;
    const avatar = user.photos[2].value;
    const steamid = user.id;

    // Redirige al frontend con los datos como query params
    res.redirect(`https://myskins.store?name=${encodeURIComponent(name)}&avatar=${encodeURIComponent(avatar)}&id=${steamid}`);
  });

app.get('/logout', (req, res) => {
  req.logout(() => {
    res.redirect('https://myskins.store/');
  });
});

// 🚀 Sirve el frontend desde /public
app.use(express.static(path.join(__dirname, 'public')));

// 🧭 Rutas no encontradas redirigen a index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 🟢 Servidor listo
app.listen(PORT, () => {
  console.log(`Servidor escuchando en https://myskins.store o http://localhost:${PORT}`);
});
