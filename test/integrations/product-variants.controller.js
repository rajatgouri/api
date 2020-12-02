describe('Test product', () => {
  let product;
  let shop;
  let option;
  let variant;

  const newCatalog = {
    price: 100,
    salePrice: 10
  };

  before(async () => {
    shop = new DB.Shop({
      name: 'shop test',
      ownerId: global.user._id
    });
    await shop.save();

    await DB.User.update({
      _id: global.user._id
    }, {
      $set: {
        shopId: shop._id,
        isShop: true
      }
    });

    product = new DB.Product({
      name: 'product 1',
      price: 100
    });

    await product.save();

    option = new DB.ProductOption({
      name: 'Size',
      key: 'size',
      options: [{
        key: 'm',
        displayText: 'M'
      }]
    });
    await option.save();
  });

  after(async () => {
    await product.remove();
    await shop.remove();
    await option.remove();
    await DB.User.update({
      _id: global.user._id
    }, {
      $set: {
        shopId: null,
        isShop: false
      }
    });

    newCatalog.options = [{
      key: 'm',
      value: 'M',
      displayText: 'M'
    }];
  });

  it('Should create new variants', async () => {
    const body = await testUtil.request('post', `/v1/products/${product._id}/variants`, global.userToken, newCatalog);

    expect(body).to.exist;
    expect(body.price).to.equal(newCatalog.price);
    expect(body.productId).to.exist;
    variant = body;
  });

  it('Should update variant', async () => {
    const body = await testUtil.request('put', `/v1/products/${product._id}/variants/${variant._id}`, global.userToken, {
      price: 10
    });

    expect(body).to.exist;
    expect(body.price).to.equal(10);
    expect(body.productId).to.exist;
    variant = body;
  });

  it('Should get list variants of a product', async () => {
    const body = await testUtil.request('get', `/v1/products/${product._id}/variants`, global.userToken);

    expect(body).to.exist;
    expect(body.count).to.exist;
    expect(body.items).to.exist;
  });

  it('Should delete variant', async () => {
    const body = await testUtil.request('delete', `/v1/products/${product._id}/variants/${variant._id}`, global.userToken);

    expect(body).to.exist;
  });
});
