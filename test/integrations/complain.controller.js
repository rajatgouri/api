describe('Test complain module', () => {
  let complain;

  it('Should create new complain', async () => {
    const body = await testUtil.request('post', '/v1/complains', global.userToken, {
      content: 'some text'
    });

    expect(body).to.exist;
    expect(body.content).to.equal('some text');
    expect(body.status).to.equal('pending');
    expect(body.code).to.exist;
    complain = body;
  });

  it('Should get list complains', async () => {
    const body = await testUtil.request('get', '/v1/complains', global.adminToken);

    expect(body).to.exist;
    expect(body.count).to.exist;
    expect(body.items).to.exist;
    expect(body.items).to.have.length(1);
  });

  it('Should update complain with admin role', async () => {
    const body = await testUtil.request('put', `/v1/complains/${complain._id}`, global.userToken, {
      content: 'text',
      status: 'resolved',
      note: 'some text'
    });

    expect(body).to.exist;
    expect(body.content).to.equal('text');
    expect(body.status).to.equal('resolved');
    expect(body.note).to.equal('some text');
    complain = body;
  });

  it('Should delete complain', async () => {
    const body = await testUtil.request('delete', `/v1/complains/${complain._id}`, global.adminToken);

    expect(body).to.exist;
  });

  it('Should get list complain with zero item', async () => {
    const body = await testUtil.request('get', '/v1/complains', global.adminToken);

    expect(body).to.exist;
    expect(body.count).to.exist;
    expect(body.items).to.exist;
    expect(body.items).to.have.length(0);
  });
});
