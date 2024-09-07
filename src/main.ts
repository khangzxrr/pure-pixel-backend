import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    snapshot: true,
    abortOnError: true,
  });

  app.setGlobalPrefix('backend');

  app.useGlobalPipes(new ValidationPipe());

  app.enableCors({
    origin: ['http://localhost:3000'],
    allowedHeaders: ['content-type', 'Authorization'],
    credentials: true,
  });

  //remember access api
  //http://localhost:3001/api/
  //add / at the end
  const configSwagger = new DocumentBuilder()
    .setTitle('PurePixel')
    .setDescription(
      'FPT Univeristy capstone project - purepixel, backend supported by Vo Ngoc Khang (khangzxrr@gmail.com)',
    )
    .setVersion('1.0')
    .addSecurity('openid', {
      type: 'openIdConnect',
      openIdConnectUrl: process.env.KEYCLOAK_OPENID_URL,
    })
    .addSecurityRequirements('openid')
    .build();

  const document = SwaggerModule.createDocument(app, configSwagger);
  SwaggerModule.setup('backend/api', app, document, {
    swaggerOptions: {
      initOAuth: {
        clientId: process.env.KEYCLOAK_CLIENT_ID,
        realm: process.env.KEYCLOAK_REALM,
        appName: 'purepixel',
        clientSecret: process.env.KEYCLOAK_SECRET_KEY,
        scopes: ['offline_access', 'openid', 'profile', 'roles', 'email'],
      },
    },
  });

  await app.listen(3001);
}
bootstrap();
