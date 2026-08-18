import { NestFactory, Reflector } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'node:path';
import { AppModule } from './app.module';
import { ClassSerializerInterceptor, HttpStatus } from '@nestjs/common';
import {
  I18nValidationError,
  I18nValidationExceptionFilter,
  I18nValidationPipe,
} from 'nestjs-i18n';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix('api');
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  app.useGlobalPipes(
    new I18nValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      stopAtFirstError: true,
    }),
  );

  // Enable global class-transformer decorators (Exclude, Expose, Transform)
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  app.useGlobalFilters(
    new I18nValidationExceptionFilter({
      detailedErrors: true,
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      responseBodyFormatter: (
        _host,
        _exception,
        formattedErrors: I18nValidationError[],
      ) => {
        const customErrors = formattedErrors.map((err) => ({
          field: err.property,
          message: err.constraints ? Object.values(err.constraints)[0] : '',
        }));

        return {
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: customErrors,
        };
      },
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
