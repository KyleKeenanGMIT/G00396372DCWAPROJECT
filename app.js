const express = require('express');
const app = express();//express install.
const port = process.env.PORT || 3000; //chosen port

// parsing json bodies
app.use(express.json());

// simple route
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Starting the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);//logs message saying port is running on port 3000.
});
