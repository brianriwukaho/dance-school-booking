import { Command, CommandProps } from '@repo/ddd';

export class BookClassCommand extends Command {
  public readonly classId: string;
  public readonly email: string;

  constructor(props: CommandProps<BookClassCommand>) {
    super(props);
    this.classId = props.classId;
    this.email = props.email;
  }
}
