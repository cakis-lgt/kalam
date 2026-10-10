import { z } from "zod";
import {
  GONTOR_FACULTIES,
  isValidFacultyProgramPair,
} from "@/lib/profile/unida-academics";

const usernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(30, "Username is too long")
  .regex(
    /^[a-z][a-z0-9_]*$/i,
    "Username must start with a letter and use only letters, numbers, or underscore",
  )
  .transform((v) => v.toLowerCase());

const nimSchema = z
  .string()
  .min(6, "NIM must be at least 6 characters")
  .max(20, "NIM is too long")
  .regex(/^[0-9]+$/, "NIM must contain digits only");

export const loginSchema = z.object({
  identifier: z.string().min(1, "Username or email is required"),
  password: z.string().min(1, "Password is required"),
  remember: z.boolean().optional(),
});

export const registerSchema = z
  .object({
    username: usernameSchema,
    fullName: z
      .string()
      .min(2, "Full name must be at least 2 characters")
      .max(120, "Full name is too long"),
    email: z.string().email("Invalid email format"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password is too long"),
    confirmPassword: z.string(),
    nim: nimSchema,
    faculty: z.enum(GONTOR_FACULTIES, {
      errorMap: () => ({ message: "Select your faculty" }),
    }),
    studyProgram: z.string().min(1, "Select your study program"),
    semester: z.coerce
      .number()
      .int("Semester must be a whole number")
      .min(1, "Minimum semester is 1")
      .max(14, "Maximum semester is 14"),
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: "You must accept the terms of service" }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password confirmation does not match",
    path: ["confirmPassword"],
  })
  .refine(
    (data) => isValidFacultyProgramPair(data.faculty, data.studyProgram),
    {
      message: "Select a study program for the chosen faculty",
      path: ["studyProgram"],
    },
  );

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

export const profileUpdateSchema = z
  .object({
    fullName: z
      .string()
      .min(2, "Full name must be at least 2 characters")
      .max(120, "Full name is too long"),
    username: usernameSchema,
    nim: nimSchema,
    faculty: z.enum(GONTOR_FACULTIES, {
      errorMap: () => ({ message: "Select your faculty" }),
    }),
    studyProgram: z.string().min(1, "Select your study program"),
    semester: z.coerce
      .number()
      .int("Semester must be a whole number")
      .min(1, "Minimum semester is 1")
      .max(14, "Maximum semester is 14"),
  })
  .refine(
    (data) => isValidFacultyProgramPair(data.faculty, data.studyProgram),
    {
      message: "Select a study program for the chosen faculty",
      path: ["studyProgram"],
    },
  );

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
