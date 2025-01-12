import Course from "../models/Course.model ";
import Tags from "../models/Tags.model.js";
import User from "../models/User.model.js";
import uploadImageToCloudinary from "../utils/imageUploader.utils.js";

// create course handler function
const courseHandler = async (req, res) => {
  try {
    // fetch data
    const { courseName, courseDescription, whatWillYouLearn, price, tags } =
      req.body;
    //   get the thumbnail
    const thumbnail = req.files.thumbnailImage;

    // validation
    if (
      !courseName ||
      !courseDescription ||
      !whatWillYouLearn ||
      !price ||
      !tags ||
      !thumbnail
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required ",
      });
    }

    // check validations for instructor
    const userId = req.user.id;
    const instructorDetails = await User.findById(userId);
    if (!instructorDetails) {
      return res.status(401).json({
        success: false,
        message: "Instructor Details not found ",
      });
    }

    // check given tag is valid or not
    const tagDetails = await Tags.findById(tags);
    if (!tagDetails) {
      return res.status(400).json({
        success: false,
        message: "Invalid tag || tags not found ",
      });
    }

    // upload thumbnail image on cloudinary
    let thumbnailImage;
    try {
      thumbnailImage = await uploadImageToCloudinary(
        thumbnail,
        process.env.FOLDER_NAME
      );
    } catch (uploadError) {
      return res.status(500).json({
        success: false,
        message: "Error uploading thumbnail image",
        error: uploadError.message,
      });
    }

    //create a entry for new course
    const newCourse = await Course.create({
      courseName,
      courseDescription,
      price,
      whatWillYouLearn: whatWillYouLearn,
      instructor: instructorDetails._id,
      tags: tagDetails._id,
      thumbnail: thumbnailImage,
    });

    // add the new course to user schema of instructor
    await User.findByIdAndUpdate(
      { _id: instructorDetails._id },
      {
        $push: {
          courses: newCourse._id,
        },
      },
      { new: true }
    );

    // TODO: update the Tag Schema
    await Tags.findByIdAndUpdate(
      { _id: tagDetails._id },
      {
        $push: { course: newCourse._id },
      },
      { new: true }
    );

    // return response
    return res.status(200).json({
      success: true,
      message: "Course created successfully",
      data: newCourse,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while creating course ",
    });
  }
};

// getAllCourse handler function
const showAllCourse = async (req, res) => {
  try {
    const allCourses = await Course.find(
      {},
      {
        courseName: true,
        price: true,
        thumbnail: true,
        instructor: true,
        ratingAndReview: true,
        studentEnrolled: true, 
      }
    )
      .populate("instructor")
      .exec();

    return res.status(200).json({
      success: true,
      message: "Data for all courses fetched successfully",
      data: allCourses,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching all courses ",
      error: error.message,
    });
  }
};
