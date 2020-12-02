describe('Test featured packages', () => {
  let featuredPackage;

  it('Should create new featuredPackage', async () => {
    const body = await testUtil.request('post', '/v1/packages/featured', global.adminToken, {
      name: 'abc',
      price: 10,
      ordering: 1,
      description: 'test',
      numDays: 10
    });

    expect(body).to.exist;
    expect(body.name).to.equal('abc');
    featuredPackage = body;
  });

  it('Should update featuredPackage', async () => {
    const body = await testUtil.request('put', `/v1/packages/featured/${featuredPackage._id}`, global.adminToken, {
      name: 'xyz',
      price: 10,
      ordering: 1,
      description: 'test',
      numDays: 10
    });

    expect(body).to.exist;
    expect(body.name).to.equal('xyz');
    featuredPackage = body;
  });

  it('Should get list packages/featured', async () => {
    const body = await testUtil.request('get', '/v1/packages/featured', global.adminToken);

    expect(body).to.exist;
    expect(body.count).to.exist;
    expect(body.items).to.exist;
    expect(body.items).to.have.length(1);
  });
});
