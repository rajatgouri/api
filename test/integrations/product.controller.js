describe('Test product', () => {
  let product;
  const newCategory = {
    name: 'Honda',
    description: 'Some text',
    specifications: ['Color', 'Weight'],
    metaSeo: {
      keywords: 'key1',
      description: 'description 1'
    }
  };

  const newProduct = {
    name: 'Product 1',
    description: 'Some text',
    metaSeo: {
      keywords: 'key1',
      description: 'description 1'
    },
    specifications: [{
      key: 'spec1',
      value: 'spec 1'
    }]
  };

  before(async () => {
    newCategory.mainImage = global.media.photo._id;
    newProduct.mainImage = global.media.photo._id;
    newProduct.images = [global.media.photo._id];
  });

  after(async () => {
    // TODO - check me
    // await testUtil.request('delete', `/v1/products/categories/${category._id}`, adminToken);
  });

  describe('Test create product', () => {
    // it('Should not create product for normal user', async () => {
    //   const body = await testUtil.request('post', '/v1/products', global.userToken, newProduct, 403);
    //
    //   expect(body).to.not.exist;
    // });

    describe('Test with shop role', () => {
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
      });

      it('Should create a new product under shop role', async () => {
        const body = await testUtil.request('post', '/v1/products', global.userToken, newProduct);

        expect(body).to.exist;
        expect(body.name).to.equal(newProduct.name);
        expect(body.alias).to.exist;
        expect(body.specifications).to.be.length(1);
        expect(body.mainImage).to.exist;
        expect(body.images).to.exist;
        expect(body.images).to.be.length(1);
        expect(body.shopId).to.be.exist;
        product = body;
      });

      it('Should update product', async () => {
        const newUpdate = {
          name: 'new product name',
          specifications: []
        };
        const body = await testUtil.request('put', `/v1/products/${product._id}`, global.userToken, newUpdate);

        expect(body).to.exist;
        expect(body.name).to.equal(newUpdate.name);
        expect(body.alias).to.exist;
        expect(body.specifications).to.be.length(0);
        expect(body.mainImage).to.exist;
        expect(body.images).to.exist;
        expect(body.images).to.be.length(1);
      });
    });
  });
});
