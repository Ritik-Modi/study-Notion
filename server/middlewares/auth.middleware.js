import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/User.model";

dotenv.config();

// auth
const auth = async (req, res, next) => {
  try {
    // extract Token
    const token =
      req.cookies.token ||
      req.body.token ||
      req.header("Authorization").replace("Bearer ", "");

    //if token is missing, return response
    if (!token) {
      return res.status(401).json({
        success: false,
        massage: "token is missing",
      });
    }

    //verify token
    try {
      const decode = jwt.verify(token, process.env.JWT_SECRET);
      console.log(decode);
      req.User = decode;
    } catch (err) {
      console.log(err.message);
      return res.status(401).json({
        success: false,
        massage: "Token is invalid",
      });
    }

    next();
  } catch (error) {
    console.log(error.message);
    return res.status(401).json({
      success: false,
      massage: "Something went wrong while validating the token",
    });
  }
};
// isStudent
const isStudent = async (req, res, next) => {
  try {
    if (req.User.accountType !== "Student") {
      return res.status(403).json({
        success: false,
        massage: "this is protected rout for the student ",
      });
    }
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      massage: "Something went wrong while validating the student role",
    });
  }
};

// isInstructor

const isInstructor = async (req, res, next) => {
  try {
    if (req.User.accountType !== "Instructor") {
      return res.status(403).json({
        success: false,
        massage: "this is protected rout for the instructor ",
      });
    }
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      massage: "Something went wrong while validating the instructor role",
    });
  }
};

// isAdmin

const isAdmin = async (req, res, next) => {
  try {
    if (req.User.accountType !== "Admin") {
      return res.status(403).json({
        success: false,
        massage: "this is protected rout for the Admin ",
      });
    }
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      massage: "Something went wrong while validating the Admin role",
    });
  }
};

export { auth, isStudent, isInstructor, isAdmin };
