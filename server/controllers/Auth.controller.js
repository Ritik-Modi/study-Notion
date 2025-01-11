import User from "../models/User.model.js";
import Otp from "../models/Otp.model.js";
import otpGenerator from "otp-generator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import mailSender from "../utils/mailSender.utils.js";
dotenv.config();

// send Otp FIXME: make otp generator system batter
const sendOtp = async (req, res) => {
  try {
    //fetch email from request body
    const { email } = req.body;

    // check if user is already exist
    const checkUserPresent = await User.findOne({ email });

    //if user already exists then send response
    if (checkUserPresent) {
      return res
        .status(401)
        .json({ success: false, message: "User already exists" });
    }

    // generate Otp TODO: make the code batter
    let otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });
    console.log("Generated OTP: " + otp);

    // Ensure OTP is unique
    let result = await Otp.findOne({ otp: otp });
    let retries = 5; // Maximum retries to prevent infinite loop

    while (result && retries > 0) {
      otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false,
      });
      result = await Otp.findOne({ otp: otp });
      retries--;
    }

    if (retries === 0) {
      throw new Error(
        "Unable to generate a unique OTP after multiple attempts."
      );
    }

    const otpPayload = { email, otp };

    // create entry fro OTP
    const otpBody = await Otp.create(otpPayload);
    console.log(otpBody);

    // return response
    res.status(200).json({
      success: true,
      message: "Otp sent successfully",
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
// sign up
const signUP = async (req, res) => {
  try {
    // data fetch from request ki body
    const {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      accountType,
      contactNumber,
      otp,
    } = req.body();

    // do validation
    if (
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !confirmPassword ||
      !otp
    ) {
      return res.status(403).json({
        success: false,
        message: "all field are required !",
      });
    }
    // 2 match the password
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Password and confirm password should be same!",
      });
    }

    // check if the user already exists or not
    const userExist = await User.findOne({ email });
    if (userExist) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email!",
      });
    }
    // find most recent Otp stored in the database
    const recentOtp = await Otp.find({ email })
      .sort({ createdAt: -1 })
      .limit(1);
    console.log(recentOtp);

    // validate Otp
    if (recentOtp.length() == 0) {
      return res.status(401).json({
        success: false,
        message: "OTP NOT FOUND ",
      });
    } else if (otp !== recentOtp.otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP !!",
      });
    }
    // hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    // entry create in the database
    const profileDetails = await Profile.create({
      gender: null,
      dateOfBirth: null,
      about: null,
      contactNumber,
    });
    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      accountType,
      contactNumber,
      additionalDetails: profileDetails._id,
      image: `https://api.dicebear.com/9.x/initials/svg?seed=${firstName} ${lastName}`,
    });
    // return response

    return res.status(200).json({
      success: true,
      message: "User registered successfully",
      user,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      success: false,
      message: "user can not be registered , Try again!!",
    });
  }
};

// login
const login = async (req, res) => {
  try {
    // get data from body of request
    const { email, password } = req.body;

    // validate data
    if (!email || !password) {
      return res.status(403).json({
        success: false,
        message: "all field are required! try again",
      });
    }
    // check if the user exist or not
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          "User not found with this email! || user is not registered please Signup ",
      });
    }
    // generate the jwt token , after password matches
    if (await bcrypt.compare(password, user.password)) {
      const payload = {
        email: user.email,
        id: user._id,
        accountType: user.accountType,
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "2h",
      });
      user.token = token;
      user.password = undefined;
      // create cookie
      const options = {
        expiresIn: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        httpOnly: true,
      };
      res.cookie("token", token, options).status(200).json({
        success: true,
        user,
        token,
        message: "User logged in successfully",
      });
    } else {
      return res.status(401).json({
        success: false,
        message: "Invalid password! try again",
      });
    }
    //  return the response
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      success: false,
      message: "User can not be logged in, Try again!!",
    });
  }
};

// change password TODO: make the change password
const changePassword = async (req, res) => {
  try {
    //get data from req body
    const { oldPassword, newPassword, confirmPassword } = req.body;

    // check if the new password and confirm password are the same
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirm password should be same!",
      });
    }

    // check if the new password is valid
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password should be at least 8 characters long!",
      });
    }

    //get the user current password from db and check if it match the old password
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found!",
      });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid old password!",
      });
    }

    // hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    // send the mail notification about the password change
    const email = user.email;
    const title = "Password changed successfully";
    const body = "<p> your password has been changed successfully";

    const emailResult = await mailSender(email, title, body);
    if (!emailResult) {
      return res.status(500).json({
        success: false,
        message: "Failed to send email notification about password change",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to change password, try again !!",
    });
  }
};

export { sendOtp, signUP, login, changePassword };
