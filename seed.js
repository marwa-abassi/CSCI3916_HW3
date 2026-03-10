require('dotenv').config();
const mongoose = require('mongoose');
const Movie = require('./Movies');

const seedMovies = [
  {
    title: 'Inception',
    releaseDate: 2010,
    genre: 'Science Fiction',
    actors: [
      { actorName: 'Leonardo DiCaprio', characterName: 'Dom Cobb' },
      { actorName: 'Marion Cotillard', characterName: 'Mal Cobb' }
    ]
  },
  {
    title: 'The Shawshank Redemption',
    releaseDate: 1994,
    genre: 'Drama',
    actors: [
      { actorName: 'Tim Robbins', characterName: 'Andy Dufresne' },
      { actorName: 'Morgan Freeman', characterName: 'Ellis Redding' }
    ]
  },
  {
    title: 'Pulp Fiction',
    releaseDate: 1994,
    genre: 'Thriller',
    actors: [
      { actorName: 'John Travolta', characterName: 'Vincent Vega' },
      { actorName: 'Samuel L. Jackson', characterName: 'Jules Winnfield' }
    ]
  },
  {
    title: 'The Dark Knight',
    releaseDate: 2008,
    genre: 'Action',
    actors: [
      { actorName: 'Christian Bale', characterName: 'Bruce Wayne' },
      { actorName: 'Heath Ledger', characterName: 'Joker' }
    ]
  },
  {
    title: 'Forrest Gump',
    releaseDate: 1994,
    genre: 'Drama',
    actors: [
      { actorName: 'Tom Hanks', characterName: 'Forrest Gump' },
      { actorName: 'Robin Wright', characterName: 'Jenny Curran' }
    ]
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    await Movie.deleteMany({}); // Clear existing movies
    await Movie.insertMany(seedMovies);
    console.log('Seeded 5 movies');

    mongoose.connection.close();
  } catch (err) {
    console.error(err);
  }
}

seed();