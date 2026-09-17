const productService = require('../../services/productService');

module.exports = {
    name: 'getProductDetails',
    description: 'Get full details of a single product by its product code.',
    parameters: {
        type: 'object',
        properties: {
            productCode: { type: 'string', description: 'The product code.' },
        },
        required: ['productCode'],
    },
    async execute(args) {
        const productCode = args?.productCode;
        if (!productCode) return { error: 'productCode is required.' };

        const product = await productService.getProductByCode(productCode);
        if (!product) return { error: `No product found with code ${productCode}.` };

        return {
            product: {
                productCode: product.code,
                name: product.name,
                price: Number(product.price),
                unit: product.unit,
                description: product.description,
                availablequantity: product.availablequantity,
            },
        };
    },
};
