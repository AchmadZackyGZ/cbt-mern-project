import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { BlockMath, InlineMath } from "react-katex"; // Import keduanya
import api from "../../api/axios";

const AdminQuestions = () => {
  const { quizId } = useParams();
  const [questions, setQuestions] = useState([]);

  // State Form
  const [formData, setFormData] = useState({
    questionNumber: 1,
    questionText: "",
    imageUrl: "",
    options: [
      { id: "A", text: "" },
      { id: "B", text: "" },
      { id: "C", text: "" },
      { id: "D", text: "" },
      { id: "E", text: "" },
    ],
    correctAnswer: "A",
  });

  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const { data } = await api.get(`/questions/${quizId}`);
        setQuestions(data);
        setFormData((prev) => ({ ...prev, questionNumber: data.length + 1 }));
      } catch (error) {
        console.error("Gagal ambil soal:", error);
      }
    };

    if (quizId) {
      fetchQuestions();
    }
  }, [quizId]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formDataUpload = new FormData();
    formDataUpload.append("image", file);

    setUploading(true);
    try {
      const { data } = await api.post("/upload", formDataUpload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setFormData((prev) => ({ ...prev, imageUrl: data.imageUrl }));
      alert("Gambar berhasil diupload!");
    } catch (error) {
      console.error(error);
      alert("Gagal upload gambar");
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...formData.options];
    newOptions[index].text = value;
    setFormData({ ...formData, options: newOptions });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/questions", {
        quizId,
        ...formData,
      });
      alert("Soal berhasil ditambahkan!");

      setFormData({
        questionNumber: questions.length + 2,
        questionText: "",
        imageUrl: "",
        options: [
          { id: "A", text: "" },
          { id: "B", text: "" },
          { id: "C", text: "" },
          { id: "D", text: "" },
          { id: "E", text: "" },
        ],
        correctAnswer: "A",
      });

      const { data } = await api.get(`/questions/${quizId}`);
      setQuestions(data);
    } catch (error) {
      console.error(error);
      alert("Gagal menyimpan soal");
    }
  };

  // --- FUNGSI PARSER UTAMA (SOLUSI ANDA) ---
  // Fungsi ini membaca teks, mencari $$ dan $, lalu merendernya jadi Matematika Cantik
  const renderQuestionContent = (text) => {
    if (!text) return null;

    // 1. Pecah dulu berdasarkan Block Math ($$)
    const blockParts = text.split("$$");

    return blockParts.map((part, index) => {
      // Jika index ganjil, itu adalah Block Math (di dalam $$...$$)
      if (index % 2 === 1) {
        return <BlockMath key={index}>{part}</BlockMath>;
      }

      // Jika index genap, itu teks biasa campur Inline Math ($...$)
      // Kita perlu pecah lagi berdasarkan $
      return (
        <span key={index}>
          {part.split("$").map((subPart, subIndex) => {
            // Jika index ganjil, itu Inline Math (di dalam $...$)
            if (subIndex % 2 === 1) {
              return (
                <InlineMath key={`${index}-${subIndex}`}>{subPart}</InlineMath>
              );
            }
            // Teks Biasa
            return <span key={`${index}-${subIndex}`}>{subPart}</span>;
          })}
        </span>
      );
    });
  };

  // Fungsi helper untuk opsi jawaban (Inline saja)
  const renderInlineMath = (text) => {
    if (!text) return "";
    if (!text.includes("$")) return text;
    return text.split("$").map((part, index) => {
      if (index % 2 === 1) return <InlineMath key={index}>{part}</InlineMath>;
      return <span key={index}>{part}</span>;
    });
  };

  // Helper untuk preview di form input (hanya ambil isi math)
  const getLatexContent = (text) => {
    const match = text.match(/\$\$(.*?)\$\$/);
    return match ? match[1] : null;
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Manajemen Soal</h1>
          <Link to="/admin/quizzes" className="text-indigo-600 hover:underline">
            ← Kembali ke Daftar Kuis
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* KIRI: Form Input Soal */}
          <div className="bg-white p-6 rounded-lg shadow-md h-fit">
            <h2 className="text-lg font-semibold mb-4">Tambah Soal Baru</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nomor Soal
                </label>
                <input
                  type="number"
                  name="questionNumber"
                  value={formData.questionNumber}
                  onChange={handleChange}
                  className="mt-1 block w-20 px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Pertanyaan (Bisa LaTeX)
                </label>
                <p className="text-xs text-gray-500 mb-1">
                  Gunakan <code>{"$$...$$"}</code> untuk rumus blok, dan{" "}
                  <code>{"$...$"}</code> untuk rumus sebaris.
                </p>
                <textarea
                  name="questionText"
                  rows="5"
                  required
                  value={formData.questionText}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Contoh: Hasil dari $$\int 2x dx$$ adalah..."
                />

                {/* Preview Form */}
                {formData.questionText.includes("$$") && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded text-center">
                    <p className="text-xs text-blue-600 mb-1 font-bold">
                      Preview Blok:
                    </p>
                    <BlockMath>
                      {getLatexContent(formData.questionText) || ""}
                    </BlockMath>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Gambar Soal (Opsional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                {uploading && (
                  <p className="text-sm text-blue-500 mt-1">Mengupload...</p>
                )}
                {formData.imageUrl && (
                  <img
                    src={formData.imageUrl}
                    alt="Preview"
                    className="mt-2 h-32 object-contain border rounded"
                  />
                )}
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Pilihan Jawaban (Gunakan <code>$..$</code> untuk matematika)
                </label>
                {formData.options.map((opt, idx) => (
                  <div
                    key={opt.id}
                    className="grid grid-cols-12 gap-2 items-center"
                  >
                    <span className="col-span-1 font-bold text-center">
                      {opt.id}.
                    </span>
                    <div className="col-span-11">
                      <input
                        type="text"
                        required
                        value={opt.text}
                        onChange={(e) =>
                          handleOptionChange(idx, e.target.value)
                        }
                        className="block w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                        placeholder={`Jawaban ${opt.id}`}
                      />
                      {opt.text.includes("$") && (
                        <div className="text-xs text-blue-600 mt-1 bg-blue-50 px-2 py-1 rounded inline-block">
                          Preview: {renderInlineMath(opt.text)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Kunci Jawaban Benar
                </label>
                <select
                  name="correctAnswer"
                  value={formData.correctAnswer}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  {["A", "B", "C", "D", "E"].map((opt) => (
                    <option key={opt} value={opt}>
                      Pilihan {opt}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 font-medium"
              >
                Simpan Soal
              </button>
            </form>
          </div>

          {/* KANAN: Daftar Soal */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Daftar Soal ({questions.length})
            </h2>

            {questions.length === 0 ? (
              <p className="text-gray-500 bg-white p-4 rounded shadow">
                Belum ada soal di kuis ini.
              </p>
            ) : (
              questions.map((q) => (
                <div
                  key={q._id}
                  className="bg-white p-4 rounded-lg shadow border border-gray-200"
                >
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-lg text-indigo-600">
                      No. {q.questionNumber}
                    </span>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      Kunci: {q.correctAnswer}
                    </span>
                  </div>

                  {/* --- BAGIAN INI SUDAH DIPERBAIKI --- */}
                  <div className="mt-2 text-gray-800 leading-relaxed">
                    {/* Sekarang menggunakan parser renderQuestionContent */}
                    {renderQuestionContent(q.questionText)}
                  </div>

                  {q.imageUrl && (
                    <img
                      src={q.imageUrl}
                      alt="Soal"
                      className="mt-2 h-32 object-contain"
                    />
                  )}

                  <div className="mt-3 grid grid-cols-1 gap-1 text-sm text-gray-600">
                    {q.options.map((opt) => (
                      <div
                        key={opt._id}
                        className={`flex items-start gap-2 ${
                          opt.id === q.correctAnswer
                            ? "font-bold text-green-600"
                            : ""
                        }`}
                      >
                        <span>{opt.id}.</span>
                        <span>{renderInlineMath(opt.text)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminQuestions;
