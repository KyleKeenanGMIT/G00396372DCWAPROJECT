const express = require('express');
const app = express();//express install.
const mongoose = require('mongoose');//mongosee import
const port = process.env.PORT || 3000; //chosen port
const Manager = require('./components/managers');//managers.js imported which containts the manager schema.



app.set('view engine', 'ejs');//setting embedded javascript as my view engine

mongoose.connect('mongodb://localhost/proj2023MongoDB')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Unaable to connect to MongoDB', err));//connecting to my MONGO DB database i setup for the managers JSON Data.


// parsing json bodies
app.use(express.json());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.render('home');
});//renders the home page first when running app.js - home.ejs

app.get('/managers', async (req, res) => {
  try {
    const managersData = await Manager.find();
    res.render('managers', { managers: managersData });
  } catch (error) {
    console.error('Error fetching managers:', error);
    res.status(500).send('Error fetching managers data.');
  }
});//gather data stored in mongo DB - managers data is _id, name & salary.

app.get('/stores', (req, res) => {
  // will gather stores daya from MYSQL.
  res.render('stores');
});

app.get('/products', (req, res) => {
  // will gather data for products from MYSQL.
  res.render('products');
});

// Starting the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);//logs message saying port is running on port 3000.
});
