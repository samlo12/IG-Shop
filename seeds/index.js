if (!process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const mongoose = require('mongoose');
const Product = require('../models/product')
const seedproducts = require('./productData')

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

const seedDB = async () => {
    await Product.deleteMany({});
    for (let i = 0; i < seedproducts.length; i++) {
        const product = new Product({
            name: seedproducts[i].name,
            price: seedproducts[i].price,
            images: [
                {
                    url: "https://res.cloudinary.com/dduyoouuq/image/upload/v1683645296/IGshop/bc9brgip8zej1bw5vb6l.jpg",
                    filename: "IGshop/bc9brgip8zej1bw5vb6l"
                }
            ],
            category: seedproducts[i].category,
            description: "FREE SIZE (CM)膊闊37 胸闊41 腰32 HIP 50 裙長82(不同量度方法存在1 - 3CM誤差)FABRIC: 100 % NYLONCOUNTRY OF ORIGIN: KOREA",
            createTime: Date.now()
        })
        await product.save()
    }
}
seedDB().then(() => {
    mongoose.connection.close();
})