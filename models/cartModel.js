module.exports = function Cart(initItems){
    this.items = initItems;
    this.totalQty = 0;
    this.totalPrice = 0;

    this.add = function(item, id){
        let storedItem = this.items[id];
    }
}