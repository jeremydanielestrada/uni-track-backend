import { eq } from "drizzle-orm";
import { db } from "../index.js";
import { governorsTable } from "../db/schema.js";

export const getGovernorByIdNum = async (id_num: string) => {
  const governor = await db
    .select()
    .from(governorsTable)
    .where(eq(governorsTable.id_num, id_num))
    .limit(1);

  return governor[0];
};
