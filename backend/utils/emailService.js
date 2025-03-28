const nodemailer = require("nodemailer");

const sendEmail = async (recipients, subject, message) => {
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  let mailOptions = {
    from: process.env.EMAIL_USER,
    to: recipients.join(","),
    subject,
    text: message
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
