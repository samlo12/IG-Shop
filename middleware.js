module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        return res.json({ message: 'you must be signed in' });
    }
    next();
}