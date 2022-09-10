const bigPromise = require('../middlewares/bigPromise');

exports.home = bigPromise((req, res) =>{
    res.status(200).json({
        success: true,
        greeting: "Hello from API"
    })
});

exports.homeDummy = (req, res) =>{
    res.status(200).json({
        success: true,
        greeting: "This is another dummy"
    })
}