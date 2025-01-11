import mongoose from "mongoose";
import mailSender from "../utils/mailSender.utils.js";

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
    unique: true,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
    expires: 300, // 5 min
  },
});

// a function to send the mail

async function sendVerificationMail(email, otp) {
  try {
    const mailResponse = await mailSender(
      email,
      "verification email for study notion ",
      otp
    );
    console.log("email send successfully" + mailResponse);
  } catch (error) {
    console.log("error sending verification email" + error);
    throw error;
  }
}

otpSchema.pre("save", async function (next) {
  await sendVerificationMail(this.email, this.otp);
  next();
});

export default mongoose.model("Otp", otpSchema);
