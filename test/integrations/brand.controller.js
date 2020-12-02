describe('Test branch', () => {
  let brand;
  const newBranch = {
    name: 'Honda',
    ordering: 1
  };
  const brandName = 'Toyota';
  it('Should create new brand with admin role', async () => {
    const body = await testUtil.request('post', '/v1/brands', adminToken, newBranch);

    expect(body).to.exist;
    expect(body.name).to.equal(newBranch.name);
    expect(body.ordering).to.equal(newBranch.ordering);
    expect(body.alias).to.exist;
    brand = body;
  });

  it('Should update brand with admin role', async () => {
    const body = await testUtil.request('put', `/v1/brands/${brand._id}`, adminToken, { name: brandName });

    expect(body).to.exist;
    expect(body.name).to.equal(brandName);
  });

  it('Should get brand', async () => {
    const body = await testUtil.request('get', `/v1/brands/${brand._id}`);

    expect(body).to.exist;
    expect(body.name).to.equal(brandName);
  });

  it('Should get list brand', async () => {
    const body = await testUtil.request('get', '/v1/brands');

    expect(body).to.exist;
    expect(body.count).to.exist;
    expect(body.items).to.exist;
  });
});
