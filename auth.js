const jwtSecret = 'your_jwt_secret'; // must be same key used in JWTStrategy
const jwt = require('jsonwebtoken'),
  passport = require('passport');
require('./passport'); // Local passport file

let generateJWTToken = (user) => {
  return jwt.sign(user, jwtSecret, {
    subject: user.Username, // JWT encoded username
    expiresIn: '7d', // expires 7d
    algorithm: 'HS256' // 256 bit encryption
  });
};

//POST login endpoint | create jwt token
module.exports = (router) => {
  router.use(passport.initialize());
  router.post('/login', (req, res) => {
    passport.authenticate('local', { session: false }, (error, user, info) => {
      if (error || !user){ 
        return res.status(400).json({
          message: info.message , 
          user: user
        });
      }
      req.login(user, { session: false }, (error) => {
        if (error) {
          res.send(error);
        }
        let token = generateJWTToken(user.toJSON());
        return res.json({ user, token });
      });
    })(req, res);
  });
};