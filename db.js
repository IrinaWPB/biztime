/** Database setup for BizTime. */

//Database setup 
const { Client } = require('pg') //or const pg = require('pg'), then refering pg.Client...

//declare DB uri
let DB_URI;

//define DB_URI
if(process.env.NODE_ENV === 'test') {
    DB_URI = 'postgress:///biztime_test';
} else {
    DB_URI = 'postgress:///biztime';
}

//define new db
let db = new Client({
    connectionString: DB_URI
});

db.connect();

module.exports = db;

