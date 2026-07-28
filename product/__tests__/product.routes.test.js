const request = require('supertest');
const app = require('../src/app');

jest.mock('../src/models/product.model', () => ({
  __esModule: true,
  default: {
    create: jest.fn(),
  },
}));

jest.mock('../src/services/imageUpload', () => ({
  uploadImage: jest.fn(),
}));

const Product = require('../src/models/product.model').default;
const { uploadImage } = require('../src/services/imageUpload');

describe('POST /api/products', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a product when valid data and an image upload succeed', async () => {
    uploadImage.mockResolvedValue({
      url: 'https://ik.imagekit.io/demo/product.jpg',
      thumbnail: 'https://ik.imagekit.io/demo/product-thumb.jpg',
      fileId: 'img_123',
    });

    Product.create.mockResolvedValue({
      _id: 'prod_123',
      title: 'Test Product',
      price: { amount: 100, currency: 'INR' },
      category: 'Electronics',
      stock: 10,
      seller: 'seller_1',
      images: [{ url: 'https://ik.imagekit.io/demo/product.jpg', thumbnail: 'https://ik.imagekit.io/demo/product-thumb.jpg', id: 'img_123' }],
    });

    const response = await request(app)
      .post('/api/products')
      .field('title', 'Test Product')
      .field('description', 'A sample product')
      .field('price', '100')
      .field('currency', 'INR')
      .field('category', 'Electronics')
      .field('stock', '10')
      .field('seller', 'seller_1')
      .attach('image', Buffer.from('fake-image-data'), { filename: 'product.jpg', contentType: 'image/jpeg' });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(uploadImage).toHaveBeenCalled();
    expect(Product.create).toHaveBeenCalled();
  });

  it('returns 400 when required fields are missing', async () => {
    const response = await request(app)
      .post('/api/products')
      .field('title', 'Test Product');

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});
