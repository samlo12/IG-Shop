const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose')

const userSchema = new Schema({

})//we are not going to specify username & passowrd becasue of the next

userSchema.plugin(passportLocalMongoose);


module.exports = new mongoose.model('User', userSchema);
