import type { APIGatewayProxyHandler } from "aws-lambda";
import { SearchClassesService } from "../modules/booking/queries/search-classes/search-classes.service.js";
import { ClassRepository } from "../modules/booking/database/repositories/class.repository.js";
import { successResponse, errorResponse } from "./utils/api-response.js";
import { parseJson } from "./utils/parse-json.js";

const classRepository = new ClassRepository();
const service = new SearchClassesService(classRepository);

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const bodyResult = parseJson(event.body);
    if (bodyResult.isErr) {
      return errorResponse(bodyResult.error);
    }

    const result = await service.execute(bodyResult.value);

    if (result.isErr) {
      return errorResponse(result.error);
    }

    console.log("Classes searched successfully:", {
      resultsCount: result.value.classes.length,
    });

    return successResponse(200, result.value);
  } catch (error: unknown) {
    console.error("Unexpected error in search-classes handler:", error);

    if (error instanceof Error) {
      return errorResponse(error);
    }

    // Fallback for non-Error throws (strings, objects, etc.)
    return errorResponse(new Error(String(error)));
  }
};
