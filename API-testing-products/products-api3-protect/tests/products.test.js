const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../app");
const connectDB = require("../config/db");
const Product = require("../models/productModel");
const User = require("../models/userModel");

const api = supertest(app);

const userData = {
  name: "Protected Product Tester",
  email: "protected.products@example.com",
  password: "Product123!",
  phone_number: "+358409876543",
  gender: "other",
  date_of_birth: "1990-01-20",
  membership_status: "active",
};

const initialProducts = [
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

const productsInDb = async () => {
  const products = await Product.find({});
  return products.map((product) => product.toJSON());
};

let token = null;  //has to be let!!

beforeAll(async () => {
  await connectDB();
  await User.deleteMany({});
  await Product.deleteMany({});

  const signupres = await api
    .post("/api/users/signup")
    .send(userData)
    .expect(201);

  token = signupres.body.token;
});

beforeEach(async () => {
  await Product.deleteMany({});

  for (const product of initialProducts) {
    await api
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send(product)
      .expect(201);
  }
});

afterAll(async () => {
  await mongoose.connection.close();
});





describe("GET /api/products", () => {
    it("return all products", async () => {
        const res = await api.get("/api/products").expect(200)
        expect(res.body).toHaveLength(initialProducts.length);

    });

    it("return products as JSON with status 200", async () => {
        await api
            .get("/api/products")
            .expect(200)
            .expect("Content-Type", /application\/json/)
    });

    it("includes a specific product in the returned list", async () => {
    const res = await api.get("/api/products");
    expect(res.body.map((product) => product.title)).toContain(
      "Wireless Mouse"
    );
  });
});




describe("GET /api/products/:productId", () => {
  describe("the id is valid", () => {
    it("return one product by id", async () => {
      const product = await Product.findOne({ title: "Wireless Mouse" });

      const res = await api
        .get(`/api/products/${product._id}`)
        .expect(200)
        .expect("Content-Type", /application\/json/);

      expect(res.body.title).toBe(product.title);
    });
  });

  describe("the id is invalid", () => {
    it("return status 404", async () => {
      const res = await api.get("/api/products/not-a-valid-id").expect(404);
      expect(res.body).toHaveProperty("error", "No such product");
    });
  });
});





describe("POST /api/products", () => {
  describe("the user is authenticated", () => {
    it("return status 201", async () => {
      const newProduct = {
        title: "Laptop",
        category: "Electronics",
        description: "Supr cool Lenovo.",
        price: 500,
        stockQuantity: 4,
        supplier: {
          name: "Lenovo",
          contactEmail: "aspa@help.com",
          contactPhone: "+358507776320",
          rating: 4,
        },
      };

      await api
        .post("/api/products")
        .set("Authorization", `Bearer ${token}`)
        .send(newProduct)
        .expect(201)
        .expect("Content-Type", /application\/json/);
    });

    it("persist the new product with a user_id", async () => {
      const newProduct = {
        title: "Laptop",
        category: "Electronics",
        description: "Supr cool Lenovo.",
        price: 500,
        stockQuantity: 4,
        supplier: {
          name: "Lenovo",
          contactEmail: "aspa@help.com",
          contactPhone: "+358507776320",
          rating: 4,
        },
      };

      const res = await api
        .post("/api/products")
        .set("Authorization", `Bearer ${token}`)
        .send(newProduct)
        .expect(201);

      expect(res.body.title).toBe(newProduct.title);
      expect(res.body).toHaveProperty("user_id");

      const productsAtEnd = await productsInDb();
      expect(productsAtEnd).toHaveLength(initialProducts.length + 1);

      const savedProduct = await Product.findOne({ title: newProduct.title });
      const user = await User.findOne({ email: userData.email });
      expect(savedProduct).not.toBeNull();
      expect(savedProduct.user_id.toString()).toBe(user._id.toString());
    });
  });


  describe("user is not authenticated", () => {
    it("return status 401", async () => {
      await api.post("/api/products").send(initialProducts[0]).expect(401);
    });

    it("should not increase the number of products in the database", async () => {

      await api.post("/api/products").send(initialProducts[0]).expect(401);
      const productsAtEnd = await productsInDb();
      expect(productsAtEnd).toHaveLength(initialProducts.length);
    });
  });
});




describe("PUT /api/products/:productId", () => {
  describe("when the user is authenticated", () => {
    it("return status 200", async () => {
      const product = await Product.findOne({ title: "Standing Desk" });

      await api
        .put(`/api/products/${product._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ stockQuantity: 42, description: "Updated product description." })
        .expect(200)
        .expect("Content-Type", /application\/json/);
    });

    it("persist the updated fields in the database", async () => {
      const product = await Product.findOne({ title: "Standing Desk" });

      await api
        .put(`/api/products/${product._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ stockQuantity: 42, description: "New info of the product." })
        .expect(200);

      const updatedProduct = await Product.findById(product._id);
      expect(updatedProduct.stockQuantity).toBe(42);
      expect(updatedProduct.description).toBe("New info of the product.");
    });
  });

  describe("the user is not authenticated", () => {
    it("return status 401", async () => {
      const product = await Product.findOne({ title: "Standing Desk" });

      await api
        .put(`/api/products/${product._id}`)
        .send({ stockQuantity: 1 })
        .expect(401);
    });
  });

  describe("when the id is invalid", () => {
    it("return status 404", async () => {
      const res = await api
        .put("/api/products/not-a-valid-id")
        .set("Authorization", `Bearer ${token}`)
        .send({ stockQuantity: 1 })
        .expect(404);

      expect(res.body).toHaveProperty("error", "No such product");
    });
  });
});






describe("DELETE /api/products/:productId", () => {
  describe("when the user is authenticated", () => {
    it("return status 204", async () => {
      const product = await Product.findOne({title: "Standing Desk"});

      await api
        .delete(`/api/products/${product._id}`)
        .set("Authorization", `Bearer ${token}`)
        .expect(204);
    });

    it("remove the product from the database", async () => {
      const productsAtStart = await productsInDb();
      const productToDelete = productsAtStart[0];

      await api
        .delete(`/api/products/${productToDelete.id}`)
        .set("Authorization", `Bearer ${token}`)
        .expect(204);

      const productsAtEnd = await productsInDb();
      expect(productsAtEnd).toHaveLength(productsAtStart.length - 1);
      expect(productsAtEnd.map((product) => product.title)).not.toContain(
        productToDelete.title
      );
    });
  });

  describe("the user is not authenticated", () => {
    it("return status 401", async () => {
      const product = await Product.findOne({ title: "Standing Desk" });

      await api.delete(`/api/products/${product._id}`).expect(401);
    });
  });

  describe("when the id is invalid", () => {
    it("return status 404", async () => {
      const res = await api

        .delete("/api/products/not-a-valid-id")
        .set("Authorization", `Bearer ${token}`)
        .expect(404);

      expect(res.body).toHaveProperty("error", "No such product");
    });
  });
});
