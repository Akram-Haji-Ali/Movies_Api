const express = require('express'),
bodyParser = require('body-parser'),
uuid = require('uuid'),
morgan = require('morgan'),
fs = require('fs'),
path = require('path');
require('dotenv').config()
const bcrypt = require('bcrypt');
const saltRounds = 10;


const app = express();
const mongoose = require('mongoose');
const Models = require('./models.js');
const { check, validationResult } = require('express-validator');

mongoose.set('strictQuery', true);



const Movies = Models.Movie;
const Users = Models.User;
const Genres = Models.Genre;
const Directors = Models.Director;

// This allows mongoose connect to the local database 
//mongoose.connect('mongodb://127.0.0.1:27017/myFlix', { useNewUrlParser: true, useUnifiedTopology: true});

//// This allows mongoose connect to the online database 

mongoose.connect( process.env.CONNECTION_URL, { useNewUrlParser: true, useUnifiedTopology: true});


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); //bodyParser middle ware function

//use CORS within the application
const cors = require('cors');
app.use(cors());

// to import auth.js file... the (app) argument is to ensure Express is available in the auth.js file as well
let auth = require('./auth')(app); 

//to require passport module and import passport.js file
const passport = require('passport');
require('./passport');

//fs.createWriteStream is used to create a write stream while path.join appends it to log,txt file
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), {flags: 'a'})
app.use(morgan('common', {stream: accessLogStream}));
app.use(express.static('public'));

//default text response
app.get('/', (req, res) => {
  res.send('Welcome to MyFlix!');
});

// get all movies and return json object
app.get('/movies', (req, res) => {
  Movies.find()
  .then((movies) => {
    res.status(200).json(movies);
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send('Error: ' + err);
  });
});

// get movies by title
app.get('/movies/:title', (req, res) => {
  Movies.findOne({ Title: req.params.title})
  .then((movie) => {
    res.status(200).json(movie);
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send('Error: ' + err);
  });
});

//Get genre by Name
app.get('/movies/genres/:Name', (req, res) => {
  Movies.findOne({ "Genre.Name": req.params.Name})
  .then((movies) => {
    res.send(movies.Genre);
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send('Error: ' + err);
  });
});

//Get director data by Name
app.get('/movies/directors/:Name', (req, res) => {
  Movies.findOne({"Director.Name": req.params.Name})
  .then((movies) => {
    res.send(movies.Director);
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send('Error: ' + err);
  });
});

// Get all user (Read in Mongoose)
app.get('/users', passport.authenticate('jwt', { session: false }), (req, res) => {
  Users.find()
  .then((users) => {
    res.status(201).json(users);
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send('Error: ' + err);
  });
});

//Get a user by username
app.get('/users/:Name', passport.authenticate('jwt', { session: false }), (req, res) => {
  Users.findOne({ Name: req.params.Name})
  .then((User) => {
    res.status(200).json(User)
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send('Error ' + err)
  })
})

app.post('/users', [
  check('Name', 'Name is required').isLength({ min: 5 }),
  check('Name', 'Name contains non alphanumeric characters - not allowed.').isAlphanumeric(),
  check('Password', 'Password is required').not().isEmpty(),
  check('Email', 'Email does not appear to be valid').isEmail()
], (req, res) => {
  let errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  bcrypt.hash(req.body.Password, saltRounds, (err, hashedPassword) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error: ' + err);
    }
    Users.findOne({ Name: req.body.Name })
      .then((user) => {
        if (user) {
          return res.status(400).send(req.body.Name + ' already exists');
        } else {
          Users.create({
              Name: req.body.Name,
              Password: hashedPassword, // Store hashed password
              Email: req.body.Email,
              Birthday: req.body.Birthday
            })
            .then((user) => {
              res.status(201).json(user)
            })
            .catch((error) => {
              console.error(error);
              res.status(500).send('Error: ' + error);
            })
        }
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send('Error: ' + error);
      });
  });
});


app.put(
  '/users/:Name',
  [
    check('Name', 'Name is required').isLength({ min: 5 }),
    check('Name','Name contains non alphanumeric characters - not allowed.').isAlphanumeric(),
    check('Password', 'Password is required').not().isEmpty(),
    check('Email', 'Email does not appear to be valid').isEmail(),
    passport.authenticate('jwt', { session: false }),
  ],
  (req, res) => {
    // check validation object for errors
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    let hashedPassword = Users.hashPassword(req.body.Password);
    Users.findOneAndUpdate(
      { Name: req.params.Name },
      {
        $set: {
          Name: req.body.Name,
          Password: hashedPassword,
          Email: req.body.Email,
          Birthday: req.body.Birthday,
        },
      },
      { new: true },
      (err, updatedUser) => {
        if (err) {
          console.error(err);
          res.status(500).send('Error: ' + err);
        } else {
          res.json(updatedUser);
        }
      }
    );
  }
);

  // Allow users add to their list of Favorites (create)
  app.post('/users/:Name/movies/:MovieID', passport.authenticate('jwt', { session: false }), (req, res) => {
    Users.findOneAndUpdate({ Name: req.params.Name }, {
      $push: { FavoriteMovies: req.params.MovieID }
    },
    { new: true}, //This line makes sure that the updated document is returned
    (err, updatedUser) => {
      if(err) {
        console.error(err);
        res.status(500).send('Error: ' + err);
      } else {
        res.json(updatedUser);
      }
    });
  } );

 

  //Delete movie from favorite list
  app.delete('/users/:Name/movies/:MovieID', passport.authenticate('jwt', { session: false }), (req, res) => {
    Users.findOneAndUpdate({ Name: req.params.Name}, {
      $pull: { FavoriteMovies: req.params.MovieID }
    },
    { new: true },
    (err, updatedUser) => {
      if (err) {
        console.error(err);
        res.status(500).send('Error: ' + err);
      } else {
        res.json(updatedUser);
      }
    });
  });

  //Allow existing users deregister
  app.delete('/users/:Name', passport.authenticate('jwt', { session: false }), (req, res) => {
    Users.findOneAndRemove({ Name: req.params.Name })
    .then((user) => {
      if(!user) {
        res.status(400).send(req.params.Name + ' was not found');
      } else {
        res.status(200).send(req.params.Name + ' was deleted.' );
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
  });

  app.get('/documentation', (req, res) => {
    res.sendFile('public/documentation.html', {root: __dirname});
  });

  //error handling middleware function
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!')
  });

  const port = process.env.PORT || 8080;
  app.listen(port, '0.0.0.0',() => {
   console.log('Listening on Port ' + port);
  });