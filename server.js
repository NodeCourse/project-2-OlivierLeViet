const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const COOKIE_SECRET = 'cookie_secret';
const passport = require('passport');
const LocalStrategy = require('passport-local');
const Sequelize = require('Sequelize');
const app = new express();

//############ DATABASE ##############
const db = new Sequelize('freeproject', 'root', '', {
    host: 'localhost',
    dialect: 'mysql'
});

//Def des users
const Users = db.define('users', {
    username: {
        type: Sequelize.STRING
    },
    password: {
        type: Sequelize.STRING
    },
    email: {
        type: Sequelize.STRING
    }
});

const Guitares = db.define('guitares', {
    category: {
        type: Sequelize.ENUM('classic' || 'Classic', 'Country', 'Jazz' || 'jazz', 'Electric' || 'eletric')
    },
    price: {
        type: Sequelize.INTEGER
    },
    poster: {
        type: Sequelize.STRING
    }
});


//########AUTHETIFICATION###########
//PASSPORT
passport.use(new LocalStrategy((username, password, cb) => {
    Users
        .findOne({where: {username: username, password: password}})
        .then((user) => {
            cb(null, user || false);
        });
}));
passport.serializeUser((user, cb) => {
    cb(null, user.username);
});
passport.deserializeUser((username, cb) => {
    Users
        .findOne({where: {username: username}})
        .then((user) => {
            return cb(null, user || false);
        }).catch(cb);
});


//##############MIDDLEWARE###########
app.set('view engine', 'pug');
app.use(express.static("public"));
app.use(cookieParser(COOKIE_SECRET));
app.use(bodyParser.urlencoded({extended: true}));
app.use(session({secret: COOKIE_SECRET, resave: false, saveUninitialized: false}));
app.use(passport.initialize());
app.use(passport.session());

//##########ROUTING######

app.get('/', (req, res) => {
    Guitares
        .sync()
        .then(() => {
            Guitares
                .findAll()
                .then((guits) => {
                    res.render('home', {user: req.user, guits});
                })
        })
});

app.get('/signin', (req, res) => {
    res.render("signin");
});

//à la connexion
app.post('/api/signin', passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/login',
    })
);


app.get('/signup', (req, res) => {
    res.render("signup");
});

app.post('/api/signup', (req, res) => {
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;
    Users
        .sync()
        .then(() => {
            Users
                .create({username: username, email: email, password: password})
                .then((user) => {
                    req.login(user, () => {
                        res.redirect('/');
                    })
                })

        })

});

app.post('/api/guit', ( req, res) => {
    const posterT = req.user.username;
    const price = req.body.price;
    const cat = req.body.category;
    Guitares
        .sync()
        .then(() => {
            Guitares
                .create({poster: posterT, price: price, category: cat})
                .then((guits) => {
                    req.login(guits, () => {
                        res.redirect('/');
                    })
                })

        })


});

db.sync().then(() => {
    app.listen(3000, () => {
        console.log("Server listening on port: 3000");
    });
});