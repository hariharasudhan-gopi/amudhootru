const cartService = require('../../services/cartService');

module.exports = {
    name: 'validateOrder',
    description: 'Validate that the cart is non-empty, every item is within available stock, and a delivery address exists. Always call this and present the summary to the user before proposing to place the order.',
    parameters: { type: 'object', properties: {} },
    async execute(args, ctx) {
        const items = await cartService.getCart(ctx.userId);
        if (items.length === 0) {
            return { valid: false, reason: 'Cart is empty.' };
        }

        const outOfStock = items.filter((item) => Number(item.quantity) > Number(item.availablequantity));
        if (outOfStock.length > 0) {
            return {
                valid: false,
                reason: 'Some items in the cart exceed available stock.',
                outOfStock: outOfStock.map((item) => ({
                    productCode: item.productcode,
                    name: item.name,
                    requested: item.quantity,
                    available: item.availablequantity,
                })),
            };
        }

        const addresses = Array.isArray(ctx.deliveryAddress) ? ctx.deliveryAddress : [];
        if (addresses.length === 0) {
            return { valid: false, reason: 'No delivery address is saved on this account.' };
        }

        const total = items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);

        return {
            valid: true,
            items: items.map((item) => ({
                productCode: item.productcode,
                name: item.name,
                quantity: item.quantity,
                price: Number(item.price),
            })),
            total,
            deliveryAddress: addresses[0],
        };
    },
};
