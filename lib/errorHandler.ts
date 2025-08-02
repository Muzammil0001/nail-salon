import { Prisma } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
interface ErrorResponse {
  statusCode: number;
  message: string;
}

export function handlePrismaError(error: any): ErrorResponse {
  if (error instanceof PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2000":
        return {
          statusCode: StatusCodes.BAD_REQUEST,
          message: "the_provided_value_is_too_long_for_the_column",
        };
      case "P2001":
        return {
          statusCode: StatusCodes.NOT_FOUND,
          message: "the_record_does_not_exist",
        };
      case "P2002":
        return {
          statusCode: StatusCodes.CONFLICT,
          message: "a_unique_constraint_failed_on_the_fields",
        };
      case "P2003":
        return {
          statusCode: StatusCodes.FORBIDDEN,
          message: "a_foreign_key_constraint_failed_on_the_field",
        };
      case "P2004":
        return {
          statusCode: StatusCodes.BAD_REQUEST,
          message: "the_record_is_invalid",
        };
      case "P2010":
        return {
          statusCode: StatusCodes.BAD_REQUEST,
          message: "the_operation_could_not_be_performed",
        };
      default:
        return {
          statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
          message: "a_known_database_error_occurred",
        };
    }
  }

  return {
    statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    message: "an_unknown_error_occurred",
  };
}
