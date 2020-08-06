const express = require('express');
const app = express();
const pool = require('./dbPool.js');
const session = require('express-session');
const bcrypt = require('bcrypt');

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({extended: true}));

//routes
app.get('/', (req, res) => {
    res.render('index');
});

app.get('/menu', (req, res) => {
    let sql = 'select description from categories';
    pool.query(sql, (err, rows, fields) => {
        if(err) console.log(err);
        
        let categoryArray = rows;
        res.render('menu', {'categoryArray': categoryArray});
    });
});

app.get('/admin', (req, res) => {
   res.render('admin'); 
});

app.get('/api/getItems', (req, res) => {
    let sql = 'select distinct item_id, item, item_details, item_img, item_price from menu_items where category = ?';
    let displayedCategory = req.query.category;
    let sqlParams = [displayedCategory];
    pool.query(sql, sqlParams, async (err, rows, fields) => {
      if(err) console.log(err);
      res.send({'displayedCategory': displayedCategory, 'items': rows});
    });
});

app.get('/api/getItemMods', (req, res) => {
    let sql = 'select modifier_id, modifier, mod_price, price from menu_items where item_id = ?';
    let sqlParams = [req.query.item_id];
    pool.query(sql, sqlParams, (err, rows, fields) => {
        if(err) console.log(err);
        
        res.send(rows);
    });
});

app.get('/api/update', (req, res) => {
    console.log("Update: ", req.query.action, );
    if(req.query.action == 'update'){
        let sql = 'select price from menu_items where item_id = ? and modifier_id = ?';
        let sqlParams = [req.query.item_id, req.query.mod_id];
        pool.query(sql, sqlParams, (err, rows, fields) => {
            if(err) console.log(err);
            res.send(rows);
        });
    }
});

app.post("/login", async function(req, res){ 
    let username = req.body.username;
    let password = req.body.password;
    
    let result = await checkUsername(username);
    let hashedPwd = "";
    
    if (result.length > 0) {
        hashedPwd = result[0].password;
    }
    
    let passwordMatch = await checkPassword(password, hashedPwd);
    
}); // POST login form

// functions

function checkUsername(username) {
    let sql = "SELECT * FROM users WHERE username = ?";
    return new Promise(function(resolve, reject) {
       pool.query(sql, [username], function(err, rows, fields) {
          if (err) throw err;
          resolve(rows);
       }); // query
    }); // promise
}

function checkPassword(password, hashedVal) {
    return new Promise(function(resolve, reject) {
       bcrypt.compare(password, hashedVal, function(err, result){
          if (err) throw err;
          resolve(result); 
       }); // bcrypt check
    }); // promise
}

//listener
app.listen(process.env.PORT, process.env.IP, ()=> {
    console.log('Server is running...');
})