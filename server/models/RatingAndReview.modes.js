import mongoose from "mongoose";

const ratingAndReview = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  rating: {
    type: Number,
    required: true,
  },
  review: {
    type: String,
    trim: true,
    required: true,
  },
});

export default mongoose.model("RatingAndReview", ratingAndReview);
