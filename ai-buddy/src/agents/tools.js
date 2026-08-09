const { tool } = require("@langchain/core/tools");
const { z } = require("zod");
const axios = require("axios");

const searchProduct = tool(
    async ({ query, token }) => {

        const response = await axios.get(
            `http://localhost:3001/api/products?q=${encodeURIComponent(query)}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        return response.data;
    },
    {
        name: "searchProduct",
        description: "Search for products based on a query",
        schema: z.object({
            query: z
                .string()
                .describe("The search query for products")
        })
    }
);

const addProductToCart = tool(
    async ({ productId, quantity = 1, token }) => {

        const response = await axios.post(
            "http://localhost:3002/api/cart/items",
            {
                productId,
                quantity
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        return response.data;
    },
    {
        name: "addProductToCart",
        description: "Add a product to the shopping cart",
        schema: z.object({
            productId: z
                .string()
                .describe("The id of the product to add to the cart"),

            quantity: z
                .number()
                .default(1)
                .describe("The quantity of the product to add")
        })
    }
);

module.exports = {
    searchProduct,
    addProductToCart
};