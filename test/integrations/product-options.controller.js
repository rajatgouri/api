describe('Test product options', () => {
  let option;
  const newOption = {
    name: 'Size',
    key: 'size',
    options: [{
      key: 'M',
      displayText: 'M'
    }, {
      key: 'other',
      displayText: 'Other'
    }]
  };
  const optionName = 'Toyota';
  it('Should create new option with admin role', async () => {
    const body = await testUtil.request('post', '/v1/products/options', adminToken, newOption);

    expect(body).to.exist;
    expect(body.name).to.equal(newOption.name);
    expect(body.key).to.exist;
    option = body;
  });

  it('Should NOT create new option same key', async () => {
    const body = await testUtil.request('post', '/v1/products/options', adminToken, newOption, 400);

    expect(body).to.exist;
  });

  it('Should update option with admin role', async () => {
    const body = await testUtil.request('put', `/v1/products/options/${option._id}`, adminToken, { name: optionName });

    expect(body).to.exist;
    expect(body.name).to.equal(optionName);
  });

  it('Should get option', async () => {
    const body = await testUtil.request('get', `/v1/products/options/${option._id}`);

    expect(body).to.exist;
    expect(body.name).to.equal(optionName);
  });

  it('Should get list option', async () => {
    const body = await testUtil.request('get', '/v1/products/options');

    expect(body).to.exist;
    expect(body.count).to.exist;
    expect(body.items).to.exist;
  });
});
