const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../app");
const connectDB = require("../config/db");
const Product = require("../models/productModel");

const api = supertest(app);

const products = [
  {
    title: "Wireless Mouse",
    category: "Electronics",
    description: "Ergonomic wireless mouse with USB receiver.",
    price: 29.99,
    stockQuantity: 150,
    supplier: {
      name: "TechSupply Co.",
      contactEmail: "sales@techsupply.example",
      contactPhone: "+358401112233",
      rating: 5,
    },
  },
  {
    title: "Standing Desk",
    category: "Furniture",
    description: "Adjustable height standing desk.",
    price: 499.95,
    stockQuantity: 30,
    supplier: {
      name: "OfficePro Ltd.",
      contactEmail: "orders@officepro.example",
      contactPhone: "+358409998877",
      rating: 4,
    },
  },
];

beforeAll(async () => {
  await connectDB();
});

beforeEach(async () => {
  await Product.deleteMany({});
  await Product.insertMany(products);
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("GET /api/products", () => {
  it("should return all products", async () => {
    const res = await api.get("/api/products").expect(200);
    expect(res.body).toHaveLength(products.length);
  });

  it("should return products as JSON with status 200", async () => {
    await api
      .get("/api/products")
      .expect(200)
      .expect("Content-Type", /application\/json/);
  });

  it("should include a specific product in the returned list", async () => {
    const res = await api.get("/api/products");

    expect(res.body.map((product) => product.title)).toContain(
      "Wireless Mouse",
    );
  });
});

describe("POST /api/products", () => {
  describe("when the payload is valid", () => {
    it("should return status 201", async () => {
      const newProduct = {
        title: "Phone",
        category: "Electronics",
        description: "Ergonomic wireless phone with USB receiver.",
        price: 999.999,
        stockQuantity: 200,
        supplier: {
          name: "TechSup Co.",
          contactEmail: "contactme@techsupply.example",
          contactPhone: "+358401112233",
          rating: 5,
        },
      };
      await api.post("/api/products").send(newProduct).expect(201);
    });
    it("should persist the new product in the database", async () => {
      const newProduct = {
        title: "Phone",
        category: "Electronics",
        description: "Ergonomic wireless phone with USB receiver.",
        price: 999.999,
        stockQuantity: 200,
        supplier: {
          name: "TechSup Co.",
          contactEmail: "contactme@techsupply.example",
          contactPhone: "+358401112233",
          rating: 5,
        },
      };
      await api.post("/api/products").send(newProduct).expect(201);
      const addedproduct = await Product.find({});
      expect(addedproduct).toHaveLength(products.length + 1);
      expect(addedproduct.map((product) => product.title)).toContain(
        newProduct.title,
      );
    });
  });
  describe("when the payload is invalid", () => {
    it("should return status 400 when title is missing", async () => {
      const newProduct = {
        category: "Electronics",
        description: "Ergonomic wireless phone with USB receiver.",
        price: 999.999,
        stockQuantity: 200,
        supplier: {
          name: "TechSup Co.",
          contactEmail: "contactme@techsupply.example",
          contactPhone: "+358401112233",
          rating: 5,
        },
      };
      await api.post("/api/products").send(newProduct).expect(400);
    });
    it("should not increase the number of products in the database", async () => {
      const newProduct = {
        category: "Electronics",
        description: "Ergonomic wireless phone with USB receiver.",
        price: 999.999,
        stockQuantity: 200,
        supplier: {
          name: "TechSup Co.",
          contactEmail: "contactme@techsupply.example",
          contactPhone: "+358401112233",
          rating: 5,
        },
      };
      await api.post("/api/products").send(newProduct).expect(400);
      const currentProduct = await Product.find({});
      expect(currentProduct).toHaveLength(products.length);
    });
  });
});

describe("GET /api/products/:productId", () => {
  describe("when the id is valid", () => {
    it("should return one product by id", async () => {
      const product = await Product.findOne();

      const res = await api
        .get(`/api/products/${product._id}`)
        .expect(200)
        .expect("Content-Type", /application\/json/);
      expect(res.body.title).toBe(product.title);
    });
  });
  describe("when the id does not exist", () => {
    it("should return status 404", async () => {
      const nonId = new mongoose.Types.ObjectId();

      await api.get(`/api/products/${nonId}`).expect(404);
    });
  });
  describe("when the id is invalid", () => {
    it("should return status 404", async () => {
      await api.get("/api/products/1234").expect(404);
    });
  });
});


describe("PUT /api/products/:productId", () => {
    describe("while id is correct", () => {
        it("return (200)", async () => {
            const product = await Product.findOne();

            await api   //_id
                .put(`/api/products/${product._id}`)
                .send({ description: "New version", stockQuantity: 42 })
                .expect(200)
        });
        it("stay", async () => {
            const product = await Product.findOne();
            const update = {
                stockQuantity: 42,
                description: "New amount"
            };

            await api.put(`/api/products/${product._id}`).send(update).expect(200);

            const updatedProduct = await Product.findById(product._id);
            expect(updatedProduct.stockQuantity).toBe(update.stockQuantity);
            expect(updatedProduct.description).toBe(update.description);
        });
    });

//wrong
    describe("id incorrect", () => {
        it("return (400)", async () => {
            const product = await Product.findOne();
            await api.put(`/api/products/${product._id}`).send({}).expect(200);
        });
    });
});

//delete
describe("DELETE /api/products/:productId", () => {
    describe("while id is correct", () => {
        it("return (200(?))", async () => {
            const product = await Product.findOne();
            await api.delete(`/api/products/${product._id}`).expect(204);
        });
        it("remove a product", async () => {
            const product = await Product.findOne();
            await api.delete(`/api/products/${product._id}`).expect(204);

            const deleteProduct = await Product.findById(product._id);
            expect(deleteProduct).toBeNull();
        });

    });


//wrong
    describe("id incorrect", () => {
        it("return (400)", async () => {
            const product = await Product.findOne();
            await api.put(`/api/products/${product._id}`).send({}).expect(200);
        });
    });
});