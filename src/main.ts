import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { json, urlencoded } from 'express';

async function bootstrap() {
  BigInt.prototype['toJSON'] = function () {
    return this.toString();
  };

  const app = await NestFactory.create(AppModule, {
    snapshot: true,
    abortOnError: true,
  });

  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ limit: '50mb' }));

  const config = app.get(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      // whitelist: true,
    }),
  );
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  app.enableCors({
    origin: ['http://localhost:3000', 'https://purepixel.io.vn', '*'],
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
      openIdConnectUrl: config.get<string>('KEYCLOAK_OPENID_URL'),
    })
    .addSecurityRequirements('openid')
    .build();

  const document = SwaggerModule.createDocument(app, configSwagger);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      initOAuth: {
        clientId: config.get<string>('KEYCLOAK_CLIENT_ID'),
        realm: config.get<string>('KEYCLOAK_REALM'),
        appName: 'purepixel',
        clientSecret: config.get<string>('KEYCLOAK_SECRET_KEY'),
        scopes: ['offline_access', 'openid', 'profile', 'roles', 'email'],
      },
    },
  });

  await app.listen(3001);
}
bootstrap();
