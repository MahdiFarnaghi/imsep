var nodemailer = require("nodemailer");

/**
 * GET /contact
 */
exports.contactGet = function (req, res) {
  var name = "";
  var email = "";
  if (req.user) {
    name = req.user.userName;
    if (req.user.firstName || req.user.lastName) {
      name += "(";
      if (req.user.firstName) name += req.user.firstName + " ";
      if (req.user.lastName) name += req.user.lastName;
      name += ")";
    }
    email = req.user.email;
  }
  res.render("contact", {
    title: "Contact",
    name: name,
    email: email,
    message: "",
  });
};

/**
 * POST /contact
 */
exports.contactPost = function (req, res) {
  req.assert("name", "Name cannot be blank").notEmpty();
  req.assert("email", "Email is not valid").isEmail();
  req.assert("email", "Email cannot be blank").notEmpty();
  req.assert("message", "Message cannot be blank").notEmpty();
  req.sanitize("email").normalizeEmail({ remove_dots: false });
  req.assert("captcha", "Captcha check failed").equals(req.session.captcha);

  var errors = req.validationErrors();

  if (errors) {
    req.flash("error", errors);
    res.render("contact", {
      title: "Contact",
      name: req.body.name,
      email: req.body.email,
      message: req.body.message,

      //,csrfToken: req.csrfToken()
    });
    return;
  }
  var transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SENDER_SERVICE,
    secure: false,
    auth: {
      user: process.env.EMAIL_SENDER_USERNAME,
      pass: process.env.EMAIL_SENDER_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false, //https://github.com/nodemailer/nodemailer/issues/406
    },
  });

  var mailOptions = {
    from: req.body.name + " " + "<" + req.body.email + ">",
    replyTo: req.body.email,
    to: process.env.CONTACT_TO_EMAIL,
    subject: "✔ Contact Form | " + process.env.SITE_NAME,
    text: req.body.message,
  };

  transporter.sendMail(mailOptions, function (err) {
    // in case of "Error: self signed certificate in certificate chain", disable antivirus
    if (err) {
      if (
        res &&
        res.locals &&
        res.locals.identity &&
        res.locals.identity.isAdministrator
      ) {
        //console.log(error);
        req.flash("error", {
          msg: "Error: " + err.message,
        });
      } else {
        //console.log(error);
        req.flash("error", {
          msg: "Failed to register the message.",
        });
      }
    } else {
      req.flash("notify", {
        type: "success",
        notify: true,
        delay: 3000,
        msg: "Thank you! Your feedback has been submitted.",
      });
    }

    //  console.log('a ='+a);
    res.redirect("/contact");
  });
};
