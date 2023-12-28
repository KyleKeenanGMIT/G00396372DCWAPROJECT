const express = require('express');
const app = express();//express install.
const mongoose = require('mongoose');//mongosee import
const port = process.env.PORT || 3000; //chosen port
const Manager = require('./components/managers');//managers.js imported which containts the manager schema.
const mysql = require('mysql2');//updated mysql import



const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'proj2023'
}).promise();
//connection info needed for mySQL.



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


app.get('/stores', async (req, res) => {
  try {
    const sql = 'SELECT * FROM store'; // displaying on all stores with sql query.
    const [rows, fields] = await pool.query(sql);

    res.render('stores', { stores: rows });
  } catch (err) {
    console.error('Error fetching stores:', err);
    res.status(500).send('Error fetching stores');
  }
});


app.get('/stores/update/:sid', async (req, res) => {
  const storeId = req.params.sid;
  try {
    const sql = 'SELECT * FROM store WHERE sid = ?';
    const [rows, fields] = await pool.query(sql, [storeId]);

    if (rows.length === 0) {
      return res.status(404).send('Store not found.');
    }

    const store = rows[0];
    res.render('update-stores', { store });
  } catch (error) {
    console.error('Error fetching store details:', error);
    res.status(500).send('Error fetching store details.');
  }
});
//app.get set to bring user the update an existing store by sid (store id)


app.post('/stores/edit/:sid', async (req, res) => {
  const sid = req.params.sid;
  const { location, mgrid } = req.body;

  try {
    const sql = "UPDATE store SET location = ?, mgrid = ? WHERE sid = ?";
    await pool.query(sql, [location, mgrid, sid]);
    res.redirect('/stores');
  } catch (err) {
    console.error('Error updating store:', err);
    res.status(500).send('Error updating store.');
  }
});
//app.post - sends the sql query to my existing proj2023 table called store and saves the outputt.

app.get('/stores/add', (req, res) => {
  res.render('add-store', { errors: [] });
});
//app.get - for accessing the add stores ejs page.

app.post('/stores/add', async (req, res) => {
  try {
    const { sid, location, mgrid } = req.body;
    let errors = [];

    // Validating the SID must be 5 chars
    if (sid.length !== 5) {
      errors.push('SID must be 5 letters.');
    }

    // Validating the manager id has 4 chars or more
    if (mgrid.length !== 4) {
      errors.push('Manager ID should be 4 characters.');
    }

    // Check if Manager ID is already in use within mongo db
    const managerExists = await Manager.findOne({ _id: mgrid });
    if (!managerExists) {
      errors.push('Manager ID does not exist in MongoDB.');
    }

    // Check if Manager ID is already in use from another store
    const [existingStore] = await pool.query('SELECT * FROM store WHERE mgrid = ?', [mgrid]);
    if (existingStore.length > 0) {
      errors.push('Manager ID is already assigned to another store.');
    }

    if (errors.length > 0) {
      res.render('add-store', { errors });
    } else {
      await pool.query('INSERT INTO store (sid, location, mgrid) VALUES (?, ?, ?)', [sid, location, mgrid]);
      res.redirect('/stores');//assigns the new data to the Mysql database
    }
  } catch (error) {
    console.error('Error adding store:', error);
    res.status(500).send('Error adding store.');
  }//error msg.
});




app.get('/products', async (req, res) => {
  try {
    const sql = `
    SELECT p.pid, p.productdesc, ps.sid, s.location, ps.price
    FROM product p
    LEFT JOIN product_store ps ON p.pid = ps.pid
    LEFT JOIN store s ON ps.sid = s.sid`;//using join to add product_store onto product table
    const [products] = await pool.query(sql);
    res.render('products', { products: products, error: null });
  } catch (err) {
    console.error('Error fetching products:', err);
    res.render('products', { products: [], error: 'Error fetching products' });
  }//error if products cannot be fetched from mysql db
});


app.post('/products/delete/:pid', async (req, res) => {
  const productId = req.params.pid;

  try {//querying to check if the product is being sold which means it cannot be deleted from the db as its in use.
    const [storesSellingProduct] = await pool.query('SELECT * FROM product_store WHERE pid = ?', [productId]);
    if (storesSellingProduct.length > 0) {
      const [products] = await pool.query('SELECT * FROM product');
      res.render('products', { products: products, error: 'Product cannot be deleted because it is in stores.' });
    } else {//error msg displayed if product in use is attempted to be deleted.
      await pool.query('DELETE FROM product WHERE pid = ?', [productId]);
      res.redirect('/products');// if the product is not being sold its able to be deleted.
    }
  } catch (err) {
    console.error('Error deleting product:', err);
    const [products] = await pool.query('SELECT * FROM product');//fething current list of products after deletion.
    res.render('products', { products: products, error: 'Error deleting product' });
  }
});

app.get('/products/add', (req, res) => {
  res.render('add-product', { errors: null });//get method to bring user to ad products page.
});

app.post('/products/add', async (req, res) => {
  try {
    const { pid, description, sid, location, price } = req.body;
    // query to insert new product into database.
    await pool.query('INSERT INTO product (pid, productdesc, supplier) VALUES (?, ?, ?)', [pid, description, 'SupplierName']);
    // also insertign into product_store table
    await pool.query('INSERT INTO product_store (pid, sid, price) VALUES (?, ?, ?)', [pid, sid, price]);
    res.redirect('/products');//redirects back to product page
  } catch (err) {
    console.error('Error adding product:', err);
    res.render('add-product', { errors: ['Failed to add product.'] });
  }
});



// Starting the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);//logs message saying port is running on port 3000.
});
