const cartService = require('../../services/cartService');

module.exports = {
    name: 'getCart',
    description: "Get the authenticated user's current cart contents.",
    parameters: { type: 'object', properties: {} },
    async execute(args, ctx) {
        const items = await cartService.getCart(ctx.userId);
        return {
            items: items.map((item) => ({
                productCode: item.productcode,
                name: item.name,
                quantity: item.quantity,
                price: Number(item.price),
                unit: item.unit,
                availablequantity: item.availablequantity,
            })),
        };
    },
};
