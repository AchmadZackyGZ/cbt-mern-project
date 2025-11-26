import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const useExamStore = create(
  persist(
    (set, get) => ({
      // State Awal
      quizData: null, // Info Kuis (Judul, Durasi)
      questions: [], // Array Soal
      answers: {}, // Objek Jawaban { "soalId": "A", "soalId2": "C" }
      submissionId: null, // ID sesi ujian dari backend
      endTime: null, // Waktu selesai (Timestamp)
      isExamActive: false, // Apakah sedang ujian?

      // Actions
      startExam: (data, questionsList, subId, end) =>
        set({
          quizData: data,
          questions: questionsList,
          submissionId: subId,
          endTime: end,
          isExamActive: true,
          answers: {}, // Reset jawaban saat mulai baru
        }),

      setAnswer: (questionId, answerKey) =>
        set((state) => ({
          answers: {
            ...state.answers,
            [questionId]: answerKey,
          },
        })),

      // Load jawaban yang sudah ada (untuk fitur Resume/Lanjut ujian)
      loadExistingAnswers: (existingAnswers) =>
        set({
          answers: existingAnswers || {},
        }),

      endExam: () =>
        set({
          quizData: null,
          questions: [],
          answers: {},
          submissionId: null,
          endTime: null,
          isExamActive: false,
        }),
    }),
    {
      name: "cbt-exam-storage", // Simpan di LocalStorage
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useExamStore;
