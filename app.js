const express = require('express');
const app = express();//express install.
const port = process.env.PORT || 3000; //chosen port

app.set('view engine', 'ejs');//setting embedded javascript as my view engine

// parsing json bodies
app.use(express.json());

app.get('/', (req, res) => {
  res.render('home');
});//renders the home page first when running app.js - home.ejs

app.get('/managers', (req, res) => {
  // Fetching Manager JSON Data from MONGODB.
  res.render('managers', { managers: yourManagersData });
});

// Starting the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);//logs message saying port is running on port 3000.
});
