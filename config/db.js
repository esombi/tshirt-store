const mongoose = require("mongoose");

const connectWithDb = () => {
  mongoose.connect(process.env.DB_URL, {
    useNewUrlParser : true,
    useUnifiedTopology: true
  })
  .then(console.log(`Connected to Database`))
  .catch(error => {
    console.log(`Database issues`);
    console.log(error);
    process.exit(1);
  });
};

module.exports = connectWithDb;