const sql = require('mysql');

const pool = sql.createPool({
    connectionLimit: 10,
    host: 'db.bienz.us',
    user: 'brewkrewdb',
    password: 'Th3B3stCoff33!',
    database: 'brewkrew',
    multipleStatements: true
});

module.exports = pool;