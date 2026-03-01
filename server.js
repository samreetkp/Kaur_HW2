/*
CSC3916 HW2
File: server.js
Description: Web API scaffolding for Movie API
*/

require('dotenv').config();

var express = require('express');
var http = require('http');
var bodyParser = require('body-parser');
var passport = require('passport');
var authController = require('./auth');           // Basic Auth
var authJwtController = require('./auth_jwt');   // JWT Auth
db = require('./db')(); 
var jwt = require('jsonwebtoken');
var cors = require('cors');

var app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(passport.initialize());

var router = express.Router();

/*
Helper function required by assignment
*/
function getJSONObjectForMovieRequirement(req) {
    var json = {
        headers: "No headers",
        key: process.env.UNIQUE_KEY,
        body: "No body"
    };

    if (req.body != null) {
        json.body = req.body;
    }

    if (req.headers != null) {
        json.headers = req.headers;
    }

    return json;
}

/*
========================
SIGNUP ROUTE
========================
*/
router.post('/signup', (req, res) => {
    if (!req.body.username || !req.body.password) {
        return res.json({
            success: false,
            msg: 'Please include both username and password to signup.'
        });
    }

    var newUser = {
        username: req.body.username,
        password: req.body.password
    };

    db.save(newUser); // simple in-memory save
    res.json({
        success: true,
        msg: 'Successfully created new user.'
    });
});

/*
========================
SIGNIN ROUTE (JWT)
========================
*/
router.post('/signin', (req, res) => {

    var user = db.findOne(req.body.username);

    if (!user) {
        return res.status(401).send({
            success: false,
            msg: 'Authentication failed. User not found.'
        });
    }

    if (req.body.password === user.password) {

        var userToken = {
            id: user.id,
            username: user.username
        };

        // IMPORTANT: Use UNIQUE_KEY
        var token = jwt.sign(userToken, process.env.SECRET_KEY, {
            expiresIn: '1h'
        });

        res.json({
            success: true,
            token: token
        });

    } else {
        res.status(401).send({
            success: false,
            msg: 'Authentication failed. Wrong password.'
        });
    }
});


/*
========================
MOVIES ROUTE
========================
*/
router.route('/movies')

    // GET
    .get((req, res) => {
        var o = getJSONObjectForMovieRequirement(req);
        o.status = 200;
        o.message = "GET movies";
        o.query = req.query;
        o.env = process.env.UNIQUE_KEY;
        res.json(o);
    })

    // POST
    .post((req, res) => {
        var o = getJSONObjectForMovieRequirement(req);
        o.status = 200;
        o.message = "movie saved";
        o.query = req.query;
        o.env = process.env.UNIQUE_KEY;
        res.json(o);
    })

    // PUT (JWT REQUIRED)
    .put(authJwtController.isAuthenticated, (req, res) => {
        var o = getJSONObjectForMovieRequirement(req);
        o.status = 200;
        o.message = "movie updated";
        o.query = req.query;
        o.env = process.env.UNIQUE_KEY;
        res.json(o);
    })

    // DELETE (Basic Auth REQUIRED)
    .delete(authController.isAuthenticated, (req, res) => {
        var o = getJSONObjectForMovieRequirement(req);
        o.status = 200;
        o.message = "movie deleted";
        o.query = req.query;
        o.env = process.env.UNIQUE_KEY;
        res.json(o);
    })

    // ALL OTHER METHODS
    .all((req, res) => {
        res.status(405).send({ message: 'HTTP method not supported.' });
    });


/*
========================
REGISTER ROUTES
========================
*/
app.use('/', router);

/*
========================
START SERVER
========================
*/
app.listen(process.env.PORT || 8080);

module.exports = app; // for testing