import type { APIGatewayProxyHandler } from "aws-lambda";
import { GetClassService } from "../modules/booking/queries/get-class/get-class.service.js";
import { ClassRepository } from "../modules/booking/database/repositories/class.repository.js";
import { successResponse, errorResponse } from "./utils/api-response.js";
import { ArgumentNotProvidedException } from "@repo/ddd";

const classRepository = new ClassRepository();
const service = new GetClassService(classRepository);

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const classId = event.pathParameters?.classId;
    if (!classId) {
      throw new ArgumentNotProvidedException(
        "Missing required path parameter: classId"
      );
    }

    const decodedClassId = decodeURIComponent(classId);

    const result = await service.execute(decodedClassId);

    if (result.isErr) {
      return errorResponse(result.error);
    }

    console.log("Class retrieved successfully:", {
      classId: decodedClassId,
    });

    return successResponse(200, result.value);
  } catch (error: unknown) {
    console.error("Unexpected error in get-class handler:", error);

    if (error instanceof Error) {
      return errorResponse(error);
    }

    return errorResponse(new Error(String(error)));
  }
};
