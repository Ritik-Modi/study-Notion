import nodemailer from "nodemailer";

const mailSender = async (email, title, body) => {
  try {
    let transporter = nodemailer.transport({
      host: process.env.MAIN_HOST,
      auth: {
        user: process.env.MAIN_USER,
        pass: process.env.MAIN_PASS,
      },
    });

    let info = await transporter.sendMail({
      from: "StudyNotion",
      to: `${email}`,
      subject: `${title}`,
      html: `${body}`,
    });

    console.log(info);
    return info;
  } catch (error) {
    console.log(error.message);
  }
};

export default mailSender;
