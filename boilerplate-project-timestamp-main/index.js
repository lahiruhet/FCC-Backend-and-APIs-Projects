// index.js
// where your node app starts

// init project
var express = require('express');
var app = express();

// enable CORS (https://en.wikipedia.org/wiki/Cross-origin_resource_sharing)
// so that your API is remotely testable by FCC 
var cors = require('cors');
app.use(cors({ optionsSuccessStatus: 200 }));  // some legacy browsers choke on 204

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function(req, res) {
  res.sendFile(__dirname + '/views/index.html');
});


// your first API endpoint... 
app.get("/api/hello", function(req, res) {
  res.json({ greeting: 'hello API' });
});
app.get("/api/:date", function(req, res) {
  let dateString = req.params.date
  if (!/^\d+$/.test(dateString)) {
    let unixDate = Date.parse(dateString)
    if(!unixDate) {
      res.json({ error: "Invalid Date" })
    }
    res.json(
      {
        'unix': unixDate,
        'utc': new Date(unixDate).toUTCString()
      }
    );
  } else {
    res.json(
      {
        'unix': dateString,
        'utc': new Date(parseInt(dateString)).toUTCString()
      }
    );
  }
});

 app.get('/api/', (req, res) => {
   const currentDate = new Date().toUTCString()
   const currentUnix = Date.parse(currentDate)
   res.json({ unix: currentUnix, utc: currentDate })
 })



// listen for requests :)
var listener = app.listen(process.env.PORT, function() {
  console.log('Your app is listening on port ' + listener.address().port);
});
