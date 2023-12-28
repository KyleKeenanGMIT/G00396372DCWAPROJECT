const mongoose = require('mongoose');

// defingin the schema for a managers
const managerSchema = new mongoose.Schema({
    _id: String,
    name: String,
    salary: Number
});

// model created with the collection name
const Manager = mongoose.model('Manager', managerSchema, 'Managers');



module.exports = Manager;
