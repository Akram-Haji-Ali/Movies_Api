const express = require("express"),
morgan = require("morgan");
const app = express();
const bodyParser = require('body-parser');
uuid = require('uuid');

/*let topTenMovies = [
  {
    title: "The Godfather",
    director: "Francis Ford Coppola",
  },
  {
    title: "Saving Private Ryan ",
    director: "Steven Spielberg",
  },
  {
    title: "Inception",
    director: "Christopher Nolan",
  },
  {
    title: "Django Unchained",
    director: "Quentin Tarantino",
  },
  {
    title: "Interstellar",
    director: "Christopher Nolan",
  },
  {
    title: "The Hangover",
    director: "Todd Phillips",
  },
  {
    title: "The Dark Knight",
    director: "Christopher Nolan",
  },
  {
    title: "Schindler's List",
    director: "Steven Spielberg",
  },
  {
    title: "Ida",
    director: "Pawel Pawlikowski",
  },
  {
    title: "The Pianist",
    director: "Roman Polanski",
  },
]; */

let users = [
  {
    id : 1,
    name : 'Alison',
    favoriteMovies: []
  },
  {
    id : 2,
    name : 'Fred',
    favoriteMovies: ['Inception']
  },
]

let movies = [
  {
    "Title": "Inception",
    "Description": "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O., but his tragic past may doom the project and his team to disaster.",
    "Genre": {
      "Name": "science fiction",
      "Description": " a genre of fiction in which the stories often tell about science and technology of the future. "
    },
    "Director": {
      "Name": "Christopher Nolan",
      "Bio" : "Best known for his cerebral, often nonlinear, storytelling, acclaimed writer-director Christopher Nolan was born on July 30, 1970, in London, England. Over the course of 15 years of filmmaking, Nolan has gone from low-budget independent films to working on some of the biggest blockbusters ever made.",
      "Birth" :  1970,
    },
    "ImageUrl" : "https://upload.wikimedia.org/wikipedia/en/2/2e/Inception_%282010%29_theatrical_poster.jpg",
    "Featured" : false
  },
  
  {
    "Title": "Wedding Season",
    "Description": "Two Indian Americans fake a romance through a summer of weddings to pacify their pushy parents, but family expectations soon clash with personal desires.",
    "Genre": {
      "Name": "Romance",
      "Description": "In film and television, Romance is a category of a narrative fiction or semi-fiction based on Love and feelings"
    },
    "Director": {
      "Name": "Tom Dey",
      "Bio" : "Thomas Ridgeway Dey is an American film director, screenwriter, and producer. His credits include Shanghai Noon, Showtime, Failure to Launch, and Marmaduke",
      "Birth" : 1965,
    },
    "ImageUrl" : "https://occ-0-3492-879.1.nflxso.net/dnm/api/v6/X194eJsgWBDE2aQbaNdmCXGUP-Y/AAAABXUp_wC5pAH3H3DrHIMQncy8baOXpGz-PtKcCr68re2tMLglxbApDyCMw28dUOZXk_cR4mVsfkDSgxbfW7TOJkGL_MsyGJ3D-W5ABVrFdUxaVec1LwoIpqirTziwn5Ic96nVKw.jpg?r=628",
    "Featured" : false
  },

  {
    "Title": "Emily in Paris",
    "Description": "Emily brings her can-do American attitude and fresh ideas to her new office in Paris, but her inability to speak French turns out to be a major Faux pas.",
    "Genre": {
      "Name": "Comedy",
      "Description": "In film and television, Comedy is a category of a narrative fiction or semi-fiction with alot of humor"
    },
    "Director": {
      "Name": "Darren Star",
      "Bio" : "Darren Star is an American writer, director and producer of film and television. He is best known for creating the television series Beverly Hills, 90210, Melrose Place, Sex and the City, Younger, and Emily in Paris",
      "Birth" : 1961,
    },
    "ImageUrl" : "https://www.netflix.com/de-en/title/81037371",
    "Featured" : false
  }
];

app.use(express.static("public"));
app.use(morgan("common"));
app.use(bodyParser.json())

// GET requests
app.get("/", (req, res) => {
  res.send("Welcome to my Movies api!");
});

app.get("/documentation", (req, res) => {
  res.sendFile("public/documentation.html", { root: __dirname });
});

/*app.get("/movies", (req, res) => {
  res.json(topTenMovies);
});*/

// get all movies
app.get('/movies', (req, res) => {
  res.status(200).json(movies);
})

// get movies by title
app.get('/movies/:title', (req, res) => {
  const { title } =  req.params;
  const movie = movies.find(movie => movie.Title === title);

  if (movie) {
    res.status(200).json(movie);
  } else {
    res.status(400).send("no such movie")
  }
})

//Get genre object
app.get('/movies/genre/:genreName', (req, res) => {
  const { genreName } =  req.params;
  const genre = movies.find(movie => movie.Genre.Name === genreName).Genre; // the the .Genre will enable it return just the genre object

  if (genre) {
    res.status(200).json(genre);
  } else {
    res.status(400).send("no such genre")
  }
})

//Get director data by Name
app.get('/movies/director/:directorName', (req, res) => {
  const { directorName } =  req.params;
  const director = movies.find(movie => movie.Director.Name === directorName).Director; // the the .Genre will enable it return just the genre object

  if (director) {
    res.status(200).json(director);
  } else {
    res.status(400).send("no such director")
  }
})

// Allow new users register (create)
app.post('/users', (req, res) => {
  let newUser = req.body; // this is possible due to the body parser

  if (newUser.name) {
    newUser.id = uuid.v4(); // uuid.v4() generates unique id
    users.push(newUser);
    res.status(201).json(newUser)
  } else {
    res.status(400).send('users need name')
  }
})

// Allow users update their user info (Update)
app.put('/users/:id', (req, res) => {
  const { id } =  req.params;
  const updatedUser = req.body;

  let user = users.find( user => user.id == id) // let is used instead of const as the user will tale the value of the updated user. also == instead of === as one of the value is a number while the other is a string

  if (user) {
    user.name = updatedUser.name;
    res.status(200).json(user)
  } else {
    res.status(400).send('no such user')
  }
})

// Allow users add to their list of Favorites (create)
app.post('/users/:id/:movieTitle', (req, res) => {
  const { id, movieTitle } =  req.params;

  let user = users.find( user => user.id == id) // let is used instead of const as the user will tale the value of the updated user. also == instead of === as one of the value is a number while the other is a string

  if (user) {
    user.favoriteMovies.push(movieTitle);
    res.status(200).send(`${movieTitle} has been added to user ${id}'s array`)
  } else {
    res.status(400).send('no such user')
  }
})

//Delete movie from favorite list
app.delete('/users/:id/:movieTitle', (req, res) => {
  const { id, movieTitle } =  req.params;

  let user = users.find( user => user.id == id) // let is used instead of const as the user will tale the value of the updated user. also == instead of === as one of the value is a number while the other is a string

  if (user) {
    user.favoriteMovies = user.favoriteMovies.filter( title => title !== movieTitle)
    res.status(200).send(`${movieTitle} has been removed from user ${id}'s array`)
  } else {
    res.status(400).send('no such user')
  }
})

//Allow existing users deregister
app.delete('/users/:id', (req, res) => {
  const { id } =  req.params;

  let user = users.find( user => user.id == id) // let is used instead of const as the user will tale the value of the updated user. also == instead of === as one of the value is a number while the other is a string

  if (user) {
    users = users.filter( user => user.id != id) //!= instead of !== because one value is a string and the other is a number
    res.status(200).send(`user ${id} has been deleted`)
  } else {
    res.status(400).send('no such user')
  }
})

// Error
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Ops, there was an error . please give me a moment to google it .");
});

// listen for requests
app.listen(8080, () => {
  console.log("Your app is listening on port 8080.");
});