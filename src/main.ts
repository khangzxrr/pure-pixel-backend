import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ['http://localhost:3006'],
    allowedHeaders: ['content-type'],
    credentials: true,
  });

  const configSwagger = new DocumentBuilder()
    .setTitle('PurePixel')
    .setDescription(
      'FPT Univeristy capstone project - purepixel, backend supported by Vo Ngoc Khang (khangzxrr@gmail.com)',
    )
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, configSwagger);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
}
bootstrap();
