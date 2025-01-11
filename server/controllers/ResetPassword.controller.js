import User from "../models/User.model.js";
import mailSender from "../utils/mailSender.utils.js";
import bcrypt, { hash } from "bcrypt";

// resetPasswordToken  - send the email to reset the password with the resetPassword UI link
const resetPasswordToken = async (req, res) => {
  try {
    // get email form the req body
    const email = req.body.email;

    // check user for this email || email validation
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    // generate token
    const token = crypto.randomUUID();

    // update user by adding the token and expiration time
    const updatedDetails = await User.findOneAndUpdate(
      { email: email },
      {
        token: token,
        resetPasswordExpired: Date.now() + 5 * 60 * 1000,
      },
      { new: true }
    );
    // create Url
    const url = `https://localhost:3000/update-password/${token}`;
    // send email to user with the url
    const resetEmailResult = await mailSender(
      email,
      "Reset Password",
      `Reset Password Link : ${url}`
    );
    if (!resetEmailResult) {
      return res.status(404).json({
        success: false,
        message: "Failed to send email to reset password",
      });
    }

    // return response
    return res.status(200).json({
      success: true,
      message: "Reset password token sent successfully",
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to send reset password token, try again!!",
    });
  }
};

// resetPassword  - update in DB

const resetPassword = async (req, res) => {
  try {
    // fetch data
    const { password, confirmPassword, token } = req.body;

    // validation
    if (password !== confirmPassword) {
      return res.json({
        success: false,
        message: "Password and confirm password do not match",
      });
    }
    // get user details from db using token
    const userDetails = await User.findOne({ token: token });

    // if no entry - invalid token
    if (!userDetails) {
      return res.status(400).json({
        success: false,
        message: "Invalid token",
      });
    }
    // check token time
    if (userDetails.resetPasswordExpire < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "Token has expired || please regenerate token",
      });
    }
    // hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    // update the password in db

    await User.findOneAndUpdate(
      { token: token },
      {
        password: hashedPassword,
      },
      { new: true }
    );
    // return the response
    return res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to reset password, try again!!",
    });
  }
};

export { resetPassword, resetPasswordToken };
