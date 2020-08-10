/* global $ */

$(document).ready(() => {
    
    // When category card is pressed it does an ajax get and generates item cards
    // for the selected category.
    $('.menu-category-card').on('click', async (ev) => {
        let category = $(ev.currentTarget).find('.menu-category-desc').html().trim();
        await generateItemCards({'type': 2, 'category': category});
    }); // category card click event
    
    $('.menu-show-all').on('click', async (ev) => {
        await generateItemCards({'category': 'All'});
    });
    
    $('.filter-form input').on('change', async (ev) => {
        // console.log('Availability Selection: ', );
        let category = $(ev.currentTarget).closest('.filter-section').siblings('.displaySelectedCategory').html().trim();
        let availability = $(ev.currentTarget).val();
        
        await generateItemCards({'category': category, 'status': availability});
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
                console.log(data);
                if(data.length != 0){
                    let htmlString = `<select class='item-mod-select'>`;
                    data.forEach((mod, i) => {
                        htmlString += `<option value='${mod.modifier_id}'>${mod.description}</option>`;
                    });
                    htmlString += `</select>`;
                    $('.modifier-section').html(htmlString);
                }
            }
        }); // size modifier ajax call
    }); // order button click event
    
    // updates price when size is selected
    $('#item-card-container').on('change', '.item-mod-select', async (ev) => {
        update('update', ev);
        let price = await update('update', ev);
        $(ev.currentTarget).closest('.menu-item-order-section').find('.menu-item-price').html(price);
    }); // size selection event
    
    // decrements order quantity and updates price
    $('#item-card-container').on('click', '.menu-item-qty-minus', async (ev) => {
        ev.preventDefault();
        let qtyInput = $(ev.currentTarget).closest('.item-input-group').find('.menu-item-qty');
        if(qtyInput.val() <= 0){return}
        let qty = Number(qtyInput.val()) - 1;
        qtyInput.val(qty);
        let price = await update('update', ev);
        $(ev.currentTarget).closest('.menu-item-order-section').find('.menu-item-price').html(price);
    }); // minus button click event
    
    // increments order quantity and updates price
    $('#item-card-container').on('click', '.menu-item-qty-plus', async (ev) => {
        ev.preventDefault();
        let qtyInput = $(ev.currentTarget).closest('.item-input-group').find('.menu-item-qty');
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
        let price = await update('update', ev);
        $(ev.currentTarget).closest('.menu-item-order-section').find('.menu-item-price').html(price);
    }); // plus button click event
    
    // Adds an items to cart
    $('#item-card-container').on('click', '.menu-item-add-btn', (ev) => {
        ev.preventDefault();
        $('.menu-item-order-btn').show();
        $('.menu-item-desc').show();
        $('.menu-item-order-section').hide();
        $(ev.currentTarget).siblings('.item-input-group').find('.menu-item-qty').val(1);
        $(ev.currentTarget).siblings('.item-mod-select').val(1);
        update('add', ev);
    }); // add to cart click event
    
    function generateItemCards(data){
        return new Promise((resolve, reject) => {
            $.ajax({
                method: 'get',
                url: '/api/getItems',
                data: {
                    'category': data.category,
                    'status': data.status
                },
                success: (data, status) => {
                    $('.displaySelectedCategory').html(data.displayedCategory);
                    $('#item-card-container').html('');
                    console.log(data);
                    
                    data.items.forEach( (item, i) => {
                        let price = new Intl.NumberFormat('en-US', {style: 'currency', currency: 'USD'}).format(item.price);
                        let htmlString = '';
                        
                        htmlString += `<div class='menu-item-card'>
                                <img class='menu-item-img' src='img/${item.img}'>
                                <div class='menu-item-card-body'>
                                    <div class='menu-item-title'>${item.description}</div>
                                    <div class='menu-item-desc'>${item.description_details}</div>`;
                        if(true){
                            htmlString += `<button class='menu-item-order-btn'>ORDER</button>`;
                        } else {
                            htmlString += `<div class='menu-item-unavailable'>This Item is Unavailable</div>`
                        }
                        htmlString +=  `<!-- card order section -->
                                    <div class='menu-item-order-section' action="/addToCart">
                                        <div class='modifier-section'></div>
                                        <div class='item-input-group'>
                                            <div class='item-input-group-prepend'><button class='btn btn-default menu-item-qty-minus'>-</button> </div>
                                            <input class='form-control menu-item-qty' type='number' min='1' value='1'>
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
            let item_id = $(ev.currentTarget).closest('.menu-item-order-section').find('.menu-item-id').val();
            let mod_id = $(ev.currentTarget).closest('.menu-item-order-section').find('.item-mod-select').val();
            let qty = $(ev.currentTarget).closest('.menu-item-order-section').find('.menu-item-qty').val();
            
            $.ajax({
                method: 'get',
                url: '/api/update',
                data: {
                    'action': action,
                    'item_id': item_id,
                    'mod_id': mod_id,
                    'qty': qty
                },
                success: (data, status) => {
                    resolve(data);
                }
            });
        });
    } // update function
    
});