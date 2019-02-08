var svgCaptcha = require('svg-captcha-smooth');

exports.index = function (req, res) {
    var captcha = svgCaptcha.create({
        size: 4,
        noise: 3,
        background: '#cc9966',
        color: true,
        height: 36,
        fontSize: 18

    });
    req.session.captcha = captcha.text;

    res.set('Content-Type', 'image/svg+xml');
    res.status(200).send(captcha.data);
};
