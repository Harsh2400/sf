const jwt = require('jsonwebtoken');
//const register = require('../models/register');
//var Resgister = require('./models/register');
const Register = require('../models/register');

const Authenticate = async(req, res, next) => {
    try {

        const token = req.cookies.jwtoken;
        console.log("cookie token = ", token)
        const verifyToken = jwt.verify(token, process.env.SECRET_KEY)
        console.log("verified token ", verifyToken)

        const rootUser = await Register.findOne({ _id: verifyToken._id, "tokens.token": token })
        console.log("Root user = ", rootUser)
        if (!rootUser) {
            throw new Error('User not found')
        }
        console.log("user found")
        req.token = token;
        req.rootUser = rootUser;

        console.log(rootUser.userid)
        console.log("Jwt verified")

        next();

    } catch (error) {
        console.log(error)
        res.redirect('/login')
            //res.status(401).send('Unautharized Acces')
            //console.log(error)

    }
}

module.exports = Authenticate