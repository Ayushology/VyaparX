const request = require("supertest");
const app = require("../src/app");
const User = require("../src/models/user.model");

require("./setup");

const createAuthenticatedUser = async () => {
  const unique = Date.now();

  const payload = {
    username: `addrlist_${unique}`,
    email: `addrlist_${unique}@example.com`,
    password: "Password123",
    fullName: {
      firstName: "Address",
      lastName: "List",
    },
  };

  await request(app).post("/auth/register").send(payload);

  const loginRes = await request(app)
    .post("/auth/login")
    .send({
      email: payload.email,
      password: payload.password,
    });

  return {
    payload,
    cookies: loginRes.headers["set-cookie"],
  };
};

describe("GET /auth/users/me/addresses", () => {
  it("returns all saved addresses with the default address", async () => {
    const { payload, cookies } = await createAuthenticatedUser();

    const user = await User.findOne({ email: payload.email });

    user.addresses = [
      {
        street: "123 Main Street",
        city: "Delhi",
        state: "Delhi",
        zip: "110001",
        country: "India",
        isDefault: true,
      },
      {
        street: "456 Market Road",
        city: "Noida",
        state: "Uttar Pradesh",
        zip: "201301",
        country: "India",
        isDefault: false,
      },
    ];

    await user.save();

    const res = await request(app)
      .get("/auth/users/me/addresses")
      .set("Cookie", cookies);

    expect(res.status).toBe(200);

    expect(res.body).toHaveProperty("message");
    expect(res.body).toHaveProperty("addresses");

    expect(Array.isArray(res.body.addresses)).toBe(true);
    expect(res.body.addresses).toHaveLength(2);

    expect(res.body.addresses[0]).toHaveProperty("_id");
    expect(res.body.addresses[0]).toHaveProperty("street");
    expect(res.body.addresses[0]).toHaveProperty("city");
    expect(res.body.addresses[0]).toHaveProperty("state");
    expect(res.body.addresses[0]).toHaveProperty("zip");
    expect(res.body.addresses[0]).toHaveProperty("country");
    expect(res.body.addresses[0]).toHaveProperty("isDefault");

    const defaultAddress = res.body.addresses.find(
      (address) => address.isDefault
    );

    expect(defaultAddress).toBeDefined();
    expect(defaultAddress.street).toBe("123 Main Street");
  });

  it("returns an empty array when the user has no saved addresses", async () => {
    const { cookies } = await createAuthenticatedUser();

    const res = await request(app)
      .get("/auth/users/me/addresses")
      .set("Cookie", cookies);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("addresses");
    expect(res.body.addresses).toEqual([]);
  });

  it("rejects an unauthenticated request", async () => {
    const res = await request(app)
      .get("/auth/users/me/addresses");

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("message");
  });

  it("rejects an invalid token", async () => {
    const res = await request(app)
      .get("/auth/users/me/addresses")
      .set("Cookie", ["token=invalid.jwt.token"]);

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("message");
  });
});