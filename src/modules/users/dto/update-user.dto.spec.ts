import { validateSync } from 'class-validator';
import { UpdateUserDto } from './update-user.dto';

describe('UpdateUserDto', () => {
  it('rejects an omitted email', () => {
    const dto = new UpdateUserDto();

    expect(validateSync(dto).some((error) => error.property === 'email')).toBe(
      true,
    );
  });

  it('rejects null email because the field is not nullable', () => {
    const dto = new UpdateUserDto();
    dto.email = null as unknown as string;

    expect(validateSync(dto).length).toBeGreaterThan(0);
  });

  it('rejects empty fullName', () => {
    const dto = new UpdateUserDto();
    dto.email = 'test@example.com';
    dto.fullName = '';

    expect(validateSync(dto).length).toBeGreaterThan(0);
  });

  it('accepts null phone so clients can clear it', () => {
    const dto = new UpdateUserDto();
    dto.email = 'test@example.com';
    dto.phone = null;

    expect(validateSync(dto)).toHaveLength(0);
  });

  it('rejects empty phone when provided as a string', () => {
    const dto = new UpdateUserDto();
    dto.email = 'test@example.com';
    dto.phone = '';

    expect(validateSync(dto).length).toBeGreaterThan(0);
  });

  it('rejects an invalid role value', () => {
    const dto = new UpdateUserDto();
    dto.email = 'test@example.com';
    dto.role = 'super-admin' as never;

    expect(validateSync(dto).length).toBeGreaterThan(0);
  });
});
