module.exports = async () =>
  DB.ProductType.find({})
    .remove()
    .then(() =>
      DB.ProductType.create(
        {
          name: "New",
        },
        {
            name: "Fairly Used",
        },
        {
            name: "Used",
        },
        {
            name: "Never Used",
        }
      )
    );
