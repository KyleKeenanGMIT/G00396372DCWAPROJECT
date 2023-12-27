const express = require('express');
const app = express();//express install.
const mongoose = require('mongoose');//mongosee import
const port = process.env.PORT || 3000; //chosen port
const Manager = require('./components/managers');//managers.js imported which containts the manager schema.
const mysql = require('mysql');//import of mysql.


const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'proj2023'
});//connection info needed for mySQL.



app.set('view engine', 'ejs');//setting embedded javascript as my view engine

mongoose.connect('mongodb://localhost/proj2023MongoDB')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Unaable to connect to MongoDB', err));//connecting to my MONGO DB database i setup for the managers JSON Data.


// parsing json bodies
app.use(express.json());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));//data format for HTML forms.

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

app.get('/managers/add', (req, res) => {
  res.render('add-manager', { errors: null });
});//get route for adding new managers to existing DB.

app.post('/managers/add', async (req, res) => {
  try {
    const { managerId, name, salary } = req.body;
    let errors = [];
    
    // validating the data to make sure it meets the min requirements set
    if (managerId.length !== 4) {
      errors.push("Manager ID must be 4 characters");
    }
    if (name.length <= 5) {
      errors.push("Name must be more than 5 characters");
    }
    if (salary < 30000 || salary > 70000) {
      errors.push("Salary must be between 30,000 and 70,000");
    }
    
    // Checking if an existing ID is already there and respoding with error msg
    const existingManager = await Manager.findOne({ _id: managerId });
    if (existingManager) {
      errors.push(`Error: Manager ${managerId} already exists in Database`);
    }
    
    if (errors.length > 0) {
      // rendering the form
      res.render('add-manager', { errors });
    } else {
      // Creating new manager with chosen data
      const newManager = new Manager({ _id: managerId, name, salary });
      await newManager.save();
      res.redirect('/managers');
    }
  } catch (error) { // error msg
    console.error('Error adding manager:', error);
    res.status(500).send('Error adding manager.');
  }
});


app.get('/stores', (req, res) => {
  // displaying on all stores with sql query
  pool.query('SELECT * FROM store', (err, results) => {
    if (err) {
      console.error('Error fetching stores:', err);
      res.status(500).send('Error fetching stores');
    } else {
      // Renders all stores to the screen.
      res.render('stores', { stores: results });
    }
  });
});

app.get('/products', (req, res) => {
  // will gather data for products from MYSQL.
  res.render('products');
});

// Starting the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);//logs message saying port is running on port 3000.
});
