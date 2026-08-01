jest.mock("../src/services/imagekit.service", () => ({
  uploadImage: jest.fn(),
}));
const request = require("supertest");
const app = require("../src/app");

jest.mock("../src/models/product.model", () => ({
  __esModule: true,
  create: jest.fn(),
  find: jest.fn(),
  countDocuments: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
}));

const Product = require("../src/models/product.model");

describe("GET /api/products", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns products with pagination metadata", async () => {
    const products = [
      {
        _id: "prod_1",
        title: "Phone",
        category: "Electronics",
        price: { amount: 100, currency: "INR" },
      },
    ];

    const query = {
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue(products),
    };

    Product.find.mockReturnValue(query);
    Product.countDocuments.mockResolvedValue(1);

    const response = await request(app)
      .get("/api/products")
      .query({ skip: 0, limit: 10 });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.pagination).toEqual({
      totalProducts: 1,
      totalPages: 1,
      currentPage: 1,
      count: 1,
    });
    expect(response.body.products).toEqual(products);
    expect(Product.find).toHaveBeenCalledWith({});
    expect(query.skip).toHaveBeenCalledWith(0);
    expect(query.limit).toHaveBeenCalledWith(10);
    expect(query.sort).toHaveBeenCalledWith({ createdAt: -1 });
  });

  it("filters products by query, category, and price range", async () => {
    const products = [
      {
        _id: "prod_2",
        title: "iPhone 15",
        category: "Electronics",
        price: { amount: 999, currency: "INR" },
      },
    ];

    const query = {
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue(products),
    };

    Product.find.mockReturnValue(query);
    Product.countDocuments.mockResolvedValue(1);

    const response = await request(app).get("/api/products").query({
      q: "iphone",
      category: "Electronics",
      minPrice: 100,
      maxPrice: 1000,
      skip: 1,
      limit: 2,
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.products).toEqual(products);

    expect(Product.find).toHaveBeenCalledWith({
      title: { $regex: "iphone", $options: "i" },
      category: "Electronics",
      "price.amount": { $gte: 100, $lte: 1000 },
    });
  });
});