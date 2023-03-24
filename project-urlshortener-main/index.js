require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose')
var validUrl = require('valid-url');
var bodyParser = require('body-parser')
const app = express()


// Basic Configuration
const port = process.env['PORT'] || 3000;

mongoose.connect(process.env['URI'], { useNewUrlParser: true, useUnifiedTopology: true })

var db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => console.log("we're connected!"));

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

var urlencodedParser = bodyParser.urlencoded({ extended: false })

const urlSchema = new mongoose.Schema({ url: String })
const urlModel = mongoose.model('urlModel', urlSchema)

app.post('/api/shorturl', urlencodedParser, async (req, res) => {
  try {
    const urlRegex = /https?:\/\/(www\.)?/;
    if (!urlRegex.test(req.body.url)) {
      res.json({ "error": "invalid URL" });
      return;
    }
    const count = await urlModel.countDocuments().exec();
    const newUrl = new urlModel({
      id: count + 1,
      url: req.body.url
    });
    await newUrl.save();
    res.json({
      original_url: req.body.url,
      short_url: newUrl.id
    });
  } catch (err) {
    res.json(err);
  }
})


app.get("/api/shorturl/:number", function(req, res) {
  const shortUrlId = req.params.number;
  urlModel.findById(shortUrlId)
    .then((doc) => {
      if (doc) {
        res.redirect(doc.url);
      } else {
        res.status(404).send("Short URL not found");
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Internal server error");
    });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
