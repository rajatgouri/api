module.exports = async () => DB.Config.find({})
  .remove()
  .then(() => DB.Config.create(
    {
      key: 'siteName',
      value: 'Tradenshare',
      name: 'Site name',
      public: true
    }, {
      key: 'siteLogo',
      value: '/assets/images/logo.png',
      name: 'Site logo',
      public: true
    }, {
      key: 'siteFavicon',
      value: '/favicon.ico',
      name: 'Site favicon',
      public: true
    }, {
      key: 'contactEmail',
      value: 'admin@example.com',
      name: 'Contact email',
      public: false
    }, {
      key: 'homeSEO',
      value: {
        keywords: '',
        description: ''
      },
      name: 'SEO meta data for home page',
      type: 'mixed',
      public: true
    }, {
      key: 'codeHead',
      value: '',
      name: 'Custom code before end head tag',
      public: true
    }, {
      key: 'codeBody',
      value: '',
      name: 'Custom code before end body tag',
      public: true
    }, {
      key: 'socialLinks',
      value: {
        facebook: 'https://facebook.com',
        google: 'https://google.com',
        twitter: 'https://twitter.com',
        linkedin: 'https://linkedin.com',
        dribbble: 'https://dribbble.com'
      },
      name: 'Social links',
      public: true,
      type: 'mixed'
    }, {
      key: 'publicPhone',
      value: '+98761221',
      name: 'Public contact phone number',
      public: true
    }, {
      key: 'publicEmail',
      value: 'info@genstore.info',
      name: 'Public contact email',
      public: true
    },
    {
      key: 'securityIcon1',
      public: true,
      type: 'mixed',
      value: {
        title: 'Icon1',
        iconUrl: '',
        description: ''
      }
    },
    {
      key: 'securityIcon2',
      public: true,
      type: 'mixed',
      value: {
        title: 'Icon2',
        iconUrl: '',
        description: ''
      }
    },
    {
      key: 'securityIcon3',
      public: true,
      type: 'mixed',
      value: {
        title: 'Icon3',
        iconUrl: '',
        description: ''
      }
    }, {
      key: 'siteCommission',
      value: 0.2,
      name: 'Site commission',
      type: 'number',
      public: false,
      description: 'The commission of the site. 0.2 means 20%, please use decimal value, less than 1'
    }, {
      key: 'paymentGatewayConfig',
      value: {
        paypal: {
          enable: true
        },
        stripe: {
          enable: true
        },
        cod: {
          enable: true
        }
      },
      name: 'Payment gateway config',
      type: 'mixed',
      public: true,
      description: 'Enable or disable payment gateway'
    }
  ));
