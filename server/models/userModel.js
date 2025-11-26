import mongoose from "mongoose";
import bcypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        // Validasi email sederhana
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Harap masukkan alamat email yang valid",
      ],
    },
    namaTeam: {
      type: String,
      required: true,
      unique: true, // "per team per akun"
      trim: true,
    },
    namaKetuaTeam: {
      type: String,
      required: true,
      trim: true,
    },
    asalSekolah: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["student", "admin"],
      default: "student",
    },
  },
  {
    timestamps: true,
  }
);

//middleware 'pre-save'
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  try {
    const salt = await bcypt.genSalt(10);
    this.password = await bcypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

//method compare password
userSchema.methods.comparePassword = async function (password) {
  return await bcypt.compare(password, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
