const Joi = require('joi');
const url = require('url');
const nconf = require('nconf');
const Braintree = require('../components/Braintree');
const { DocDB } = require('aws-sdk');


exports.donate = async (req,res,next) => {
  
  let donationData = {
    userId: req.user._id,
    name: req.body.name,
    price: parseInt(req.body.amount),
    description: req.body.description,
    stripeToken: req.body.stripeToken
  }
  const data = await Service.Payment.createDonation(donationData);

  res.locals.request = data;
  return next();

}


exports.getDonations = async (req,res,next) => {
 
  let donationPayload = {
    page: req.body.page,
    take: req.body.take,
    sort: req.body.sort,
    sortType: req.body.sortType,
    status: req.body.status,
    userId: req.user._id,
    role: req.user.role
  }

  const data = await Service.Payment.getDonations(donationPayload);

  console.log(data)
  res.locals.donations = data;
  return next();

}

