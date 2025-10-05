import { Schema, model } from "mongoose";

const categorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      minLength: [4, "Too Short"],
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      lowercase: true,
    },
    image: {
      type: String,
    },
    showInHoemePage: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);
categorySchema.post("init", function (doc) {
  doc.image = `${process.env.BASE_URL}/category/${doc.image}`;
  console.log(doc);
});
export const categoryModel = model("category", categorySchema);
