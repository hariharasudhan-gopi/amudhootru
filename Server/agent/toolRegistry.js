const tools = [
    require('./tools/searchProduct'),
    require('./tools/getProductDetails'),
    require('./tools/checkProductAvailability'),
    require('./tools/addProductToCart'),
    require('./tools/getCart'),
    require('./tools/getUserDeliveryDetails'),
    require('./tools/validateOrder'),
    require('./tools/createCODOrder'),
    require('./tools/getUserOrders'),
    require('./tools/getOrderStatus'),
    require('./tools/searchRAGKnowledge'),
];

const toolsByName = new Map(tools.map((tool) => [tool.name, tool]));

function getToolDefinitions() {
    return tools.map(({ name, description, parameters }) => ({ name, description, parameters }));
}

function getTool(name) {
    return toolsByName.get(name);
}

module.exports = {
    getToolDefinitions,
    getTool,
};
