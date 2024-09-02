import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    snapshot: true,
    abortOnError: true,
  });

  app.useGlobalPipes(new ValidationPipe());

  app.enableCors({
    origin: ['http://localhost:3000'],
    allowedHeaders: ['content-type', 'Authorization'],
    credentials: true,
  });

  const configSwagger = new DocumentBuilder()
    .addBearerAuth()
    .addSecurityRequirements('bearer')
    .setTitle('PurePixel')
    .setDescription(
      'FPT Univeristy capstone project - purepixel, backend supported by Vo Ngoc Khang (khangzxrr@gmail.com)',
    )
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, configSwagger);
  SwaggerModule.setup('api', app, document);

  await app.listen(3001);
}
bootstrap();
