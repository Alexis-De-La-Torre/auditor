require('dotenv').config()

const express = require('express')
const passport = require('passport')
const Strategy = require('passport-local').Strategy

const mysql = require('mysql2')
const crypto = require('crypto')
const nodemailer = require('nodemailer')

const app = express()

const db = mysql.createConnection({
    host: 'localhost',
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASS,
    database: 'auditor',
})
db.connect()

const transport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASS,
    },
})

function sendEmail (to, subject, msg) {
    return transport.sendMail({
        from: process.env.EMAIL,
        to,
        subject,
        html: msg,
    })
}

app.engine('mustache', require('mustache-express')())
app.set('view engine', 'mustache')
app.set('views', __dirname + '/templates')

app.use(require('body-parser').urlencoded({ extended: true }))
app.use(require('express-session')({
  secret: 'secret',
  resave: false,
  saveUninitialized: false,
}))
app.use(require('cors')())

app.use(passport.initialize())
app.use(passport.session())

const authMsg = (job) => `
    <strong>Acceso no autorizado.</strong><br>
    Favor de entrar con el usuario: "${job}"<br>
    <a href="/administracion">Volver</a><br>
    <a href="/logout">Acceder con otro usuario</a><br>
`

passport.use(new Strategy({ passReqToCallback: true }, (req, userId, password, cb) => {
    db.promise().query('select * from users where id = ?', [userId])
    .then(x => x[0])
    .then(async results => {
        const user = results[0]
        if (!user) return cb(null, false)
        const hash = crypto.createHash('sha256').update(password).digest('hex')
        await db.promise().query('update users set email = ?', [req.body.default_email])
        // if (user.hash !== hash) return cb(null, false)
        return cb(null, user)
    })
    .catch(err => cb(err))
}))

passport.serializeUser((user, cb) => cb(null, user.id))

passport.deserializeUser((userId, cb) => {
    db.promise().query('select * from users where id = ?', [userId])
    .then(x => cb(null, x[0][0]))
    .catch(err => cb(err))
})

const ensureLogin = require('connect-ensure-login')
    .ensureLoggedIn('/iniciar-sesion')

app.get('/', (req, res) => {
    if (!req.user) res.redirect('/iniciar-sesion')
    else res.redirect('/administracion')
})

app.get('/logout', (req, res) => {
    req.logout()
    res.redirect('/')
})

require('./routes/iniciar-sesion')(app, passport, db)
require('./routes/administracion')(app, db, ensureLogin)
require('./routes/auditoria')(app, db, ensureLogin)
require('./routes/registrar-auditoria')(app, db, ensureLogin, sendEmail)
require('./routes/analizar-auditoria')(app, db, ensureLogin, sendEmail)
require('./routes/resolver-auditoria')(app, db, ensureLogin, sendEmail)
require('./routes/revisar-auditoria')(app, db, ensureLogin, sendEmail)
require('./routes/finalizar-auditoria')(app, db, ensureLogin, sendEmail)
require('./routes/generar-acta')(app)

app.use(express.static('public'))

app.listen(process.env.PORT || 80)