let express = require('express');
let app = express();
let config = require('./config/config');
let db = require('./config/db');
let cors = require('cors');
let bodyParser = require('body-parser');
var multer  = require('multer')
var upload = multer({ dest: 'uploads/' })
global.__root   = __dirname + '/';
var path = require('path');
let session = require('express-session');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo')(session);

const i18next = require('i18next');
const middleware = require('i18next-express-middleware');
const Backend = require('i18next-node-fs-backend');

app.use(session({
	name: config.sessname,
	secret: config.secret,
	saveUninitialized: false,
	resave: true,
	store: new MongoStore({
		mongooseConnection: mongoose.connection,
		ttl: config.sesstime
	}),
	cookie: {
		maxAge: config.sesstime
	}
}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// app.get('/', function (req, res) {
//     res.status(200).send('API Work Successfully!');
// });

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json({
    limit: '50mb', extended: true
}));

app.use(cors());
app.options('*', cors());

app.set('trust proxy', true)
// Request Header Types
app.use(function (req, res, next) {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'DELETE, GET, POST, PUT');
	res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,x-forwarded-for,content-type');
	res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

// Public Directory Access
app.use(express.static('public'));


/* USER ROUTES */
let UserController = require(__root + 'controllers/UserController');
app.use('/api/', UserController);
app.use('/', require(__root + 'controllers'));

module.exports = app;
