describe('Test product category', () => {
  let category;
  const newCategory = {
    name: 'Honda',
    description: 'Some text',
    metaSeo: {
      keywords: 'key1',
      description: 'description 1'
    }
  };
  const categoryName = 'Toyota';
  let category1;
  before(async () => {
    category1 = new DB.ProductCategory({
      name: 'category 1'
    });
    await category1.save();

    const category2 = new DB.ProductCategory({
      name: 'category 1',
      parentId: category1._id
    });
    await category2.save();

    const category3 = new DB.ProductCategory({
      name: 'category 3',
      parentId: category2._id
    });
    await category3.save();
  });

  it('Should create new category with admin role', async () => {
    newCategory.mainImage = global.media.photo._id;
    const body = await testUtil.request('post', '/v1/products/categories', adminToken, newCategory);

    expect(body).to.exist;
    expect(body.name).to.equal(newCategory.name);
    expect(body.description).to.equal(newCategory.description);
    expect(body.alias).to.exist;
    category = body;
  });

  it('Should update category with admin role', async () => {
    const body = await testUtil.request('put', `/v1/products/categories/${category._id}`, adminToken, { name: categoryName });

    expect(body).to.exist;
    expect(body.name).to.equal(categoryName);
    category = body;
  });

  it('Should get category', async () => {
    const body = await testUtil.request('get', `/v1/products/categories/${category._id}`);

    expect(body).to.exist;
    expect(body.name).to.equal(categoryName);
  });

  it('Should get list category', async () => {
    const body = await testUtil.request('get', '/v1/products/categories');

    expect(body).to.exist;
    expect(body.count).to.exist;
    expect(body.items).to.exist;
  });

  it('Should get tree category', async () => {
    const body = await testUtil.request('get', '/v1/products/categories/tree');

    expect(body).to.exist;
    // expect(body).to.be.length(2);
  });

  it('Should not delete parent category', async () => {
    const body = await testUtil.request('delete', `/v1/products/categories/${category1._id}`, adminToken, null, 400);

    expect(body).not.exist;
  });

  it('Should not delete sub category', async () => {
    const body = await testUtil.request('delete', `/v1/products/categories/${category._id}`, adminToken);

    expect(body).to.exist;
  });
});
