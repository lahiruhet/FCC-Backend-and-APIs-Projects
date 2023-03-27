const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')
var bodyParser = require('body-parser')


require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

mongoose.connect(process.env['URI'])
const db = mongoose.connection
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => console.log("we're connected!"));

var Schema = mongoose.Schema;

var userSchema = new Schema({
  username: { type: String, unique: true, required: true }
});

var userModel = mongoose.model('userModel', userSchema);

var exercisesSchema = new Schema({
  userId: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, min: 1, required: true },
  date: { type: Date, default: Date.now }
});

var exercisesModel = mongoose.model('exercisesModel', exercisesSchema);

app.post('/api/users', async (req, res) => {
  try {
    const newUser = new userModel({
      username: req.body.username
    });
    await newUser.save();
    res.json({
      username: newUser.username,
      _id: newUser.id
    });
  } catch (err) {
    res.json(err);
  }

})

app.get('/api/users', async (req, res) => {
  try {
    const userData = await userModel.find({});
    return res.json(userData);
  } catch (error) {
    console.error(error);
    return res.json({ error: 'server error' });
  }
});


app.post('/api/users/:_id/exercises', async (req, res) => {
  try {
    const { _id } = req.params;
    const { description, duration, date } = req.body;

    if (!_id) {
      return res.status(400).json({ error: '_id is required' });
    }

    if (!description) {
      return res.status(400).json({ error: 'description is required' });
    }

    if (!duration) {
      return res.status(400).json({ error: 'duration is required' });
    }

    const userId = _id;
    const parsedDuration = parseInt(duration);
    const parsedDate = date ? new Date(date) : new Date();

    if (isNaN(parsedDuration)) {
      return res.status(400).json({ error: 'duration is not a number' });
    }

    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ error: 'date is invalid' });
    }

    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'user not found' });
    }

    const newExercise = new exercisesModel({
      userId,
      description,
      duration: parsedDuration,
      date: parsedDate
    });

    const savedExercise = await newExercise.save();

    return res.json({
      _id: user['_id'],
      username: user['username'],
      description: savedExercise['description'],
      duration: savedExercise['duration'],
      date: new Date(savedExercise['date']).toDateString()
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.get('/api/users/:_id/logs', async (req, res) => {
  const userId = req.params._id;
  const findConditions = { userId };

  if (req.query.from || req.query.to) {
    findConditions.date = {};

    if (req.query.from) {
      findConditions.date.$gte = new Date(req.query.from);
    }

    if (req.query.to) {
      findConditions.date.$lte = new Date(req.query.to);
    }

    if (findConditions.date.$gte && isNaN(findConditions.date.$gte.getTime())) {
      return res.json({ error: 'from date is invalid' });
    }

    if (findConditions.date.$lte && isNaN(findConditions.date.$lte.getTime())) {
      return res.json({ error: 'to date is invalid' });
    }
  }

  const limit = parseInt(req.query.limit) || 0;

  if (isNaN(limit)) {
    return res.json({ error: 'limit is not a number' });
  }

  try {
    const userData = await userModel.findById(userId);
    if (!userData) {
      return res.json({ error: 'user not found' });
    }

    const exercisesData = await exercisesModel
      .find(findConditions)
      .sort({ date: 'asc' })
      .limit(limit)
      .exec();

    console.log(exercisesData)
    const responseData = {
      _id: userData['_id'],
      username: userData['username'],
      count: exercisesData.length,
      log: exercisesData.map(({ description, duration, date }) => ({
        description,
        duration,
        date: new Date(date).toDateString(),
      })),
    };

    return res.json(responseData);
  } catch (error) {
    console.error(error);
    return res.json({ error: 'server error' });
  }
});




const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
