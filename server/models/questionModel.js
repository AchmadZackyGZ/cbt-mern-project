import mongoose from "mongoose";

const optionSchema = new mongoose.Schema({
  id: { type: String, required: true }, // 'A', 'B', 'C', 'D', 'E'
  text: { type: String, required: true }, // Bisa berisi teks biasa atau sintaks LaTeX
});

const questionSchema = new mongoose.Schema(
  {
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
    },
    questionNumber: { type: Number, required: true },
    questionText: { type: String, required: true }, // Teks soal (bisa LaTeX)
    imageUrl: { type: String, default: null }, // URL gambar
    tableData: { type: String, default: null }, // String HTML tabel

    options: [optionSchema],

    correctAnswer: { type: String, required: true }, // 'C'
  },
  { timestamps: true }
);

const Question = mongoose.model("Question", questionSchema);
export default Question;
