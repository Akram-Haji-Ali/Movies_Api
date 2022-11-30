const express = require("express"),
morgan = require("morgan");
const app = express();

let topTenMovies = [
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
];

app.use(express.static("public"));
app.use(morgan("common"));

// GET requests
app.get("/", (req, res) => {
  res.send("Welcome to my Movies api!");
});

app.get("/documentation", (req, res) => {
  res.sendFile("public/documentation.html", { root: __dirname });
});

app.get("/movies", (req, res) => {
  res.json(topTenMovies);
});

// Error
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Ops, there was an error . please give me a moment to google it .");
});

// listen for requests
app.listen(8080, () => {
  console.log("Your app is listening on port 8080.");
});