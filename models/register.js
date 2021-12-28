const mongoose = require("mongoose");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken')

const regSchema = new mongoose.Schema({
    userid: {
        type: String,
        require: true
    },
    email: {
        type: String,
        required: true,
        //unique: true
    },
    phone: {
        type: Number,
        require: true,
        //unique: true
    },
    password: {
        type: String,
        required: true
    },
    confirmpassword: {
        type: String,
        required: true
    },
    premium:{
        type:String,
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }]
})

//hashing
regSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        console.log(this.password)
        this.password = await bcrypt.hash(this.password, 12);
        console.log(this.password)
        this.confirmpassword = await bcrypt.hash(this.confirmpassword, 12);
        console.log(this.confirmpassword)
        console.log("Hashed")
    }

})


//generating token
regSchema.methods.generateAuthToken = async function() {
    try {
        let token = jwt.sign({ _id: this._id }, process.env.SECRET_KEY);

        this.tokens = this.tokens.concat({ token: token });
        await this.save();
        return token;
    } catch (err) {
        console.log(err);
    }
}

// collection
module.exports = new mongoose.model('Register', regSchema);
//const Register = new mongoose.model("Register", regSchema)

//module.exports = Register;