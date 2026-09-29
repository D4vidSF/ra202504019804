const mongoose = require('mongoose');
module.exports = work => mongoose.connection.transaction(work);
