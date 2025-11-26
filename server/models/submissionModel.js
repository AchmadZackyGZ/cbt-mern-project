import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema(
  {
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    startTime: { type: Date, required: true }, // Waktu server saat mulai
    endTime: { type: Date, required: true }, // Deadline (startTime + duration)

    // Jawaban: Map { "questionId": "jawabanId" }
    answers: {
      type: Map,
      of: String,
      default: {},
    },

    status: {
      type: String,
      enum: ["pending", "completed"], // 'pending' = sedang dikerjakan
      default: "pending",
    },

    submittedAt: { type: Date }, // Waktu user klik 'selesai'

    // Hasil
    score: { type: Number, default: 0 },
    duration: { type: Number, default: 0 }, // Total waktu pengerjaan (ms)

    violationCount: { type: Number, default: 0 }, // Untuk fitur "pindah tab"
  },
  { timestamps: true }
);

const Submission = mongoose.model("Submission", submissionSchema);
export default Submission;
