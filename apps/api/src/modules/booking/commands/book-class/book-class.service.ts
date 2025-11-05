import { Result } from "@badrap/result";
import { BookClassCommand } from "./book-class.command.js";
import { ClassRepository } from "../../database/repositories/class.repository.js";
import { Email } from "../../domain/value-objects/email.value-object.js";
import { ExceptionBase } from "@repo/ddd";
import {
  bookClassRequestDTOSchema,
  type BookClassResponseDTO,
} from "@repo/dtos";
import {
  InvalidBookingRequestException,
  ClassNotFoundException,
} from "../../exceptions/booking.exceptions.js";

/**
 * Command service for booking a class.
 * Enforces business rules via the Class aggregate.
 */
export class BookClassService {
  constructor(private readonly classRepository: ClassRepository) {}

  async execute(
    classId: string,
    body: unknown
  ): Promise<Result<BookClassResponseDTO, ExceptionBase>> {
    const validationResult = bookClassRequestDTOSchema.safeParse(body);
    if (!validationResult.success) {
      return Result.err(
        new InvalidBookingRequestException(validationResult.error)
      );
    }

    const command = new BookClassCommand({
      classId,
      email: validationResult.data.email,
    });

    try {
      return await this.executeCommand(command);
    } catch (error) {
      if (error instanceof ExceptionBase) {
        return Result.err(error);
      }
      throw error; // Re-throw unexpected errors
    }
  }

  private async executeCommand(
    command: BookClassCommand
  ): Promise<Result<BookClassResponseDTO, ExceptionBase>> {
    const classWithVersion = await this.classRepository.findById(command.classId);

    if (!classWithVersion) {
      return Result.err(new ClassNotFoundException(command.classId));
    }

    const email = new Email(command.email);

    const booking = classWithVersion.aggregate.book(email);

    const saveResult = await this.classRepository.save(classWithVersion);

    if (saveResult.isErr) {
      return Result.err(saveResult.error);
    }

    const response: BookClassResponseDTO = {
      classId: command.classId,
      email: command.email,
      bookedAt: booking.bookedAt.toISOString(),
    };

    return Result.ok(response);
  }
}
