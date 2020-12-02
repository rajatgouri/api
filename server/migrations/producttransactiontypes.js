module.exports = async () =>
  DB.ProductTransactionType.find({})
    .remove()
    .then(() =>
      DB.ProductTransactionType.create(
        {
          name: "Buy",
          status: "1"
        },
        {
            name: "Sell",
            status: "1"
        },
        {
            name: "Rent",
            status: "1"
        },
        {
            name: "Share",
            status: "1"
        },
        {
            name: "Trade",
            status: "1"
        }
      )
    );
