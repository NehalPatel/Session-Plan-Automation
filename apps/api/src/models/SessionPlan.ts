import mongoose, { Schema, type InferSchemaType } from "mongoose";

const scheduleRowSchema = new Schema(
  {
    date: { type: String, required: true },
    startTime: { type: String, default: "" },
    endTime: { type: String, default: "" },
    room: { type: String, default: "" },
  },
  { _id: false },
);

const metadataSchema = new Schema(
  {
    academicYear: { type: String, required: true },
    class: { type: String, required: true },
    semester: { type: Number, required: true },
    divisions: { type: [String], required: true, default: ["A"] },
    subjectName: { type: String, required: true },
  },
  { _id: false },
);

const dateRangeSchema = new Schema(
  {
    fromDate: { type: String, required: true },
    toDate: { type: String, required: true },
  },
  { _id: false },
);

const unitSelectionSchema = new Schema(
  {
    mode: { type: String, enum: ["all", "firstN", "manual"], required: true },
    value: { type: Schema.Types.Mixed },
  },
  { _id: false },
);

const sessionRowSchema = new Schema(
  {
    sessionNo: { type: Number, required: true },
    unitNoAndName: { type: String, required: true },
    topic: { type: String, required: true },
    reference: { type: String, default: "" },
    deliveryMethod: { type: String, required: true },
    completedOn: { type: String, required: true },
    roomNo: { type: String, default: "" },
    time: { type: String, default: "" },
    studentsPresent: { type: String, default: "" },
  },
  { _id: false },
);

const sessionPlanSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    syllabusId: { type: Schema.Types.ObjectId, ref: "Syllabus" },
    metadata: { type: metadataSchema, required: true },
    dateRange: { type: dateRangeSchema, required: true },
    schedule: { type: [scheduleRowSchema], default: [] },
    unitSelection: { type: unitSelectionSchema, required: true },
    rows: { type: [sessionRowSchema], default: [] },
    status: { type: String, enum: ["draft", "final"], default: "draft" },
  },
  { timestamps: true },
);

export type SessionPlanDoc = InferSchemaType<typeof sessionPlanSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const SessionPlan = mongoose.model("SessionPlan", sessionPlanSchema);
