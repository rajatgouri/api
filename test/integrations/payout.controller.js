describe('Test payout module', () => {
  let payoutAccount;
  let payoutRequest;

  before(async () => {
    const newShop = new DB.Shop({
      email: 'newtestshop@test.com',
      name: 'Shop test',
      phoneNumber: '+98751123',
      address: '123 somewhere',
      state: 'some there',
      city: 'city',
      country: 'US',
      zipcode: '12345',
      verificationIssueId: '5b4431a14c8ffd5cb5e0fdf0' // fake id just for testing
    });
    await newShop.save();
    await DB.User.update({ _id: global.user._id }, {
      shopId: newShop._id,
      isShop: true
    });
    global.user.shopId = newShop._id;
    global.user.isShop = true;
  });

  describe('Test payout account module', () => {
    it('Should create new payout account', async () => {
      const body = await testUtil.request('post', '/v1/payout/accounts', global.userToken, {
        type: 'paypal',
        paypalAccount: 'test@account.com'
      });

      expect(body).to.exist;
      expect(body.type).to.equal('paypal');
      payoutAccount = body;
    });

    it('Should update paypal account', async () => {
      const body = await testUtil.request('put', `/v1/payout/accounts/${payoutAccount._id}`, global.userToken, {
        type: 'bank-account',
        bankName: 'some bank',
        swiftCode: '123'
      });

      expect(body).to.exist;
      expect(body.type).to.equal('bank-account');
      payoutAccount = body;
    });

    it('Should get list accounts', async () => {
      const body = await testUtil.request('get', '/v1/payout/accounts', global.userToken);

      expect(body).to.exist;
      expect(body.count).to.exist;
      expect(body.items).to.exist;
      expect(body.items).to.have.length(1);
    });

    it('Should delete account', async () => {
      const body = await testUtil.request('delete', `/v1/payout/accounts/${payoutAccount._id}`, global.userToken);

      expect(body).to.exist;
      expect(body.success).to.equal(true);
    });
  });

  describe('Test payout request module', () => {
    before(async () => {
      // create new account
      const body = await testUtil.request('post', '/v1/payout/accounts', global.userToken, {
        type: 'paypal',
        paypalAccount: 'test@account.com'
      });
      payoutAccount = body;

      await DB.OrderDetail.remove({ shopId: global.user.shopId });
    });

    describe('Test without order', () => {
      it('Should not send request if balance is not enough', async () => {
        const body = await testUtil.request('post', '/v1/payout/request', global.userToken, {
          payoutAccountId: payoutAccount._id
        }, 400);

        expect(body).to.not.exist;
      });
    });

    describe('Test with order', () => {
      before(async () => {
        await DB.OrderDetail.remove({ shopId: global.user.shopId });
        await DB.OrderDetail.create({
          status: 'completed',
          totalPrice: 100,
          commission: 20,
          balance: 80,
          paymentMethod: 'cod',
          paymentStatus: 'completed',
          shopId: global.user.shopId
        }, {
          status: 'completed',
          totalPrice: 100,
          commission: 20,
          balance: 80,
          paymentMethod: 'paypal',
          paymentStatus: 'completed',
          shopId: global.user.shopId
        });
      });

      it('Should get balance', async () => {
        const body = await testUtil.request('get', '/v1/payout/balance', global.userToken);

        expect(body).to.exist;
        expect(body.summary).to.exist;
        expect(body.nonCod).to.exist;
        expect(body.cod).to.exist;

        expect(body.nonCod.commission).to.equal(20);
        expect(body.nonCod.balance).to.equal(80);
        expect(body.nonCod.total).to.equal(100);

        expect(body.cod.commission).to.equal(20);
        expect(body.cod.balance).to.equal(80);
        expect(body.cod.total).to.equal(100);

        expect(body.summary.commission).to.equal(40);
        expect(body.summary.balance).to.equal(60);
        expect(body.summary.total).to.equal(200);
      });

      it('Should get balance of shop by admin ', async () => {
        const body = await testUtil.request('get', `/v1/payout/balance/${global.user.shopId}`, global.adminToken);

        expect(body).to.exist;
        expect(body.summary).to.exist;
        expect(body.nonCod).to.exist;
        expect(body.cod).to.exist;

        expect(body.nonCod.commission).to.equal(20);
        expect(body.nonCod.balance).to.equal(80);
        expect(body.nonCod.total).to.equal(100);

        expect(body.cod.commission).to.equal(20);
        expect(body.cod.balance).to.equal(80);
        expect(body.cod.total).to.equal(100);

        expect(body.summary.commission).to.equal(40);
        expect(body.summary.balance).to.equal(60);
        expect(body.summary.total).to.equal(200);
      });

      it('Should send request', async () => {
        const body = await testUtil.request('post', '/v1/payout/request', global.userToken, {
          payoutAccountId: payoutAccount._id
        });

        expect(body).to.exist;
        expect(body.code).to.exist;
        expect(body.payoutAccount).to.exist;
        expect(body.details).to.exist;
        expect(body.requestToTime).to.exist;
        expect(body.total).to.equal(200);
        expect(body.commission).to.equal(40);
        expect(body.shopBalance).to.equal(60);
        expect(body.siteBalance).to.equal(20);

        payoutRequest = body;
      });

      it('Should update request if not approve yet', async () => {
        await DB.OrderDetail.create({
          status: 'completed',
          totalPrice: 100,
          commission: 20,
          balance: 80,
          paymentMethod: 'cod',
          paymentStatus: 'completed',
          shopId: global.user.shopId
        });

        const body = await testUtil.request('post', '/v1/payout/request', global.userToken, {
          payoutAccountId: payoutAccount._id
        });

        expect(body).to.exist;
        expect(body.code).to.exist;
        expect(body.payoutAccount).to.exist;
        expect(body.details).to.exist;
        expect(body.requestToTime).to.exist;
        expect(body.total).to.equal(300);
        expect(body.commission).to.equal(60);
        expect(body.shopBalance).to.equal(40);
        expect(body.siteBalance).to.equal(40);
        expect(body._id).to.equal(payoutRequest._id);
        payoutRequest = body;
      });

      it('Should reject request', async () => {
        const body = await testUtil.request('post', `/v1/payout/request/${payoutRequest._id}/reject`, global.adminToken, {
          rejectReason: 'some text',
          note: 'some text'
        });
        expect(body).to.exist;
      });

      it('Should approve request', async () => {
        const body = await testUtil.request('post', `/v1/payout/request/${payoutRequest._id}/approve`, global.adminToken, {
          note: 'some text'
        });
        expect(body).to.exist;
      });

      it('Should not send request after admin approved and order is mark completed', async () => {
        const body = await testUtil.request('post', '/v1/payout/request', global.userToken, {
          payoutAccountId: payoutAccount._id
        }, 400);

        expect(body).to.not.exist;
      });

      it('Should get list with shop role', async () => {
        const body = await testUtil.request('get', '/v1/payout/requests', global.userToken);

        expect(body).to.exist;
        expect(body.items).to.exist;
        expect(body.count).to.exist;
        expect(body.items[0].shop).to.exist;
      });

      it('Should get list with admin role', async () => {
        const body = await testUtil.request('get', '/v1/payout/requests', global.adminToken);

        expect(body).to.exist;
        expect(body.items).to.exist;
        expect(body.count).to.exist;
        expect(body.items[0].shop).to.exist;
      });

      it('Should get details', async () => {
        const body = await testUtil.request('get', `/v1/payout/requests/${payoutRequest._id}`, global.adminToken);

        expect(body).to.exist;
        expect(body.code).to.exist;
        expect(body.shop).to.exist;
      });
    });
  });
});
