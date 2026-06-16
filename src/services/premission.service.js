import { prisma } from "../lib/prisma.js";
import { createAppError } from "../utils/createAppError.js";
import { PrismaFeatures } from "../utils/PrismaFeatures.js";
import * as crud from "./crud.service.js"



/**
 * getall premission
 */

export const allPremission = async(query)=>{

   const features = new PrismaFeatures(prisma.permission, query )
    .filter(["module"])
    .search(["name", "description","slug"])
    .sort(["createdAt", "name", "module"])
    .paginate();

  features.queryOptions.where = { ...features.queryOptions.where, isDeleted: false };

  const result = await features.exec();

  return result;
}