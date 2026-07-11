const mongoose = require("mongoose");
const request = require("supertest");
const app = require("../src/app");
const User = require("../src/models/user.model");

require("./setup");

const createAuthenticatedUser = async () => {
  const unique = Date.now();
  const payload = {
    username: `addrdelete_${unique}`,
    email: `addrdelete_${unique}@example.com`,
    password: "Password123",
    fullName: {
      firstName: "Address",
      lastName: "Delete",
    },
  };

  await request(app).post("/auth/register").send(payload);

  const loginRes = await request(app).post("/auth/login").send({
    email: payload.email,
    password: payload.password,
  });

  return {
    payload,
    cookies: loginRes.headers["set-cookie"],
  };
};

describe("DELETE /auth/users/me/addresses/:addressId", () => {
  it("removes an existing address from the authenticated user profile", async () => {
    const { payload, cookies } = await createAuthenticatedUser();

    const user = await User.findOne({ email: payload.email });
    user.addresses.push({
      _id: new mongoose.Types.ObjectId(),
      street: "88 River View",
      city: "Bengaluru",
      state: "Karnataka",
      zip: "560001",
      country: "India",
      isDefault: false,
    });

    await user.save();

    const addressId = user.addresses[0]._id.toString();

    const res = await request(app)
      .delete(`/auth/users/me/addresses/${addressId}`)
      .set("Cookie", cookies);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message");

    const updatedUser = await User.findOne({ email: payload.email });
    expect(
      updatedUser.addresses.some(
        (address) => address._id.toString() === addressId,
      ),
    ).toBe(false);
  });
});
