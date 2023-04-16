const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cors = require('cors');
const uuid = require('uuid');
const { check, validationResult } = require('express-validator'); // Import check and validationResult from express-validator library

const dotenv = require('dotenv');
dotenv.config(); // Load environment variables from .env file

const app = express();
const passport = require('passport');
require('./passport');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(morgan('common'));
app.use(express.static('public'));
app.use(cors());
app.use(passport.initialize());

let auth = require('./auth')(app); // (app) ensures, that Express is available in auth.js file as well

const mongoose = require('mongoose');
const Models = require('./models.js');

const Movies = Models.Movie;
const Users = Models.User;


// Set allowed origins and handle CORS middleware
const allowedOrigins = [
  'https://myflix-bjxg.onrender.com',
'https://myflix4movies.netlify.app',
'http://localhost:1234',
   'http://localhost:8080',
  ]; 
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});


// Connect to MongoDB database
mongoose.set('strictQuery', false);
mongoose.connect(process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Error connecting to MongoDB:', err));


// Default text response
app.get('/', (req, res) => {
  console.log('Welcome to myFlix!');
  res.send('Welcome to myFlix!');
});
app.get('/documentation', (req, res) => {                  
  console.log('Documentation Request');
  res.sendFile('public/Documentation.html', {root: __dirname});
});

app.get('/users', passport.authenticate('jwt',{session:false}), (req, res) => {
  Users.find()
    .then((users) => {
      res.status(201).json(users);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

app.get('/movies', passport.authenticate('jwt',{session:false}), (req, res) => {
  Movies.find({ Movies: req.params.Movies })
    .then((movies) => {
      res.json(movies);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

app.get('/users/:Username', passport.authenticate('jwt',{session:false}), (req, res) => {
  Users.findOne({ Username: req.params.Username })
    .then((user) => {
      res.json(user);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

app.get('/movies/:Title', passport.authenticate('jwt',{session:false}), (req, res) => {
  Movies.findOne({ Title: req.params.Title })
    .then((movies) => {
      res.json(movies);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

app.get('/movies/genre/:genreName', passport.authenticate('jwt',{session:false}), (req, res) => {
  Movies.findOne({ 'Genre.Name': req.params.genreName })
    .then((movies) => {
      res.json(movies.Genre);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

app.get('/movies/director/:directorName', passport.authenticate('jwt',{session:false}), (req, res) => {
  Movies.findOne({ 'Director.Name': req.params.directorName })
    .then((movies) => {
      res.json(movies.Director);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});


//CREATE
app.post('/users',
  [
    check('Username', 'Username is required').isLength({min: 3}),
    check('Username', 'Username contains non alphanumeric characters - not allowed.').isAlphanumeric(),
    check('Password', 'Password is required').not().isEmpty(),
    check('Email', 'Email does not appear to be valid').isEmail()
  ], (req, res) => {

  // check the validation object for errors
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    let hashedPassword = Users.hashPassword(req.body.Password);
    Users.findOne({ Username: req.body.Username }) // Search if username already exists
      .then((user) => {
        if (user) {
          //If the user is found, send a response that it already exists
          return res.status(400).send(req.body.Username + ' already exists');
        } else {
          Users
            .create({
              Username: req.body.Username,
              Password: hashedPassword,
              Email: req.body.Email,
              Birthday: req.body.Birthday
            })
            .then((user) => { res.status(201).json(user) })
            .catch((error) => {
              console.error(error);
              res.status(500).send('Error: ' + error);
            });
        }
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send('Error: ' + error);
      });
  });

app.post('/users/:Username/movies/:id', passport.authenticate('jwt',{session:false}), (req, res) => {
  Users.findOneAndUpdate({ Username: req.params.Username },
                          {$addToSet:{favoriteMovieList: req.params.id}},
                          req.body,
                          { new: true })
  .then((updatedUser) => {
    res.status(200).json(updatedUser);
  })
  .catch(error => {
    res.status(500).json({ error: error.message });
  });
});


//UPDATE
app.put('/users/:Username', passport.authenticate('jwt',{session:false}), (req, res) => {
  Users.findOneAndUpdate({ Username: req.params.Username }, { $set:
    {
      Username: req.body.Username,
      Password: req.body.Password,
      Email: req.body.Email,
      Birthday: req.body.Birthday
    }
  },
  { new: true })
  .then((updatedUser) => {
    res.status(200).json(updatedUser);
  })
  .catch(error => {
    res.status(500).json({ error: error.message });
  });
});


//DELeTE
app.delete('/users/:Username', passport.authenticate('jwt',{session:false}), (req, res) => {
  Users.findOneAndRemove({ Username: req.params.Username })
    .then((user) => {
      if (!user) {
        res.status(400).send(req.params.Username + ' was not found');
      } else {
        res.status(200).send(req.params.Username + ' was deleted.');
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

app.delete('/users/:Username/movies/:id', passport.authenticate('jwt',{session:false}), (req, res) => {
  Users.findOneAndUpdate({ Username: req.params.Username },
                          {$pull:{favoriteMovieList: req.params.id}},
                          req.body,
                          { new: true })
  .then((updatedUser) => {
    res.status(200).json(updatedUser);
  })
  .catch(error => {
    res.status(500).json({ error: error.message });
  });
});


// Morgan middleware error handling function
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Uh oh, something went wrong');
});
//variable port listening
const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0',() => {
 console.log('Listening on Port ' + port);
});