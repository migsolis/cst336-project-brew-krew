$(document).ready(function () {
    
	$("#sel-id").on("change", function () {
		// Query DB based on sel-id contents
		let sql = "SELECT * FROM items WHERE item_id = ?";
		let sqlParams = [$("#sel-id").val()];
		pool.query(sql,sqlParams, function (err, rows, fields) {
		    if (err) throw err;
		    console.log(rows);
		    // Change divs to add specific item info here: name, price, qty...
		});
	}); // onChange selection ID
	
	$("#form-db-mod").submit(function(e) {
        adminForm = new URLSearchParams(window.location.search);
        let price, stock;
        let sqlParams_s, sqlParams_p;
        let sql_p = "UPDATE items SET price = ? WHERE item_id = ?";
        // doesn't appear to be a column for stock at the moment..
        let sql_s = "UPDATE items SET stock = ? WHERE item_id = ?";

        if(adminForm.getAll() === undefined || adminForm.getAll().length == 0) {
            // Change some text to tell the user that both fields remain empty
            $("#mod-msg-info").html("Error! You need to supply a value to the stock or price form!");
            $("#mod-msg-info").css("color","red");
        } else {
            if(adminForm.has('price')) {
                price = adminForm.get('price');
                sqlParams_p = [price];
                sqlQuery(sql_p, sqlParams_p);
            }
            if(adminForm.has('stock')) {
                stock = adminForm.get('stock');
                sqlParams_s = [stock];
                sqlQuery(sql_s, sqlParams_s);
            }
        }
        
	});// form onsubmit
	
	function sqlQuery(sql, sqlParams) {
	    pool.query(sql, sqlParams, function(err, rows, fields){
	        if (err) throw err;
	    });
	}
	
}); // document ready