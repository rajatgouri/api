const Schema = require('mongoose').Schema;

const schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId
  },
  shopId: {
    type: Schema.Types.ObjectId
  },
  accountId: {
    type: String,
    trim: true
  },
  personId: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['paypal', 'bank-account', 'stripe'],
    default: 'paypal'
  },
  account_type:{
    type: String,
    enum: ['company', 'individual'],
    default: 'individual'
  },
  paypalAccount: {
    type: String,
    trim: true
  },
  // information for bank
  accountHolderName: {
    type: String,
    trim:true
  },
  accountNumber: {
    type: String,
    trim: true
  },
  iban: {
    type: String,
    trim: true
  },
  bankName: {
    type: String,
    trim:true
  },
  bankAddress: {
    type: String,
    trim: true
  },
  sortCode: {
    type: String,
    trim:true
  },
  routingNumber: {
    type: String,
    trim:true
  },
  swiftCode: {
    type: String,
    trim: true
  },
  ifscCode: {
    type: String,
    trim: true
  },
  routingCode: {
    type: String,
    trim:true
  },
  //Information for stripe
  /*country: {
    type: String,
    trim: true
  },*/
  currency: {
    type: String,
    trim: true
  },
  mcc: {
    type: String,
    trim: true
  },
  businessName: {
    type: String,
    trim: true
  },
  
  description: {
    type: String,
    trim: true
  },
  url: {
    type: String,
    trim: true
  },
  company: {
    address: {
      companyline1: {
        type: String,
        trim: true
      },
      companyline2: {
        type: String,
        trim: true
      },
      companyPostalCode: {
        type: String,
        trim: true
      },
      companyCity: {
        type: String,
        trim: true
      },
      companyState: {
        type: String,
        trim: true
      },
      dialcode: {
        type: String,
        trim: true
      },
      phone: {
        type: String,
        trim: true
      },
      country: {
        type: String,
        trim: true
      }  
    },
    taxId: {
      type: String,
      trim: true
    },
    vatId: {
      type: String,
      trim: true
    },
    name: {
      type: String,
      trim: true
    }  
  },
  account: {
    accountHolderName: {
      type: String,
      trim: true
    },
    routingNumber: {
      type: String,
      trim: true
    },
    accountNumber: {
      type: String,
      trim: true
    }
  },
  personal: {
    firstName: {
      type: String,
      trim: true
    },
    lastName: {
      type: String,
      trim: true
    },
    dateOfBirth: {
      type: String,
      trim: true
    },
    address: {
      line1: {
        type: String,
        trim: true
      },
      line2: {
        type: String,
        trim: true
      },
      postalCode: {
        type: String,
        trim: true
      },
      city: {
        type: String,
        trim: true
      },
      state: {
        type: String,
        trim: true
      },
      country: {
        type: String,
        trim: true
      }
    },
    ssnLast4: {
      type: String,
      trim: true
    }
  },
  createdAt: {
    type: Date
  },
  updatedAt: {
    type: Date
  }
}, {
  minimize: false,
  timestamps: {
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  }
});

module.exports = schema;
