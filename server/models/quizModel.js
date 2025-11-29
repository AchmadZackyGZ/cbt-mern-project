import mongoose from "mongoose";
import crypto from "crypto";

const quizSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    durationInMinutes: {
      type: Number,
      required: true,
      default: 120,
    },
    examCode: {
      type: String,
      unique: true,
      required: false, // Will be auto-generated in pre-save hook
    },
    status: {
      type: String,
      enum: ["waiting", "active", "closed"], // waiting=Lobby, active=Sedang Ujian
      default: "waiting",
    },
  },
  {
    timestamps: true,
  }
);

// Generate 6-character hexadecimal exam code before saving
quizSchema.pre("save", async function (next) {
  // Only generate if examCode is not already set
  if (!this.examCode || this.examCode.trim() === "") {
    let isUnique = false;
    let code;

    // Generate unique 6-character hex code
    while (!isUnique) {
      code = crypto.randomBytes(3).toString("hex"); // 3 bytes = 6 hex characters
      const existingQuiz = await this.constructor.findOne({ examCode: code });
      if (!existingQuiz) {
        isUnique = true;
      }
    }

    this.examCode = code;
  }
  next();
});
const Quiz = mongoose.model("Quiz", quizSchema);

export default Quiz;
