describe('Test report module', () => {
  let report;
  let shop;

  before(async () => {
    shop = new DB.Shop({
      ownerId: global.user._id,
      name: 'Shop test'
    });
    await shop.save();
  });

  after(async () => {
    await shop.remove();
  });

  it('Should create new report', async () => {
    const body = await testUtil.request('post', '/v1/reports', global.userToken, {
      content: 'some text',
      type: 'type',
      shopId: shop._id
    });

    expect(body).to.exist;
    expect(body.content).to.equal('some text');
    expect(body.status).to.equal('pending');
    expect(body.code).to.exist;
    report = body;
  });

  it('Should get list reports', async () => {
    const body = await testUtil.request('get', '/v1/reports', global.adminToken);

    expect(body).to.exist;
    expect(body.count).to.exist;
    expect(body.items).to.exist;
    expect(body.items).to.have.length(1);
  });

  it('Should update report with admin role', async () => {
    const body = await testUtil.request('put', `/v1/reports/${report._id}`, global.userToken, {
      content: 'text',
      status: 'resolved',
      note: 'some text'
    });

    expect(body).to.exist;
    expect(body.content).to.equal('text');
    expect(body.status).to.equal('resolved');
    expect(body.note).to.equal('some text');
    report = body;
  });

  it('Should delete report', async () => {
    const body = await testUtil.request('delete', `/v1/reports/${report._id}`, global.adminToken);

    expect(body).to.exist;
  });

  it('Should get list report with zero item', async () => {
    const body = await testUtil.request('get', '/v1/reports', global.adminToken);

    expect(body).to.exist;
    expect(body.count).to.exist;
    expect(body.items).to.exist;
    expect(body.items).to.have.length(0);
  });
});
