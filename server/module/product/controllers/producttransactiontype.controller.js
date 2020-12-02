const _ = require('lodash');
const Joi = require('joi');


const validateSchema = Joi.object().keys({
    name: Joi.string().required(),
    status: Joi.number().allow([null]).optional()
});


exports.findForDropdown = async (req, res, next) => {
    try {
      
      const productTransactionTypeList = await DB.ProductTransactionType.find();
      if (!productTransactionTypeList) {
        return res.status(404).send(PopulateResponse.notFound());
      }

      res.locals.productTransactionType = productTransactionTypeList;
      next();
    } catch (e) {
      next(e);
    }
};

exports.find = async (req, res, next) => {
  try {
    
    const id = req.params.id;
    console.log(id);
    const productTransactionDetails = await DB.ProductTransactionType.findOne({_id:id});
    if (!productTransactionDetails) {
      return res.status(404).send(PopulateResponse.notFound());
    }

    res.locals.productTransactionDetails = productTransactionDetails;
    next();
  } catch (e) {
    next(e);
  }
};