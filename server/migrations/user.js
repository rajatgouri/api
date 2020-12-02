module.exports = async () =>
  DB.User.find({})
    .remove()
    .then(() =>
      DB.User.create(
        {
          provider: "local",
          name: "Test User",
          email: "test@tradenshare.com",
          password: "test",
          emailVerified: true,
        },
        {
          provider: "local",
          role: "admin",
          name: "Admin",
          email: "admin@tradenshare.com",
          password: "admin",
          emailVerified: true,
        }
      )
    );
