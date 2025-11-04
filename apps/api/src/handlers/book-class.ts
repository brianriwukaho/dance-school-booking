import type { APIGatewayProxyHandler } from "aws-lambda";
import { BookClassService } from "../modules/booking/commands/book-class/book-class.service.js";
import { ClassRepository } from "../modules/booking/database/repositories/class.repository.js";
import { successResponse, errorResponse } from "./utils/api-response.js";
import { ArgumentNotProvidedException } from "@repo/ddd";
import { parseJson } from "./utils/parse-json.js";

const classRepository = new ClassRepository();
const service = new BookClassService(classRepository);

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const classId = event.pathParameters?.classId;
    if (!classId) {
      throw new ArgumentNotProvidedException(
        "Missing required path parameter: classId"
      );
    }

    const decodedClassId = decodeURIComponent(classId);

    const bodyResult = parseJson(event.body);
    if (bodyResult.isErr) {
      return errorResponse(bodyResult.error);
    }

    const result = await service.execute(decodedClassId, bodyResult.value);

    if (result.isErr) {
      return errorResponse(result.error);
    }

    console.log("Class booked successfully:", {
      classId: decodedClassId,
      email: result.value.email,
    });

    return successResponse(201, result.value);
  } catch (error: unknown) {
    console.error("Unexpected error in book-class handler:", error);
    if (error instanceof Error) {
      return errorResponse(error);
    }

    return errorResponse(new Error(String(error)));
  }
};
