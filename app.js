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

// Returns all the items for a category
app.get('/api/getItems', (req, res) => {
    let sql ='';
    let sqlParams = [];
    let displayedCategory ='';
    
    if(req.query.category == 'all'){
        sql = 'select distinct item_id, item, item_details, item_img, item_price from menu_items';
        displayedCategory = 'All Items';
    } else{
        sql = 'select distinct item_id, item, item_details, item_img, item_price from menu_items where category = ?';
        displayedCategory = req.query.category;
        sqlParams = [displayedCategory];
    }

    pool.query(sql, sqlParams, async (err, rows, fields) => {
      if(err) console.log(err);
      res.send({'displayedCategory': displayedCategory, 'items': rows});
    });
}); // api get items

// returns the item-modifiers for an item
app.get('/api/getItemMods', (req, res) => {
    let sql = 'select modifier_id, modifier, mod_price, price from menu_items where item_id = ?';
    let sqlParams = [req.query.item_id];
    pool.query(sql, sqlParams, (err, rows, fields) => {
        if(err) console.log(err);
        
        res.send(rows);
    });
}); // api get item mods

// returns updated price when size or qty change in the order section of an item card.
app.get('/api/update', (req, res) => {
    console.log("Update: ", req.query.action, );
    switch(req.query.action){
        case 'update':
            let sql = 'select price from menu_items where item_id = ? and modifier_id = ?';
            let sqlParams = [req.query.item_id, req.query.mod_id];
            pool.query(sql, sqlParams, (err, rows, fields) => {
                if(err) console.log(err);
                let price = new Intl.NumberFormat('en-US', {style: 'currency', currency: 'USD'}).format(rows[0].price * req.query.qty);
                res.send(price);
            });
            break;
        case 'add':
            
            break;
    }
}); // api update

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