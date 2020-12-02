const Joi = require('joi');
const _ = require('lodash');
const Stripe = require('../../payment/components/Stripe');

const validateSchema = Joi.object().keys({
  type: Joi.string().allow(['paypal', 'bank-account']).required(),
  account_type: Joi.string().allow(['company', 'individual']),
  accountId: Joi.string().allow([null, '']),
  personId: Joi.string().allow([null, '']),
  paypalAccount: Joi.string().allow([null, '']).when('type', {
    is: 'paypal',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  accountHolderName: Joi.string().allow([null, '']),
  accountNumber: Joi.string().allow([null, '']),
  iban: Joi.string().allow([null, '']),
  bankName: Joi.string().allow([null, '']),
  bankAddress: Joi.string().allow([null, '']),
  sortCode: Joi.string().allow([null, '']),
  routingNumber: Joi.string().allow([null, '']),
  swiftCode: Joi.string().allow([null, '']),
  ifscCode: Joi.string().allow([null, '']),
  routingCode: Joi.string().allow([null, '']),
  account: {
    accountHolderName: Joi.string().allow(null, ''),
    routingNumber: Joi.string().allow(null, ''),
    accountNumber: Joi.string().allow(null, '')
  },
  currency: Joi.string().allow(null, ''),
  businessName: Joi.string().allow(null, ''),
  mcc: Joi.string().allow(null, ''),
  description: Joi.string().allow(null, ''),
  url: Joi.string().allow(null, ''),
  company: {
    address: {
      companyline1: Joi.string().allow(null, ''),
      companyline2: Joi.string().allow(null, ''),
      companyPostalCode: Joi.string().allow(null, ''),
      companyCity: Joi.string().allow(null, ''),
      companyState: Joi.string().allow(null, ''),
      dialcode: Joi.string().allow(null, ''),
      phone: Joi.string().allow(null, ''),
      country: Joi.string().allow(null, '')
    },
    taxId: Joi.string().allow(null, ''),
    vatId: Joi.string().allow(null, ''),
    name: Joi.string().allow(null, '')
  },
  personal: {
    firstName: Joi.string().allow(null, ''),
    lastName: Joi.string().allow(null, ''),
    dateOfBirth: Joi.string().allow(null, ''),
    address: {
      line1: Joi.string().allow(null, ''),
      line2: Joi.string().allow(null, ''),
      postalCode: Joi.string().allow(null, ''),
      city: Joi.string().allow(null, ''),
      state: Joi.string().allow(null, ''),
      country: Joi.string().allow(null, '')
    },
    ssnLast4: Joi.string().allow(null, '')

  }
});

exports.create = async (req, res, next) => {
  try {
    const validate = Joi.validate(req.body, validateSchema);
    if (validate.error) {
      return next(PopulateResponse.validationError(validate.error));
    }

    await this.payoutApi(req, res, next);

    const payoutAccount = new DB.PayoutAccount(Object.assign(req.body, {
      userId: req.user._id,
      shopId: req.user.shopId
    }));
    await payoutAccount.save();

    res.locals.create = payoutAccount;
    return next();
  } catch (e) {
    console.log(e)
    return next(e);
  }
};

exports.payoutApi = async (req, res, next) => {

  try {

  if (req.body.type === 'stripe') {


        let accountOptions = {
          "business_type": req.body.account_type,
          "email": req.user.email,
          "country": req.body.country,
          "type": "custom",
          "default_currency": req.body.currency,
          "capabilities": {
            "card_payments": {
              "requested": true
            },
            "transfers": {
              "requested": true
            }
          },
          "external_account": {
            "object": "bank_account",
            "country": req.body.personal.address.country,
            "currency": req.body.currency,
            "account_holder_name": req.body.account.accountHolderName,
            "account_holder_type": "company",
            "routing_number": req.body.account.routingNumber,
            "account_number": req.body.account.accountNumber
          },
          "tos_acceptance": {
            "date": Math.floor(Date.now() / 1000),
            "ip": req.connection.remoteAddress, // Assumes you're not using a proxy
          },
        }

        if(req.body.account_type == 'company')
        {
          accountOptions.business_profile = {
            "mcc": req.body.mcc,
            "name": req.body.businessName,
            "product_description": req.body.description,
            "support_phone": req.body.company.address.phone,
            "url": req.body.url
          };

          accountOptions.company = {
            "address": {
              "line1": req.body.company.address.companyline1,
              "line2": req.body.company.address.companyline2,
              "postal_code": req.body.company.address.companypPostalCode,
              "city": req.body.company.address.companyCity,
              "state": req.body.company.address.companyState
            },
            "phone": req.body.company.address.dialcode + req.body.company.address.phone,
            "tax_id": req.body.company.taxId,
            "vat_id": req.body.company.vatId,
            "name": req.body.company.name,
            "owners_provided": true
          };
        }

        let personDetails = {
          "first_name": req.body.personal.firstName,
          "last_name": req.body.personal.lastName,
          "email": req.user.email,
          "phone": req.user.phoneNumber,
          "relationship": {
            "director": false,
            "executive": false,
            "owner": true,
            "representative": true,
            "title": "CEO",

          },
          "dob": {
            "day": req.body.personal.dateOfBirth.split('-')[2],
            "month": req.body.personal.dateOfBirth.split('-')[1],
            "year": req.body.personal.dateOfBirth.split('-')[0]
          },
          "address": {
            "line1": req.body.personal.address.line1,
            "line2": req.body.personal.address.line1,
            "postal_code": req.body.personal.address.postalCode,
            "city": req.body.personal.address.city,
            "state": req.body.personal.address.state
          },
          "ssn_last_4": req.body.personal.ssnLast4
        }
      

        if(!req.body.accountId){
          let accountDetails = await Stripe.createAccount(accountOptions);

          const person = await Stripe.createPerson(
            accountDetails.id,
            personDetails
          );

          req.body.accountId = accountDetails.id;
          req.body.personId = person.id;

        } else {
          delete accountOptions['type'];
          delete accountOptions['business_type'];

          await Stripe.updateAccount(req.body.accountId, accountOptions);
          const person = await Stripe.updatePerson(
            req.body.accountId,
            req.body.personId,
            personDetails
          );
        }
        
        return true;
      }
  } catch (e) {
    console.log(e)
    return next(e);
  }
};



exports.findOne = async (req, res, next) => {
  try {
    const payoutAccount = await DB.PayoutAccount.findOne({
      _id: req.params.payoutAccountId
    });
    if (!payoutAccount) {
      return next(PopulateResponse.notFound());
    }

    req.payoutAccount = payoutAccount;
    res.locals.payoutAccount = payoutAccount;
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.update = async (req, res, next) => {
  try {
    const validate = Joi.validate(req.body, validateSchema);
    if (validate.error) {
      return next(PopulateResponse.validationError(validate.error));
    }

    //This is for stripe update
    await this.payoutApi(req, res, next);

    _.merge(req.payoutAccount, validate.value);
    await req.payoutAccount.save();
    res.locals.update = req.payoutAccount;
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.list = async (req, res, next) => {
  try {
    const page = Math.max(0, req.query.page - 1) || 0; // using a zero-based page index for use with skip()
    const take = parseInt(req.query.take, 10) || 10;
    const query = Helper.App.populateDbQuery(req.query, {
      equal: ['type']
    });
    const sort = Helper.App.populateDBSort(req.query);
    query.userId = req.user._id;
    const count = await DB.PayoutAccount.count(query);
    const items = await DB.PayoutAccount.find(query)
      .collation({ locale: 'en' })
      .sort(sort)
      .skip(page * take)
      .limit(take)
      .exec();
    res.locals.list = {
      count,
      items
    };
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.remove = async (req, res, next) => {
  try {
    req.payoutAccount.remove();
    res.locals.remove = { success: true };
    next();
  } catch (e) {
    next(e);
  }
};
