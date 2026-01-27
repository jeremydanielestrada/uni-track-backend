import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { governorsTable } from "../db/schema";
import { eq } from "drizzle-orm";
import { db } from "../index";
import { getGovernorByIdNum } from "../models/governor";

const setCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProduction, // true in production
    sameSite: (isProduction ? "none" : "lax") as "none" | "lax", // "none" for cross-origin in production
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/",
  };
};

export const register = async (req: Request, res: Response) => {
  try {
    const { id_num, name, college_dep, password } = req.body;

    if (!id_num || !name || !college_dep || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const idNumExist = await getGovernorByIdNum(id_num);

    if (idNumExist) {
      return res.status(400).json({ message: "ID Number already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [newGovernor] = await db
      .insert(governorsTable)
      .values({
        id_num,
        name,
        college_dep,
        password: hashedPassword,
      })
      .returning();

    const token = jwt.sign({ id: newGovernor?.id }, process.env.JWT_SECRET!, {
      expiresIn: "7d",
    });

    res.cookie("token", token, setCookieOptions());

    return res.status(201).json({
      token,
      user: {
        id_num: newGovernor?.id,
        name: newGovernor?.name,
        college_dep: newGovernor?.college_dep,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error registering user" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { id_num, password } = req.body;

    const governor = await db
      .select()
      .from(governorsTable)
      .where(eq(governorsTable.id_num, id_num))
      .limit(1);

    const foundGovernor = governor[0];

    if (!foundGovernor) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isValid = await bcrypt.compare(password, foundGovernor.password);

    if (!isValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id_num: foundGovernor.id_num },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" },
    );

    res.cookie("token", token, setCookieOptions());

    return res.json({
      token,
      user: { id_num: foundGovernor.id_num, name: foundGovernor.name },
    });
  } catch (error) {
    res.status(500).json({ message: "Error logging user" });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const isProduction = process.env.NODE_ENV === "production";

    // Clear cookie with same options as when it was set
    res.cookie("token", "", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      expires: new Date(0),
      path: "/",
    });

    return res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    res.status(500).json({ message: "Error logging out" });
  }
};
