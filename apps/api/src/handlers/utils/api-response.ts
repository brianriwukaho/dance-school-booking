import type { APIGatewayProxyResult } from "aws-lambda";
import {
  ExceptionBase,
  ArgumentInvalidException,
  ArgumentNotProvidedException,
  ArgumentOutOfRangeException,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
} from "@repo/ddd";
import { ErrorResponseDTO } from "@repo/dtos";

export function successResponse(
  statusCode: number,
  body: any
): APIGatewayProxyResult {
  const response: APIGatewayProxyResult = {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
    },
    body: JSON.stringify(body),
  };

  return response;
}

export function errorResponse(
  error: ExceptionBase | Error
): APIGatewayProxyResult {
  let statusCode: number;

  switch (error.constructor) {
    case NotFoundException:
      statusCode = 404;
      break;
    case ConflictException:
      statusCode = 409;
      break;
    case ArgumentInvalidException:
    case ArgumentNotProvidedException:
    case ArgumentOutOfRangeException:
      statusCode = 400;
      break;
    case InternalServerErrorException:
      statusCode = 500;
      break;
    default:
      if (error instanceof ExceptionBase) {
        // Fallback for any other ExceptionBase subclasses
        console.warn(
          `Unhandled exception type: ${error.constructor.name}, defaulting to 500`
        );
      }
      statusCode = 500;
      break;
  }

  const errorBody: ErrorResponseDTO = {
    error: {
      code:
        error instanceof ExceptionBase ? error.constructor.name : "InternalServerErrorException",
      message: error.message,
      correlationId:
        error instanceof ExceptionBase ? error.correlationId : undefined,
    },
  };

  const response: APIGatewayProxyResult = {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
    },
    body: JSON.stringify(errorBody),
  };

  return response;
}
