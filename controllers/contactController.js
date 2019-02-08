var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SENDER_SERVICE,
    secure: false,
    auth: {
        user: process.env.EMAIL_SENDER_USERNAME,
        pass: process.env.EMAIL_SENDER_PASSWORD
    },
    tls: {
        rejectUnauthorized: false //https://github.com/nodemailer/nodemailer/issues/406
    }
});

/**
 * GET /contact
 */
exports.contactGet = function(req, res) {
  res.render('contact', {
    title: 'Contact'
  });
};

/**
 * POST /contact
 */
exports.contactPost = function(req, res) {
  req.assert('name', 'Name cannot be blank').notEmpty();
  req.assert('email', 'Email is not valid').isEmail();
  req.assert('email', 'Email cannot be blank').notEmpty();
  req.assert('message', 'Message cannot be blank').notEmpty();
  req.sanitize('email').normalizeEmail({ remove_dots: false });

  var errors = req.validationErrors();

  if (errors) {
    req.flash('error', errors);
    return res.redirect('/contact');
  }

    var mailOptions = {
        from: req.body.name + ' ' + '<' + req.body.email + '>',
        to: process.env.CONTACT_TO_EMAIL,
        subject: '✔ Contact Form | ' + process.env.SITE_NAME,
        text: req.body.message
    };

    transporter.sendMail(mailOptions, function (err) {
      // in case of "Error: self signed certificate in certificate chain", disable antivirus
      req.flash('notify', {
        type:'success',
        notify:true,
        delay:3000, msg: 'Thank you! Your feedback has been submitted.' });
        var a = 12;

      //  console.log('a ='+a);
    res.redirect('/contact');
  });
};
