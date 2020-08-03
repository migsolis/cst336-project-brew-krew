const express = require('express');
const app = express();
const pool = require('./dbPool.js');

app.set('view engine', 'ejs');
app.use(express.static('public'));

//routes
app.get('/', (req, res) => {
    res.render('index');
});

app.get('/menu', (req, res) => {
    let sql = 'SELECT description FROM p_categories';
    pool.query(sql, (err, rows, fields) => {
        if(err) throw err;
        
        // let categoryArray = ['Hot Coffee', 'Cold Coffee', 'Hot Tea', 'Cold Tea'];
        let categoryArray = rows;
        res.render('menu', {'categoryArray': categoryArray});
    });
});

app.get('/api/getItems', (req, res) => {
    console.log('getItems: ', req.query);
    // let sql = 'SELECT * FROM items WHERE category = ?';
    // let sqlParams = [req.query.category];
    // pool.query(sql, sqlParams, (err, rows, fields) => {
    //   if(err) throw err;
    let rows = ['row1', 'row2', 'row3'];
      res.send(rows);
    // });
});

//listener
app.listen(process.env.PORT, process.env.IP, ()=> {
    console.log('Server is running...');
})