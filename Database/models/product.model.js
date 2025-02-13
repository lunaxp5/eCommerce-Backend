import { Schema, model } from "mongoose";

const productSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minLength: [3, "Too Short product Name"],
    },
    imgCover: {
      type: String,
    },
    images: {
      type: [String],
    },
    description: {
      type: String,
      maxlength: [100, "Description should be less than or equal to 100"],
      minlength: [10, "Description should be more than or equal to 10"],
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      default: 0,
      min: 0,
      required: true,
    },
    priceAfterDiscount: {
      type: Number,
      default: 0,
      min: 0,
    },
    quantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    sold: {
      type: Number,
      default: 0,
      min: 0,
    },
    category: {
      type: Schema.ObjectId,
      ref: "category",
      required: true,
    },
    subcategory: {
      type: Schema.ObjectId,
      ref: "subcategory",
      default: null,
      set: (v) => (v === "" ? null : v),
    },
    brand: {
      type: Schema.ObjectId,
      ref: "brand",
      default: null,
      set: (v) => (v === "" ? null : v),
    },
    ratingAvg: {
      type: Number,
      min: 1,
      max: 5,
    },
    ratingCount: {
      type: Number,
      min: 0,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

productSchema.post("init", function (doc) {
  if (doc.imgCover && doc.images) {
    doc.imgCover = `${process.env.BASE_URL}products/${doc.imgCover}`;
    doc.images = doc.images.map((ele) => {
      return `${process.env.BASE_URL}products/${ele}`;
    });
  }
});

productSchema.virtual("reviews", {
  ref: "review",
  localField: "_id",
  foreignField: "productId",
});

productSchema.pre(["find", "findOne"], function () {
  this.populate("reviews");
});

export const productModel = model("product", productSchema);
