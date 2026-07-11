const request = require("supertest");
const app = require("../src/app");

require("./setup");

const createAuthenticatedUser = async () => {
  const unique = Date.now();
  const payload = {
    username: `addrcreate_${unique}`,
    email: `addrcreate_${unique}@example.com`,
    password: "Password123",
    fullName: {
      firstName: "Address",
      lastName: "Create",
    },
  };

  await request(app).post("/auth/register").send(payload);

  const loginRes = await request(app).post("/auth/login").send({
    email: payload.email,
    password: payload.password,
  });

  return loginRes.headers["set-cookie"];
};

describe("POST /auth/users/me/addresses", () => {
  it("creates a new address for the authenticated user", async () => {
    const cookies = await createAuthenticatedUser();

    const payload = {
      street: "10 Lotus Lane",
      city: "Mumbai",
      state: "Maharashtra",
      zip: "400001",
      country: "India",
      isDefault: true,
    };

    const res = await request(app)
      .post("/auth/users/me/addresses")
      .set("Cookie", cookies)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("address");
    expect(res.body.address.street).toBe(payload.street);
    expect(res.body.address.city).toBe(payload.city);
    expect(res.body.address.zip).toBe(payload.zip);
  });

  it("rejects an address with an invalid zip code9o", async () => {
    const cookies = await createAuthenticatedUser();

    const res = await request(app)
      .post("/auth/users/me/addresses")
      .set("Cookie", cookies)
      .send({
        street: "10 Lotus Lane",
        city: "Mumbai",
        state: "Maharashtra",
        zip: "12A45",
        country: "India",
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("errors");
  });
});
