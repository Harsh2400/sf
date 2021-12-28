var express = require('express')
var app = express()

var bodyParser = require('body-parser');
var mongoose = require('mongoose')


const dotenv = require('dotenv')
const jwt = require('jsonwebtoken')
//config
dotenv.config({ path: './config.env' })
const authenticate = require('./middleware/authenticate')
const cookieParser = require('cookie-parser')
app.use(cookieParser())

const emailExistence = require('email-existence')

var fs = require('fs');
var path = require('path');
const bcrypt = require('bcryptjs')

mongoose.connect("mongodb://localhost:27017/Room_Share", { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("Connection Successfull...."))
    .catch((err) => console.log(err));

// Step 4 - set up EJS

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.set("view engine", "ejs");
const static_path = path.join(__dirname, "./public");
app.use(express.static(static_path));

// Step 5 - set up multer for storing uploaded files

var multer = require('multer');

var storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads')
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now())
    }
});

var upload = multer({ storage: storage });

var imgModel = require('./models/model');
var Resgister = require('./models/register');

const { Script } = require('vm');
//const register = require('./models/register');

//Setting Entry point i.e login & register
app.get('/', (req, res) => {
    res.render('home');
})

//About section
app.get('/about', authenticate, (req, res) => {
    console.log("in app.js", req.rootUser.userid)
    console.log("in app.js", req.rootUser._id)
    res.render('about');
})

app.get('/home', (req, res) => {
    res.render('home');
})

/* User profile */

app.get('/profile', authenticate, (req, res) => {
    adid = req.rootUser._id
    const name = req.rootUser.userid
    const email = req.rootUser.email
    const phone = req.rootUser.phone
    try {
        imgModel.find({ $or: [{ adid: { '$regex': req.rootUser._id } }] }, (err, items) => {
            if (err) {
                console.log(err);
            } else {
                res.render('profile', { items: items, name: name, email: email, phone: phone });
            }
        })
    } catch (error) {
        console.log(error);
    }

})

/* delete ad */
app.get('/delete', (req, res) => {
    const btn = req.query.id;
    console.log(btn)
    imgModel.deleteOne({ _id: btn }, (err) => {
        if (err) {
            console.log(err);
            res.status(500).send('An error occurred', err);

        }
        console.log("Deleted")
        res.redirect('profile')


    });
});

/* edit ad details */
app.get('/profile_edit', (req, res) => {
    const btn = req.query.id;
    console.log(btn)
    imgModel.find({ _id: btn }, (err, items) => {
        if (err) {
            console.log(err);
            res.status(500).send('An error occurred', err);
        } else {
            /* if (check == true) */
            {
                res.render('profile_edit', { items: items });
            }
        }
    });
});

/* update ad */
app.post('/update', (req, res) => {
    const btn = req.body.adid;
    /* console.log("id = ", btn) */
    var newvalues = { $set: { ttl_accom: req.body.ttl_accom, vcnt_accom: req.body.vcnt_accom, price: req.body.price } };

    imgModel.updateOne({ _id: btn }, newvalues, (err) => {
        if (err) {
            console.log(err);
            res.status(500).send('An error occurred', err);

        }
        console.log("Updated")
        res.redirect('profile')


    });
});

app.get('/adpost', authenticate, (req, res) => {

    paid = req.rootUser.premium
    console.log(paid)
    if (paid == 'false') {
        res.render('pay')
    }
    else {
        res.render('adpost')
    }
});

//connect
app.get('/connect', authenticate, (req, res) => {

    paid = req.rootUser.premium
    if (paid == 'false') {
        res.render('pay')
    }
    else {
        const btn = req.query.id;
        console.log(btn)
        imgModel.find({ _id: btn }, (err, items) => {
            if (err) {
                console.log(err);
                res.status(500).send('An error occurred', err);
            } else {
                /* if (check == true) */
                {
                    res.render('connect', { items: items });
                }
            }
        });
    }




})


app.get('/adsearch', (req, res) => {
    imgModel.find({}, (err, items) => {
        if (err) {
            console.log(err);
            res.status(500).send('An error occurred', err);
        } else {
            /* if (check == true) */
            {
                res.render('adsearch', { items: items });
            }
        }
    });
});

//search
app.get('/search', (req, res) => {
    try {
        imgModel.find({ $or: [{ state: { '$regex': req.query.dsearch } }, { district: { '$regex': req.query.dsearch } }] }, (err, items) => {
            if (err) {
                console.log(err);
            } else {
                res.render('adsearch', { items: items });
            }
        })
    } catch (error) {
        console.log(error);
    }
});
//state tile
app.get('/ad_section', (req, res) => {
    try {
        imgModel.find({}, (err, items) => {
            if (err) {
                console.log(err);
            } else {
                res.render('ad_section', { items: items });
            }
        })
    } catch (error) {
        console.log(error);
    }
});

//testbutton
app.get('/ad_desc', (req, res) => {
    const btn = req.query.id;
    console.log(btn)
    imgModel.find({ _id: btn }, (err, items) => {
        if (err) {
            console.log(err);
            res.status(500).send('An error occurred', err);
        } else {
            /* if (check == true) */
            {
                res.render('ad_desc', { items: items });
            }
        }
    });
});


//login page

app.get('/login', (req, res) => {
    res.render('login', { noemail: true }); //updated
})

//logout    
app.get('/logout', (req, res) => {
    res.cookie('jwtoken', { expires: Date.now() });
    res.render('login', { noemail: true });
})

// Step 8 - the POST handler for processing the uploaded file

app.post('/', upload.single('image'), authenticate, (req, res, next) => {
    console.log("uploading post", req.rootUser.userid)

    var wifi = req.body.wifi
    if (wifi != "Wifi") {
        wifi = "No"
    }

    var parking = req.body.parking
    if (parking != "Parking") {
        parking = "No"
    }


    var ac = req.body.ac
    if (ac != "AC") {
        ac = "No"
    }

    var balcony = req.body.balcony
    if (balcony != "Balcony") {
        balcony = "No"
    }

    var metro = req.body.metro
    if (metro != "Metro") {
        metro = "No"
    }


    var obj = {
        adid: req.rootUser._id,
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        gender: req.body.gender,
        phone: req.body.phone,
        state: req.body.state,
        city: req.body.city,
        district: req.body.district,
        pincode: req.body.pincode,
        address: req.body.address,
        landmark: req.body.landmark,
        wifi: wifi,
        parking: parking,
        ac: ac,
        balcony: balcony,
        metro: metro,
        ms_name: req.body.ms_name,
        kitchen: req.body.kitchen,
        washroom: req.body.washroom,
        ttl_accom: req.body.ttl_accom,
        vcnt_accom: req.body.vcnt_accom,
        price: req.body.price,
        img: {
            data: fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename)),
            contentType: 'image/png'
        },
        desc: req.body.desc

    }
    console.log(obj)
    imgModel.create(obj, (err, item) => {
        if (err) {
            console.log(err);
        } else {
            // item.save();
            res.redirect('ad_section');
        }
    });
});

//register $ login

app.post("/register", async (req, res) => {
    try {
        var testemail
        const password = req.body.password;
        const cpassword = req.body.confirmpassword;
        const email = req.body.email; //updated
        emailExistence.check(email, function (err, resp) {
            console.log('resp: ' + resp);
            if (resp === false) {
                testemail = false
                console.log("verifying Email")

            } else {
                testemail = true
            }
        });

        await new Promise((resolve) => {
            setTimeout(() => {
                // Resolve the promise
                resolve(
                    console.log("Verification done..."));
            }, 3000);
        });


        if (password === cpassword) {

            if (testemail === false) {
                console.log("Email doesnt exists")
                res.render('login', { noemail: testemail })
            }

            if (testemail === true) {
                console.log("Email Exists")
                Resgister.findOne({ email: email }).then((userExists) => {
                    if (userExists) {
                        console.log("user exists")
                        //return res.status(422).json({ error: "Email already exists in db" })
                        return res.status(422).render("login", { noemail: "emailavl" });
                    }
                    else {
                        const registerUser = new Resgister({
                            userid: req.body.userid,
                            email: req.body.email,
                            phone: req.body.phone,
                            password: password,
                            confirmpassword: cpassword,
                            premium: false
                        })
                        registerUser.save();
                        console.log("Data saved")
                        res.status(201).render("login", { noemail: "success" });
                    }

                })
            }
        } else {
            //res.send("password are not matching")
            res.status(422).render("login", { noemail: "mismatch" });
        }

    } catch (error) {
        res.status(400).send(error);
    }

})
//login check
app.post("/login", async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;

        const useremail = await Resgister.findOne({ email: email });
        console.log(useremail);

        if (useremail) {
            const isMatch = await bcrypt.compare(password, useremail.password);

            //jwt
            const token = await useremail.generateAuthToken();
            console.log(token);

            res.cookie("jwtoken", token, {
                expires: new Date(Date.now() + 2629800000),
                /* httpOnly: true */

            })

            if (!isMatch) {
                console.log("password failure")
                console.log(isMatch)
                //res.status(400).json({ Error: "Login failed Invalid credentials" })
                res.status(400).render("login", { noemail: "invalid" });
            } else {
                res.redirect('/ad_section');
                //res.json({ message: "User Signed in successfully" })
                //res.render('home')
            }

        }


    } catch (error) {
        res.status(400).send("invalid email")
    }


})



var port = process.env.PORT || '3000'
app.listen(port, err => {
    if (err)
        throw err
    console.log('Server listening on port', port)
})