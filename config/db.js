var mongoose = require('mongoose');
let config = require('../config/config');
mongoose.Promise = global.Promise;
const mongoOption = {
	keepAlive: 300000,
	connectTimeoutMS: 30000,
	useUnifiedTopology: true,
	useNewUrlParser: true,
	poolSize: 10,
	useFindAndModify:false
};
// let connectionString = `mongodb://${config.database.username}:${config.database.password}@${config.database.host}/${config.database.database}`;
let connectionString = `mongodb://${config.database.host}/${config.database.database}`;

mongoose.connect(connectionString, mongoOption).then(
	() => { console.log('Database is connected') },
	err => { console.log('Can not connect to the database '+ err)}
);
mongoose.set('useCreateIndex', true);
