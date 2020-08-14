/* global $ */

$(document).ready(() => {
    
    $.ajax({
        method: 'get',
        url: '/isAuthenticated',
        success: (data, status) => {
            console.log("Authenicated: ", data.isAuthenticated);
            
            //if(typeof(data.isAuthenticated) == undefined || data.isAuthenticated == false){
            if(!data.isAuthenticated || data.isAuthenticated == false){
                //$('.login').html('<a href="/login">Sign In <em class="fa fa-user"></em></a>');
                $('#loginLink').html('<a href="/login">Sign In <em class="fa fa-user"></em></a>');
                $('#adminLink').html('');
            }else{
                //$('.login').html('<a href="/logout">Sign Out <em class="fa fa-user"></em></a>');
                $('#loginLink').html('<a href="/logout">Sign Out <em class="fa fa-user"></em></a>');
                $('#adminLink').html('<a href="/cpanel">Control Panel <em class="fa fa-toolbox"></em></a');
            }
        }
    });
    
    // When category card is pressed it does an ajax get and generates item cards
    // for the selected category.
    $('.menu-category-card').on('click', async (ev) => {
        let category = $(ev.currentTarget).find('.menu-category-desc').html().trim();
        $('.menu-category-select').val(-1);
        $('#item-search-text').val('');
        await generateItemCards({'type': 2, 'category': category});
    }); // category card click event
    
    $('.menu-show-all').on('click', async (ev) => {
        $('.menu-category-select').val(-1);
        $('.displaySelectedCategory').html('');
        await generateItemCards({});
    });
    
    $('.filter-form').on('change', 'input[name="availability"]', async (ev) => {
        // console.log('Availability Selection: ', );
        let category = $(ev.currentTarget).closest('.filter-section').siblings('.displaySelectedCategory').html().trim();
        
        let availability = ($(ev.currentTarget).val() != -1) ? $(ev.currentTarget).val() : undefined;
        
        await generateItemCards({'category': category, 'status': availability});
    });
    
    $('.filter-form').on('change','select[name="menu-category-select"]', async (ev) => {
        let category = $(ev.currentTarget).val();
        // console.log('category: ', category);
        
        await generateItemCards({'category': category});
    });
    
    $('.filter-form').on('click', '#item-search-btn', async (ev) => {
        let searchTerm = $(ev.currentTarget).siblings('#item-search-text').val();
        $('.menu-category-select').val(-1);
        $('.displaySelectedCategory').html('');
        // console.log('search: ', searchTerm);
        
        await generateItemCards({'search': searchTerm});
    });
    
    // Adds size selection options to item order section
    $('#item-card-container').on('click', '.menu-item-order-btn', (ev) => {
        $('.menu-item-order-btn').show();
        $('.menu-item-desc').show();
        $('.menu-item-order-section').hide();
        $(ev.currentTarget).hide();
        $(ev.currentTarget).prev('.menu-item-desc').hide();
        $(ev.currentTarget).next('.menu-item-order-section').show();
        
        let id = $(ev.currentTarget).siblings('.menu-item-order-section').find('.menu-item-id').val();
        $.ajax({
            method: 'get',
            url: '/api/getItemMods',
            data: {
                'item_id': id
            },
            success: (data, status) => {
                if(data.length != 0){
                    let htmlString = '';
                    Object.keys(data).forEach((key) => {
                        htmlString += `<select class='item-mod-select'>`;
                        
                        data[key].forEach((mod, i) => {
                            htmlString += `<option value='${mod.modifier_id}'>${mod.description}</option>`;
                        });
                        
                        htmlString += `</select>`;
                    });
                    $('.modifier-section').html(htmlString);
                }
            }
        }); // size modifier ajax call
    }); // order button click event
    
    // updates price when size is selected
    $('#item-card-container').on('change', '.item-mod-select', async (ev) => {
        let price = await update('update', ev);
        $(ev.currentTarget).closest('.menu-item-order-section').find('.menu-item-price').html(price);
    }); // size selection event
    
    // decrements order quantity and updates price
    $('#item-card-container').on('click', '.menu-item-qty-minus', async (ev) => {
        ev.preventDefault();
        let qtyInput = $(ev.currentTarget).closest('.item-input-group').find('.menu-item-qty');
        if(qtyInput.val() <= 1){return}
        let qty = Number(qtyInput.val()) - 1;
        qtyInput.val(qty);
        let price = await update('update', ev);
        $(ev.currentTarget).closest('.menu-item-order-section').find('.menu-item-price').html(price);
    }); // minus button click event
    
    // increments order quantity and updates price
    $('#item-card-container').on('click', '.menu-item-qty-plus', async (ev) => {
        ev.preventDefault();
        let qtyInput = $(ev.currentTarget).closest('.item-input-group').find('.menu-item-qty');
        if(qtyInput.val() >= 15){return}
        let qty = Number(qtyInput.val()) + 1;
        qtyInput.val(qty);
        let price = await update('update', ev);
        $(ev.currentTarget).closest('.menu-item-order-section').find('.menu-item-price').html(price);
    }); // plus button click event    
    
    // updates price when number input changes
    $('#item-card-container').on('change', '.menu-item-qty', async (ev) => {
        ev.preventDefault();
        let qtyInput = $(ev.currentTarget).closest('.item-input-group').find('.menu-item-qty');
        let qty = Number(qtyInput.val());
        if(qty <= 0){
            qtyInput.val(1);
        }
        if(qty > 15){
            qtyInput.val(15);
        }
        let price = await update('update', ev);
        $(ev.currentTarget).closest('.menu-item-order-section').find('.menu-item-price').html(price);
    }); // plus button click event
    
    // Adds an items to cart
    $('#item-card-container').on('click', '.menu-item-add-btn', async (ev) => {
        ev.preventDefault();
        $('.menu-item-order-btn').show();
        $('.menu-item-desc').show();
        $('.menu-item-order-section').hide();
        await update('add', ev);
        $(ev.currentTarget).siblings('.item-input-group').find('.menu-item-qty').val(1);
        $(ev.currentTarget).siblings('.item-mod-select').val(1);
    }); // add to cart click event
    
    function generateItemCards(data){
        return new Promise((resolve, reject) => {
            $.ajax({
                method: 'get',
                url: '/api/getItems',
                data: {
                    'category': data.category,
                    'status': data.status,
                    'search': data.search
                },
                success: (data, status) => {
                    $('.displaySelectedCategory').html(data.displayedCategory);
                    $('#item-card-container').html('');
                    // console.log('Gen Item Cards:', data);
                    
                    if(data.items.length == 0){
                        $('#item-card-container').html('Sorry, no items meet these criteria. Try something new!')
                    };
                    
                    data.items.forEach( (item, i) => {
                        let price = new Intl.NumberFormat('en-US', {style: 'currency', currency: 'USD'}).format(item.price);
                        let htmlString = '';
                        
                        htmlString += `<div class='menu-item-card'>
                                <div class='menu-item-img-container'>
                                    <img class='menu-item-img' src='img/${item.img}'>
                                </div>
                                <div class='menu-item-card-body'>
                                    <div class='menu-item-title'>${item.description}</div>
                                    <div class='menu-item-desc'>${item.description_details}</div>`;
                        if(item.status == 1){
                            htmlString += `<button class='menu-item-order-btn'>ORDER</button>`;
                        } else if (item.status == 2) {
                            htmlString += `<div class='menu-item-unavailable'>Out of Stock</div>`;
                        } else {
                            htmlString += `<div class='menu-item-unavailable'>Unavailable</div>`;
                        }
                        htmlString +=  `<!-- card order section -->
                                    <div class='menu-item-order-section'>
                                        <div class='modifier-section'></div>
                                        <div class='item-input-group'>
                                            <div class='item-input-group-prepend'><button class='btn btn-default menu-item-qty-minus'>-</button> </div>
                                            <input class='form-control menu-item-qty' type='number' min='1' max='15' value='1'>
                                            <div class='item-input-group-append'><button class='btn btn-default menu-item-qty-plus'>+</button></div>
                                        </div>
                                        <div class='menu-item-price'>${price}</div>
                                        <button type='submit' class='btn btn-success menu-item-add-btn'>ADD TO CART</button>
                                        <input type='hidden' class='menu-item-id' value='${item.item_id}'>
                                    </div><!-- end of order section -->
                                </div>
                            </div><!-- end of card -->`;
                        $('#item-card-container').append(htmlString);
                    });
                }
            }); // get item cards ajax call
        });
    }
    
    // update price and cart function
    function update(action, ev){
        return new Promise((resolve, reject) => {
            let item_id = Number($(ev.currentTarget).closest('.menu-item-order-section').find('.menu-item-id').val());
            let qty = Number($(ev.currentTarget).closest('.menu-item-order-section').find('.menu-item-qty').val());
            let mod_ids = [];
            
            $(ev.currentTarget).closest('.menu-item-order-section').find('.item-mod-select').each((i, mod) => {
                mod_ids.push(Number($(mod).val()));
            });
            
            let data = {'item_id': item_id, 'qty': qty, 'mods': mod_ids};
            let dataString = JSON.stringify(data);
            
            let url = '/api/update';
            
            if (action == 'add'){
                url = '/api/cart/additem';
            } 
            
            $.ajax({
                method: 'get',
                url: url,
                data: {
                    'data': dataString
                },
                success: (data, status) => {
                    resolve(data);
                }
            });
        });
    } // update function
    
});

//update prices
//$(document).ready(() => {
	$("#form-db-mod").submit(function(e) { 
       e.preventDefault();
        
        console.log("clciko");
        let id = $('#item_id').val();
        let price=$('#item_price').val();
        $.ajax({
                method: 'get',
                url: '/api/updateprice',
                data: {
                    'action': "update",
                    'item_id': item_id,
                    'price': price
                   
                },
                success: (data, status) => {
                    $('#c-item_id').val("");
                    $('#c-price').val("");
                }
            }); // end of updating api call
             return false; 
     	});
	
//	});

// insert items to the db 
$(document).ready(() => {
  	$("#form-db-mod-add").submit(function(e) {
	    e.preventDefault();

        const description = $('#c-itemName').val();
        const category = $('#c-itemCat').val();
        const price = $('#c-itemPrice').val();
        $.ajax({
            method: 'get',
            url: '/api/insertitems',
            data: {
                'action': "insert",
                'description': description,
                'category': category,
                'price': price
            },
            success: (data, status) => {
                $('#c-itemName').val("");
                $('#c-itemCat').val("");
                $('#c-itemPrice').val("");
            }
        }); // end of the ajax call 
        return false;
    }); 
});

 $("#form-generatereports").submit(function(e) { 
        // write click event here
        alert("hello");
        e.preventDefault();
        let startdate = $("#r-start-date").val();
        let enddate=$("#r-end-date").val();
        let sorder= $("#s-order").val();
        console.log(startdate);
        console.log(enddate);
        console.log(sorder);
        switch(sorder){
            case "open" :
                
                $.ajax({
                method: 'get',
                url: '/api/getOpenOrders',
                data: {
                    
                    'sdate': startdate,
                    'enddate': enddate
                   
                   
                },
                success: (data, status) => {;
                    console.log(data);
                    resolve(data);
                }
            }); // size modifier ajax call
                break;
        }
        
    });
    
  function cartGetCart() {
    $.ajax({
        method: "get",
        url: "/api/cart/getcart",
        data: {
            //"orderId": orderId
        },
        success: function(data, status) {
            let htmlCart = "";
            let subtotalPrice = 0.00;
            if(!data.length){
                htmlCart = "<h4>Your Shopping Cart is empty<h4>"
                $("#customerInformation").hide();
                $("#priceSummary").hide();
            } else {
                htmlCart += "<table class='table'>";
                htmlCart += "<tbody>";
                data.forEach(function(row){
                    htmlCart += "<tr>";
                    htmlCart += `    <td><img src='img/${row.img}' width='100' height='100'/></td>`;
                    htmlCart += `    <td>`;
                    htmlCart += `       <h6>${row.description}</h6>`;
                    if(row.item_mods.length > 0){
                        row.item_mods.forEach(function(modRow, i){
                            htmlCart += `       <table class="table-borderless">`;
                            htmlCart += `           <tr>`;
                            htmlCart += `               <td>${modRow.description}`;
                            htmlCart += `           </tr>`;
                            htmlCart += `       </table>`;        
                        });
                    }
                    htmlCart += `   </td>`;
                    htmlCart += `    <td><input type='number' min='1' max='99' value="${row.qty}" disabled/></td>`;
                    htmlCart += `    <td>$${row.total_price.toFixed(2)}</td>`;
                    htmlCart += `    <td><h5><a href='' class='deleteLine'  data-orderline='${row.order_line}'>X</a></h5></td>`;
                    htmlCart += "</tr>";
                    
                    subtotalPrice += row.total_price;
                });
                htmlCart += "</tbody>";
                htmlCart += "</table>";
            }
            
            $("#subtotalPrice").text(subtotalPrice.toFixed(2).toString());
            $("#formSubtotal").val(subtotalPrice.toFixed(2).toString());
            $("#shoppingCart").html(htmlCart);
            $("#customerInformation").removeAttr('hidden');
            $("#priceSummary").removeAttr('hidden');
            
            cartCalculatePrice();
        }
    }); //ajax
} //getCart

function cartCalculatePrice(){
    let subtotalPrice = 0.00;
    let taxPrice = 0.00;
    let totalPrice = 0.00;
    
    subtotalPrice = parseFloat($("#subtotalPrice").text());
    taxPrice = parseFloat($("#location option:selected").attr("data-taxrate")) * subtotalPrice;
    if(isNaN(taxPrice)) taxPrice = 0.00;
    totalPrice = subtotalPrice + taxPrice;
    
    $("#taxPrice").text(taxPrice.toFixed(2).toString());
    $("#formTax").val(taxPrice.toFixed(2).toString());
    $("#totalPrice").text(totalPrice.toFixed(2).toString());
    $("#formTotal").val(totalPrice.toFixed(2).toString());
    
}//cartCalculatePrice

function cartGetLocations(){
    $.ajax({
        method: "GET",
           url: "/api/cart/locations",
      dataType: "json",
          data: {},                
       success: function(result, status) {
           
           $("#location").html("<option value='0'> Select One </option>");
           for(let i=0; i < result.length; i++){
               $("#location").append('<option value="' + result[i].location_id+ '" data-taxrate='+result[i].tax_rate+'> ' + result[i].city + '</option>');
           }
       }
    });//ajax
};//getLocations

    
