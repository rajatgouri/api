/* eslint no-restricted-syntax: 0, no-await-in-loop: 0, no-param-reassign: 0, no-continue: 0 */
const _ = require('lodash');
const csv = require('csvtojson');
const moment = require('moment');

const lowQuantityNumber = parseInt(process.env.LOW_QUALITY_QUANTITY, 10) || 1;

exports.updateQuantity = async ({ productId, productVariantId, quantity }) => {
  try {
    let sendEmailLowStock = false;
    let sendEmailSoldOut = false;
    const product = await DB.Product.findOne({ _id: productId });
    if (!product) {
      throw new Error('Product not found!');
    }
    const productVariant = productVariantId ?
      await DB.ProductVariant.findOne({ _id: productVariantId }) : null;
    if (productVariant && productVariant.stockQuantity > 0) {
      let stockQuantity = productVariant.stockQuantity - quantity;
      if (stockQuantity < 0) {
        stockQuantity = 0;
      }

      if (stockQuantity === 0) {
        sendEmailSoldOut = true;
      } else if (stockQuantity <= lowQuantityNumber) {
        sendEmailLowStock = true;
      }
      productVariant.stockQuantity = stockQuantity;
      await productVariant.save();
    } else if (!productVariant) {
      let stockQuantity = product.stockQuantity - quantity;
      if (stockQuantity < 0) {
        stockQuantity = 0;
      }

      if (stockQuantity === 0) {
        sendEmailSoldOut = true;
      } else if (stockQuantity <= lowQuantityNumber) {
        sendEmailLowStock = true;
      }
      product.stockQuantity = stockQuantity;
      await product.save();
    }

    const data = {
      product: product.toObject(),
      productVariant: productVariant ? productVariant.toObject() : null
    };
    if (sendEmailLowStock) {
      await Service.Product.notifyLowStock(data);
    }
    if (sendEmailSoldOut) {
      await Service.Product.notifySoldOut(data);
    }
  } catch (e) {
    throw e;
  }
};

exports.notifyLowStock = async (options) => {
  try {
    const shop = await DB.Shop.findOne({ _id: options.product.shopId });
    if (!shop) {
      return;
    }

    if (shop.email) {
      Service.Mailer.send('product/low-stock-alert.html', shop.email, {
        subject: `Low stock product "${options.product.name}"`,
        product: options.product,
        productVariant: options.productVariant
      });
    }

    if (process.env.EMAIL_NOTIFICATION_LOW_STOCK) {
      Service.Mailer.send('product/low-stock-alert.html', process.env.EMAIL_NOTIFICATION_LOW_STOCK, {
        subject: `Low stock product "${options.product.name}". Shop "${shop.name}"`,
        product: options.product,
        productVariant: options.productVariant
      });
    }
  } catch (e) {
    throw e;
  }
};

exports.notifySoldOut = async (options) => {
  try {
    const shop = await DB.Shop.findOne({ _id: options.product.shopId });
    if (!shop) {
      return;
    }

    if (shop.email) {
      Service.Mailer.send('product/sold-out-alert.html', shop.email, {
        subject: `Sold out product "${options.product.name}"`,
        product: options.product,
        productVariant: options.productVariant
      });
    }

    if (process.env.EMAIL_NOTIFICATION_LOW_STOCK) {
      Service.Mailer.send('product/sold-out-alert.html', process.env.EMAIL_NOTIFICATION_LOW_STOCK, {
        subject: `Sold out product "${options.product.name}". Shop "${shop.name}"`,
        product: options.product,
        productVariant: options.productVariant
      });
    }
  } catch (e) {
    throw e;
  }
};

exports.updateSoldOut = async (productId) => {
  try {
    // check variant, if have variant and quantity is 0, update to sold out
    // otherwise check product
    let soldOut = false;
    const variantCheck = await DB.ProductVariant.count({
      productId,
      stockQuantity: { $lte: 0 }
    });

    if (variantCheck) {
      soldOut = true;
    } else {
      const product = await DB.Product.findOne({ _id: productId });
      if (product.stockQuantity <= 0) {
        soldOut = true;
      }
    }

    return DB.Product.update({ _id: productId }, {
      $set: { soldOut }
    });
  } catch (e) {
    throw e;
  }
};

exports.updateShopStatus = async (productId) => {
  try {
    const product = productId instanceof DB.Product ? productId : await DB.Product.findOne({ _id: productId });
    if (!product || !product.shopId) {
      return false;
    }

    const shop = await DB.Shop.findOne({ _id: product.shopId });
    if (!shop) {
      return false;
    }
    product.shopFeatured = shop.featured;
    product.shopActivated = shop.activated;
    product.shopVerified = shop.verified;
    return product.save();
  } catch (e) {
    throw e;
  }
};

exports.getProductsCsv = async (shopId) => {
  try {
    // get product and populate to csv content
    const products = await DB.Product.find({ shopId });
    const productIds = products.map(p => p._id);
    const productVariants = productIds.length ? await DB.ProductVariant.find({ productId: { $in: productIds } }) : [];
    const results = [];

    // filter and map product catgory to product
    let categories = [];
    const categoryIds = products.map(p => p.categoryId);
    if (categoryIds.length) {
      categories = await DB.ProductCategory.find({
        _id: {
          $in: categoryIds
        }
      });
    }

    products.forEach((product) => {
      const dataProduct = product.toJSON();
      dataProduct.productType = 'Product';
      dataProduct.parent = '';
      if (product.categoryId) {
        const category = _.find(categories, c => c._id.toString() === product.categoryId.toString());
        if (category) {
          dataProduct.categoryName = category.name;
        }
      }
      results.push(dataProduct);
      const variants = productVariants.filter(v => v.productId.toString() === product._id.toString());
      variants.forEach((variant) => {
        const dataVariant = variant.toJSON();
        dataVariant.parent = dataProduct.name;
        dataVariant.name = dataProduct.name;
        dataVariant.productType = 'Variant';
        results.push(dataVariant);
      });
    });

    return results;
  } catch (e) {
    throw e;
  }
};

// TODO - move to queue
exports.importCsv = async (shopId, csvFilePath) => {
  try {
    const jsonArray = await csv().fromFile(csvFilePath);
    if (!jsonArray.length) {
      throw new Error('Csv file is empty');
    }
    const testData = jsonArray[0];
    let valid = true;
    const shopData = await DB.Shop.findOne({
      _id: shopId
    });
    const shop = shopData.toObject();
    // validate content of the csv
    ['Name', 'Category', 'Product parent', 'Short description', 'Description', 'Type', 'Price', 'Sale price'].forEach((key) => {
      if (!_.has(testData, key)) {
        valid = false;
      }
    });
    if (!valid) {
      throw new Error('Invalid CSV format');
    }
    // group products to product and variants
    const products = jsonArray.filter(k => !k['Product parent'] && k.Name && k.Category);
    const variants = jsonArray.filter(k => k['Product parent'] && k['Variant uuid'] && k['Variant options']);

    for (const productData of products) {
      // create or update product if not have
      if (!productData.Name || !productData.Category) {
        continue;
      }
      let product = await DB.Product.findOne({
        shopId,
        name: productData.Name
      });
      if (!product) {
        product = new DB.Product({ shopId });
      }
      product.name = productData.Name;
      product.shortDescription = productData['Short description'];
      product.description = productData.Description;
      product.type = productData.Type.toLowerCase() === 'digital' ? 'digital' : 'physical';
      product.price = parseFloat(productData.Price) || 0;
      product.salePrice = parseFloat(productData['Sale price']) || 0;
      if (product.price <= 0 || product.salePrice <= 0 || product.price < product.salePrice) {
        continue;
      }
      if (product.salePrice && product.salePrice < product.price) {
        product.discounted = true;
      }
      product.isActive = (productData.Active || '').toUpperCase() === 'Y';
      if (product.isActive) {
        product.shopVerified = shop.verified;
        product.shopActivated = shop.activated;
      }
      product.sku = productData.SKU || '';
      product.upc = productData.UPC || '';
      product.ean = productData.EAN || '';
      product.mpn = productData.MPN || '';
      product.jan = productData.JAN || '';
      product.isbn = productData.JSBN || '';
      product.taxClass = productData['Tax class'];
      product.taxPercentage = parseFloat(productData['Tax percentage']) || 0;
      product.freeShip = (productData['Free ship'] || '').toUpperCase() === 'Y';
      product.dailyDeal = (productData['Daily deal'] || '').toUpperCase() === 'Y';
      product.dealTo = productData['Deal to'] ? moment(productData['Deal to'], ['DD/MM/YYYY', 'MM/DD/YYYY']).toDate() : null;
      product.metaSeo.keywords = productData['Meta keywords'];
      product.metaSeo.description = productData['Meta description'];
      if (productData['Stock quantity']) {
        const stockQuantity = parseInt(productData['Stock quantity'], 10) || 0;
        product.stockQuantity = stockQuantity;
      }
      if (productData.Specifications) {
        const specifications = [];
        productData.Specifications.split('||').forEach((spec) => {
          const dataValue = spec.split(':');
          if (dataValue.length && dataValue.length > 1) {
            specifications.push({
              key: dataValue[0].trim(),
              value: dataValue[1].trim()
            });
          }
        });
        product.specifications = specifications;
      }

      let alias = productData.Alias ? Helper.String.createAlias(productData.Alias) : Helper.String.createAlias(productData.name);
      const count = await DB.Product.count({
        alias,
        _id: { $ne: product._id }
      });
      if (count) {
        alias = `${alias}-${Helper.String.randomString(5)}`;
      }
      product.alias = alias;

      // check and update category
      if (productData.Category) {
        const category = await DB.ProductCategory.findOne({ name: productData.Category.trim() });
        if (category) {
          product.categoryId = category._id;
        }
      }

      await product.save();
    }

    for (const variantData of variants) {
      if (!variantData['Variant options']) {
        continue;
      }
      const options = [];
      variantData['Variant options'].split('||').forEach((option) => {
        const optionKeys = option.split(':');
        if (optionKeys.length > 1) {
          options.push({
            displayText: optionKeys[0],
            value: optionKeys[1]
          });
        }
      });
      if (!options.length) {
        continue;
      }
      const product = await DB.Product.findOne({
        shopId,
        name: variantData['Product parent']
      });
      if (!product) {
        continue;
      }

      // remap option key with system key (for search)
      await Promise.all(options.map(option => DB.ProductOption.findOne({
        options: {
          $elemMatch: {
            displayText: option.displayText
          }
        }
      })
        .then((result) => {
          if (result) {
            option.optionKey = result.key;
          }
        })));

      // check variant and do update or create a new one
      let variant;
      if (variantData['Variant uuid']) {
        variant = await DB.ProductVariant.findOne({
          productId: product._id,
          uuid: variantData['Variant uuid']
        });
      }
      if (!variant) {
        variant = new DB.ProductVariant({
          productId: product._id,
          uuid: variantData['Variant uuid']
        });
      }
      variant.price = parseFloat(variantData.Price) || 0;
      variant.salePrice = parseFloat(variantData['Sale price']) || 0;
      variant.stockQuantity = parseFloat(variantData['Stock quantity']) || 0;
      variant.options = options;
      if (variantData.Specifications) {
        const specifications = [];
        variantData.Specifications.split('||').forEach((spec) => {
          const dataValue = spec.split(':');
          if (dataValue.length && dataValue.length < 1) {
            specifications.push({
              key: dataValue[0].trim(),
              value: dataValue[1].trim()
            });
          }
        });
        variant.specifications = specifications;
      }
      await variant.save();
    }
  } catch (e) {
    throw e;
  }
};

function setFlagToNode(node, ids) {
  let flag = false;
  const index = _.findIndex(ids, id => id.toString() === node._id.toString());
  if (index > -1) {
    node.flag = true;
    flag = true;
  }

  if (node.children) {
    node.children.forEach((childNode) => {
      const f1 = setFlagToNode(childNode, ids);
      if (f1) {
        node.flag = true;
        flag = true;
      }
    });
  }

  return flag;
}

function removeNonFlag(array, node, index) {
  if (!node.flag) {
    array.splice(index, 1);
  } else if (node.children) {
    let i = node.children.length;
    while (i--) {
      if (!node.children[i].flag) {
        node.children.splice(i, 1);
      } else {
        removeNonFlag(node.children, node.children[i], i);
      }
    }
  }
}

exports.getShopCategoryTree = async (shopId) => {
  try {
    // TODO - get cache here
    const shopCategory = await DB.Product.aggregate([{
      $match: {
        shopId: Helper.App.toObjectId(shopId)
      }
    }, {
      $group: {
        _id: '$categoryId'
      }
    }]);

    if (!shopCategory || !shopCategory.length) {
      return [];
    }
    const shopCategoryIds = shopCategory.map(c => c._id);

    const categories = await DB.ProductCategory.find()
      .populate({
        path: 'mainImage',
        select: '_id filePath mediumPath thumbPath uploaded type'
      })
      .sort({ ordering: -1 });
    const tree = Helper.Utils.unflatten(categories.map(c => c.toJSON()));
    tree.forEach(n => setFlagToNode(n, shopCategoryIds));
    let i = tree.length;
    while (i--) {
      removeNonFlag(tree, tree[i], i);
    }

    return tree;
  } catch (e) {
    throw e;
  }
};


exports.calculateRentPrice = (product, startDate, endDate) => {

  var fromDate = moment(startDate);
  var toDate = moment(endDate).add(1, 'day');
  var diff = moment.duration(toDate.diff(fromDate));
  let price = 0;
  let month = diff.months();
  let week = diff.weeks();
  let days = ((diff.days())%7);
  if(month > 0){
    price += month*product.pricePerMonth;
    //console.log("Price 1"+price);
  }
  if(week > 0){
    price += week*product.pricePerWeek;
    //console.log("Price 2"+price);
  }
  if(days > 0){
    price += days*product.price;
    //console.log("Price 3"+price);
  }
  /*console.log(price);
  console.log(month);
  console.log(week);
  console.log(days);*/
  return price;

};
