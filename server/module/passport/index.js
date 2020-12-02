const compose = require('composable-middleware');
const jwt = require('jsonwebtoken');
const nconf = require('nconf');

function getDecoded(req) {
  let token;
  if (req.query && Object.prototype.hasOwnProperty.call(req.query, 'access_token')) {
    token = req.query.access_token;
    req.headers.authorization = `Bearer ${req.query.access_token}`;
    token = req.query.access_token;
  } else if (!req.headers.authorization) {
    return null;
  } else {
    const tokenSplit = req.headers.authorization.split(' ');
    if (tokenSplit.length !== 2) { return null; }

    token = tokenSplit[1];
  }

  try {
    return jwt.verify(token, process.env.SESSION_SECRET);
  } catch (e) {
    return null;
  }
}

async function isAuthenticated(req, res, next) {
  try {
    const decoded = getDecoded(req);
    if (!decoded) {
      return next(PopulateResponse.unauthenticated());
    }

    const user = await DB.User.findOne({
      _id: decoded._id,
      isActive: true
    });
    if (!user) {
      return next(PopulateResponse.unauthenticated());
    }

    req.user = user;
    return next();
  } catch (e) {
    return next(e);
  }
}

async function loadUser(req, res, next) {
  const decoded = getDecoded(req);
  if (decoded === null) {
    return next();
  }

  try {
    const user = await DB.User.findOne({
      _id: decoded._id,
      isActive: true
    });
    if (user) {
      req.user = user;
    }

    req.user = user;
    return next();
  } catch (e) {
    return next(e);
  }
}

async function checkPlatform(req, res, next) {
  try {
    // if shop is deactivated, disable login!
    if (req.headers.platform === 'seller') {
      if (!req.user.isShop || !req.user.shopId) {
        return next(PopulateResponse.error({
          message: 'Shop is deactivated!'
        }));
      }
      // const allowShop = await DB.Shop.count({
      //   _id: req.user.shopId,
      //   activated: true
      // });
      // if (!allowShop) {
      //   return next(PopulateResponse.error({
      //     message: 'Shop is deactivated!'
      //   }));
      // }
    }

    return next();
  } catch (e) {
    return next(e);
  }
}

exports.core = () => {
  require('./local/passport').setup();
};

exports.router = (router) => {
  require('./routes')(router);
};

exports.middleware = {
  isAuthenticated,
  loadUser,
  checkPlatform,

  /**
   * Checks if the user role meets the minimum requirements of the route
   */
  hasRole(roleRequired) {
    if (!roleRequired) {
      throw new Error('Required role needs to be set');
    }

    return compose()
      .use(isAuthenticated)
      .use((req, res, next) => {
        const roles = nconf.get('roles');
        if (roles && roles.indexOf(req.user.role) >= roles.indexOf(roleRequired)) {
          return next();
        }

        return next(PopulateResponse.forbidden());
      });
  }
};
