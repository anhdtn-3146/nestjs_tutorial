export type UserSerializerType = 'BASIC_INFO' | 'PROFILE';

const USER_FIELDS: Record<UserSerializerType, string[]> = {
  BASIC_INFO: ['id', 'email', 'username', 'bio', 'image'],
  PROFILE: ['id', 'username', 'bio', 'image', 'following'],
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
