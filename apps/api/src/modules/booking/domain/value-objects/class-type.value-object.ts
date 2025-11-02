import { ValueObject, ArgumentInvalidException } from "@repo/ddd";

export type ClassTypeValue = "salsa" | "bachata" | "reggaeton";

interface ClassTypeProps {
  type: ClassTypeValue;
  level?: number;
}

export class ClassType extends ValueObject<ClassTypeProps> {
  constructor(type: ClassTypeValue, level?: number) {
    super({ type, level });
  }

  protected validate(props: ClassTypeProps): void {
    const validTypes: ClassTypeValue[] = ["salsa", "bachata", "reggaeton"];
    if (!validTypes.includes(props.type)) {
      throw new ArgumentInvalidException(
        `Invalid class type: ${props.type}. Must be one of: ${validTypes.join(", ")}`
      );
    }

    if (props.type === "salsa" && props.level !== undefined) {
      if (props.level < 1 || props.level > 3) {
        throw new ArgumentInvalidException(
          "Salsa level must be between 1 and 3"
        );
      }
    }

    if (props.type === "bachata" && props.level !== undefined) {
      if (props.level < 1 || props.level > 2) {
        throw new ArgumentInvalidException(
          "Bachata level must be between 1 and 2"
        );
      }
    }

    if (props.type === "reggaeton" && props.level !== undefined) {
      throw new ArgumentInvalidException("Reggaeton does not have levels");
    }
  }

  get type(): ClassTypeValue {
    return this.unpack().type;
  }

  get level(): number | undefined {
    return this.unpack().level;
  }
}
