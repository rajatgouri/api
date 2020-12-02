describe('Test coupon', () => {
  let coupon;

  before(async () => {
    const shop = new DB.Shop({
      ownerId: global.user._id,
      email: 'newshop@test.com',
      password: '123456',
      name: 'Shop test',
      phoneNumber: '+98751123',
      address: '123 somewhere',
      state: 'some there',
      city: 'city',
      country: 'US',
      zipcode: '12345',
      verificationIssueId: '5b4431a14c8ffd5cb5e0fdf0' // fake id just for testing
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
    global.user.shopId = shop._id;
    global.user.isShop = true;
  });

  it('Should create new coupon', async () => {
    const body = await testUtil.request('post', '/v1/coupons', global.userToken, {
      code: 'abc',
      limit: 1,
      discountPercentage: 10,
      name: 'Testing'
    });

    expect(body).to.exist;
    expect(body.code).to.equal('ABC');
    coupon = body;
  });

  it('Should update coupon', async () => {
    const body = await testUtil.request('put', `/v1/coupons/${coupon._id}`, global.userToken, {
      code: 'dev',
      limit: 1,
      discountPercentage: 10,
      name: 'Testing'
    });

    expect(body).to.exist;
    expect(body.code).to.equal('DEV');
    coupon = body;
  });

  it('Should get list coupons', async () => {
    const body = await testUtil.request('get', '/v1/coupons', global.userToken);

    expect(body).to.exist;
    expect(body.count).to.exist;
    expect(body.items).to.exist;
    expect(body.items).to.have.length(1);
  });

  describe('Test use coupon', () => {
    it('Should check coupon', async () => {
      const body = await testUtil.request('post', '/v1/coupons/check', null, {
        code: 'dev',
        shopId: global.user.shopId
      });

      expect(body).to.exist;
      expect(body.code).to.exist;
    });

    it('Should delete coupon', async () => {
      const body = await testUtil.request('delete', `/v1/coupons/${coupon._id}`, global.userToken);

      expect(body).to.exist;
    });
  });
});
