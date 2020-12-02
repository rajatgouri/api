const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
var TokenStrategy = require('passport-accesstoken').Strategy;
var CustomStrategy = require('passport-custom').Strategy;

exports.setup = () => {
  passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password' // this is the virtual field on the model
  }, async (email, password, done) => {
    try {
      let user;
      
      const re = new RegExp("[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])+")

      if(re.test(email)){
          user = await DB.User.findOne({ email: email.toLowerCase(), isActive: true });
      } else {
          user = await DB.User.findOne({ phoneNumber: email, isActive: true });
      }
      // user = await DB.User.findOne({ email: email.toLowerCase(), isActive: true });

      if (!user) {
        return done(null, false, PopulateResponse.error({
          message: 'This email is not registered.'
        }, 'ERR_USER_NOT_FOUND', 400, 400));
      }

      return user.authenticate(password, (authError, authenticated) => {
        if (authError) {
          return done(authError);
        }
        if (!authenticated) {
          return done(null, false, PopulateResponse.error({
            message: 'Password is incorrect.'
          }, 'ERR_PASSWORD_IS_INCORRECT', 400, 400));
        } else if (!user.emailVerified) {
          return done(null, false, PopulateResponse.error({
            message: 'Please verify your email address'
          }, 'ERR_EMAIL_NOT_VERIFIED'));
        }

        console.log(user);
        return done(null, user);
      });
    } catch (e) {
      return done(e);
    }
  }));


  //This is for access token login
  var strategyOptions = {
    usernameField: 'email',
    tokenField: 'token'
  };

  passport.use(new TokenStrategy(strategyOptions, 
    async (token, done, email) => {
        console.log(token);
        try{

            const user = DB.User.findOne({email: email.toLowerCase(), autoLoginToken: token , isActive: true}, function (err, user) {
            if (err) {
                return done(authError);
            }

            if (!user) {
              return done(null, false, PopulateResponse.error({
                message: 'This User is not registered.'
              }, 'ERR_USER_NOT_FOUND', 400, 400));
            }

            /*if (!user.verifyToken(token)) {
                return done(null, false);
            }*/

            return done(null, user);
          });

        } catch (e) {
          return done(e);
        }
        
    }
  ));


  //THis is for custome strategy
  passport.use(new CustomStrategy(
    function(req, done) {
        try{
            const user = DB.User.findOne({email: req.body.email.toLowerCase(), autoLoginToken: req.body.token , isActive: true}, function (err, user) {
            if (err) {
                return done(authError);
            }

            if (!user) {
              return done(null, false, PopulateResponse.error({
                message: 'This User is not registered.'
              }, 'ERR_USER_NOT_FOUND', 400, 400));
            }

            if(user){
              const update = {
                autoLoginToken: '',
              };
              
              DB.User.update({
                _id: user._id
              }, {
                $set: update
              });
            }

            /*if (!user.verifyToken(token)) {
                return done(null, false);
            }*/

            return done(null, user);
          });

      } catch (e) {
        return done(e);
      }
    }
  ));
  

};
