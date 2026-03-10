require('dotenv').config()
const mongoose = require('mongoose')

const express = require('express');
const bodyParser = require('body-parser');
const passport = require('passport');
const authJwtController = require('./auth_jwt'); // You're not using authController, consider removing it
const jwt = require('jsonwebtoken');
const cors = require('cors');
const User = require('./Users');
const Movie = require('./Movies'); // You're not using Movie, consider removing it

const app = express();

if (!process.env.MONGO_URI) {
  console.error('Missing MONGO_URI in environment');
}
if (!process.env.SECRET_KEY) {
  console.error('Missing SECRET_KEY in environment');
}

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(passport.initialize());

const router = express.Router();

// Removed getJSONObjectForMovieRequirement as it's not used

router.post('/signup', async (req, res) => { // Use async/await
  if (!req.body.username || !req.body.password) {
    return res.status(400).json({ success: false, msg: 'Please include both username and password to signup.' }); // 400 Bad Request
  }

  try {
    const user = new User({ // Create user directly with the data
      name: req.body.name,
      username: req.body.username,
      password: req.body.password,
    });

    await user.save(); // Use await with user.save()

    res.status(201).json({ success: true, msg: 'Successfully created new user.' }); // 201 Created
  } catch (err) {
    console.error('Signup error:', err.message || err);
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'A user with that username already exists.' });
    }
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: err.message });
    }
    const message = process.env.DEBUG === 'true'
      ? (err.message || String(err))
      : 'Something went wrong. Please try again later.';
    return res.status(500).json({ success: false, message });
  }
});


router.post('/signin', async (req, res) => { // Use async/await
  try {
    const user = await User.findOne({ username: req.body.username }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, msg: 'Authentication failed. User not found.' }); // 401 Unauthorized
    }

    const isMatch = await user.comparePassword(req.body.password); // Use await

    if (isMatch) {
      const userToken = { id: user._id, username: user.username }; // Use user._id (standard Mongoose)
      const token = jwt.sign(userToken, process.env.SECRET_KEY, { expiresIn: '1h' }); // Add expiry to the token (e.g., 1 hour)
      res.json({ success: true, token: 'JWT ' + token });
    } else {
      res.status(401).json({ success: false, msg: 'Authentication failed. Incorrect password.' }); // 401 Unauthorized
    }
  } catch (err) {
    console.error(err); // Log the error
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again later.' }); // 500 Internal Server Error
  }
});

router.route('/movies')
    .put((req, res) => res.status(405).json({ success: false, message: 'PUT on /movies not allowed' }))
    .delete((req, res) => res.status(405).json({ success: false, message: 'DELETE on /movies not allowed' }))
    .get(authJwtController.isAuthenticated, async (req, res) => {
        try {
            const movies = await Movie.find({});
            res.json(movies);
        } catch (err) {
            console.error(err);
            res.status(500).json({ success: false, message: 'Failed to retrieve movies' });
        }
    })
    .post(authJwtController.isAuthenticated, async (req, res) => {
        if (!req.body.title || !req.body.releaseDate || !req.body.genre || !req.body.actors || req.body.actors.length === 0) {
            return res.status(400).json({ success: false, message: 'Movie must have title, releaseDate, genre, and at least one actor' });
        }
        const invalidActor = req.body.actors.some(a => !a || !a.actorName || !a.characterName);
        if (invalidActor) {
            return res.status(400).json({ success: false, message: 'Each actor must have actorName and characterName' });
        }
        try {
            const movie = new Movie(req.body);
            await movie.save();
            res.status(201).json({ success: true, movie });
        } catch (err) {
            console.error(err);
            if (err.name === 'ValidationError') {
                res.status(400).json({ success: false, message: err.message });
            } else {
                res.status(500).json({ success: false, message: 'Failed to save movie' });
            }
        }
    });

router.route('/movies/:title')
    .post((req, res) => res.status(405).json({ success: false, message: 'POST on /movies/:title not allowed' }))
    .get(authJwtController.isAuthenticated, async (req, res) => {
        try {
            const movie = await Movie.findOne({ title: req.params.title });
            if (!movie) {
                return res.status(404).json({ success: false, message: 'Movie not found' });
            }
            res.json(movie);
        } catch (err) {
            console.error(err);
            res.status(500).json({ success: false, message: 'Failed to retrieve movie' });
        }
    })
    .put(authJwtController.isAuthenticated, async (req, res) => {
        try {
            const movie = await Movie.findOneAndUpdate({ title: req.params.title }, req.body, { new: true, runValidators: true });
            if (!movie) {
                return res.status(404).json({ success: false, message: 'Movie not found' });
            }
            res.json({ success: true, movie });
        } catch (err) {
            console.error(err);
            if (err.name === 'ValidationError') {
                res.status(400).json({ success: false, message: err.message });
            } else {
                res.status(500).json({ success: false, message: 'Failed to update movie' });
            }
        }
    })
    .delete(authJwtController.isAuthenticated, async (req, res) => {
        try {
            const movie = await Movie.findOneAndDelete({ title: req.params.title });
            if (!movie) {
                return res.status(404).json({ success: false, message: 'Movie not found' });
            }
            res.json({ success: true, message: 'Movie deleted' });
        } catch (err) {
            console.error(err);
            res.status(500).json({ success: false, message: 'Failed to delete movie' });
        }
    });

app.use('/', router);

const PORT = process.env.PORT || 8080;

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection failed:', err.message));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;