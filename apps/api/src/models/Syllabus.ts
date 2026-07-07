import mongoose, { Schema, type InferSchemaType } from "mongoose";

const topicSchema = new Schema(
  {
    code: { type: String, required: true },
    title: { type: String, required: true },
  },
  { _id: false },
);

const unitSchema = new Schema(
  {
    number: { type: Number, required: true },
    title: { type: String, required: true },
    topics: { type: [topicSchema], default: [] },
  },
  { _id: false },
);

const parsedSchema = new Schema(
  {
    courseTitle: { type: String, required: true },
    courseCode: { type: String, default: "" },
    units: { type: [unitSchema], default: [] },
    referenceBooks: { type: [String], default: [] },
  },
  { _id: false },
);

const syllabusSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    rawText: { type: String, required: true },
    parsed: { type: parsedSchema, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export type SyllabusDoc = InferSchemaType<typeof syllabusSchema> & { _id: mongoose.Types.ObjectId };

export const Syllabus = mongoose.model("Syllabus", syllabusSchema);
