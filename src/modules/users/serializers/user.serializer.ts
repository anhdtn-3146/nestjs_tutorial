export type UserSerializerType = 'BASIC_INFO';

const USER_FIELDS: Record<UserSerializerType, string[]> = {
  BASIC_INFO: ['id', 'username', 'bio', 'image'],
};

export class UserSerializer {
  constructor(
    private readonly user: Record<string, any>,
    private readonly options: { type: UserSerializerType },
  ) {}

  private get allowedFields(): string[] {
    return USER_FIELDS[this.options.type] || [];
  }

  serialize(): Record<string, any> {
    return this.allowedFields.reduce(
      (acc, field) => {
        if (this.user[field] !== undefined) {
          acc[field] = this.user[field];
        }
        return acc;
      },
      {} as Record<string, any>,
    );
  }
}
