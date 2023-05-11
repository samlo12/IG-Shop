if (!process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const express = require('express');
const app = express();

const { storage, cloudinary } = require('./cloudinary')
const multer = require('multer')
const upload = multer({ storage })

const mongoose = require('mongoose');
const Product = require('./models/product')
const User = require('./models/user');
const catchAsync = require('./utils/catchAsync')

const passport = require('passport');
const LocalStrategy = require('passport-local')
const session = require('express-session');

const { isLoggedIn } = require('./middleware')

const MongoStore = require('connect-mongo');
const dbUrl = process.env.DB_URL;
//'mongodb://127.0.0.1:27017/IGshop'
mongoose.connect(dbUrl)
    .then(() => {
        console.log("MONGO CONNECTION OPEN!!!");
    })
    .catch((err) => {
        console.log("OH NO MONGO CONNECTION ERROR!");
        console.log(err);
    })


const path = require('path')

const PORT = process.env.PORT || 5000

app.use(express.static(path.join(__dirname + "/public")))
app.use(express.json());


const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: {
        secret: 'thisshouldbeabettersecret!'
    },
    touchAfter: 24 * 60 * 60
});

store.on('error', function (e) {
    console.log('SESSION STORE ERROR', e)
})
//using session
const sessionConfig = {
    store,
    name: 'session',
    secret: 'thisshouldbeabettersecret',
    resave: false,
    saveUninitialized: true,
    //store: xxx //the store for now we don't need to specify.Eventually we're going to make the store a mongo store.
    cookie: {
        httpOnly: true,
        // secure: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
};

app.use(session(sessionConfig));


app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()))

passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser());


app.get('/api/hi', (req, res) => {
    res.send({ hi: "100" })
})

app.get('/api/products', catchAsync(async (req, res) => {
    const products = await Product.find();
    res.json(products);
}))

app.get('/api/products/:id', catchAsync(async (req, res) => {
    const product = await Product.findById(req.params.id);
    res.json(product);
}))

app.post('/api/products/new', isLoggedIn, upload.array('images'), catchAsync(async (req, res) => {
    const { name, price, category, description, images } = req.body;
    const product = new Product({
        name,
        price: parseInt(price),
        category,
        description,
        images,
        createTime: Date.now()
    })
    product.images = req.files.map(f => ({ url: f.path, filename: f.filename }))
    await product.save()
    res.json({ product });
}))

app.post('/api/adminlogin', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.status(401).json({ message: "Login failed" });
        }
        req.logIn(user, (err) => {
            if (err) {
                return next(err);
            }
            res.json({ message: "Login successful" });
        });
    })(req, res, next);
});

app.get('/api/adminLogout', catchAsync(async (req, res, next) => {
    req.logout(function (err) {
        if (err) {
            return next(err);
        }
        res.json({ message: "Logout successful" });
    });
}));

app.get('/api/isLoggedIn', isLoggedIn, (req, res) => {
    res.json({ isLoggedIn: true })
})

// app.post('/api/products/new', isLoggedIn, upload.array('images'), catchAsync(async (req, res) => {
//     const { name, price, category, description, images } = req.body;
//     const product = new Product({
//         name,
//         price: parseInt(price),
//         category,
//         description,
//         images,
//         createTime: Date.now()
//     })
//     product.images = req.files.map(f => ({ url: f.path, filename: f.filename }))
//     await product.save()
//     res.json({ product });
// }))

app.put('/api/product/:id/edit', isLoggedIn, upload.array('images'), catchAsync(async (req, res) => {
    const { id } = req.params;
    const { name, price, category, description, deleteFiles } = req.body;
    console.log(req.body)
    const product = await Product.findByIdAndUpdate(id, { ...req.body })

    const imgs = req.files.map(f => ({ url: f.path, filename: f.filename }));
    product.images.push(...imgs);
    await product.save();

    if (req.body.deleteFiles) {

        for (let filename of req.body.deleteFiles) {
            await cloudinary.uploader.destroy(filename);
        }
        await product.updateOne({ $pull: { images: { filename: { $in: req.body.deleteFiles } } } });
    }
    res.json({ message: "updated" });
}))

app.delete('/api/product/:id', isLoggedIn, catchAsync(async (req, res) => {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "deleted" });
}))



app.use('*', express.static(path.join(__dirname + "/public")));


app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Something Went Wrong'
    console.log(err.message)
    res.status(statusCode).send({ error: { err } })
})

app.listen(PORT, () => {
    console.log(`listening on port ${PORT}`)
})

