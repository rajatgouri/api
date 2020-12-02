describe('Test wishlist', () => {
  let product;
  let wishlist;

  before(async () => {
    product = new DB.Product({
      name: 'product testing 1',
      mainImage: global.media.photo._id
    });

    await product.save();
  });

  after(async () => {
    await product.remove();
  });

  it('Should create new wishlist', async () => {
    const body = await testUtil.request('post', '/v1/wishlist', global.userToken, {
      productId: product._id
    });

    expect(body).to.exist;
    expect(body.productId).to.equal(product._id.toString());
    wishlist = body;
  });

  it('Should get list wishlist', async () => {
    const body = await testUtil.request('get', '/v1/wishlist', global.userToken);

    expect(body).to.exist;
    expect(body.count).to.exist;
    expect(body.items).to.exist;
    expect(body.items).to.have.length(1);
  });

  it('Should delete wishlist', async () => {
    const body = await testUtil.request('delete', `/v1/wishlist/${wishlist._id}`, global.userToken);

    expect(body).to.exist;
  });

  it('Should get list wishlist with zero item', async () => {
    const body = await testUtil.request('get', '/v1/wishlist', global.userToken);

    expect(body).to.exist;
    expect(body.count).to.exist;
    expect(body.items).to.exist;
    expect(body.items).to.have.length(0);
  });
});
