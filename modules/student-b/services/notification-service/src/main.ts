// services/notification-service/src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const logger = new Logger('NotificationService');
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.setGlobalPrefix('api/v1');
  const config = new DocumentBuilder()
    .setTitle('SDA-Pro Notification Service')
    .setDescription('Multi-channel notification dispatch via Abstract Factory pattern')
    .setVersion('1.0')
    .addTag('notifications')
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config));
  const port = process.env.PORT ?? 3004;
  await app.listen(port);
  logger.log(`Notification Service listening on port ${port}`);
}
bootstrap();
