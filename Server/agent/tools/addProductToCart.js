const cartService = require('../../services/cartService');

module.exports = {
    name: 'addProductToCart',
    description: "Add a product to the authenticated user's cart with a specific quantity. Validates stock availability server-side; never assume it succeeded without checking the result.",
    parameters: {
        type: 'object',
        properties: {
            productCode: { type: 'string' },
            quantity: { type: 'number', description: 'Quantity to add, defaults to 1.' },
        },
        required: ['productCode'],
    },
    async execute(args, ctx) {
        const productCode = args?.productCode;
        if (!productCode) return { error: 'productCode is required.' };
        const quantity = Number(args?.quantity) > 0 ? Math.floor(Number(args.quantity)) : 1;

        await cartService.addProductToCart(ctx.userId, productCode);

        try {
            const result = await cartService.setCartQuantity(ctx.userId, productCode, quantity);
            return { success: true, productCode, quantity: result.quantity };
        } catch (error) {
            return { error: error.message };
        }
    },
};
