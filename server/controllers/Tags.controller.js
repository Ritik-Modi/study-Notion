import Tags from "../models/Tags.model";

// create tag handler function

const createTag = async (req, res) => {
  try {
    // fetch data from request body
    const { name, description } = req.body;
    // validation
    if (!name || !description) {
      return res.status(400).json({
        success: false,
        message: "all field are required!",
      });
    }

    //create entry in db
    const tagDetails = await Tags.create({
      name: name,
      description: description,
    });
    console.log(tagDetails);
    // return response
    res.status(200).json({
      success: true,
      message: "Tag created successfully",
      data: tagDetails,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      success: false,
      message: "Server error while creating a tag",
    });
  }
};

// get all tags handler function
const getAllTags = async (req, res) => {
  try {
    const allTags = await Tags.find({}, { name: true, description: true });
    return res.status(200).json({
      success: true,
      message: "All tags fetched successfully",
      data: allTags,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
export { createTag, getAllTags };
