import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { json, urlencoded } from 'express';
import { LoggingInterceptor } from './infrastructure/interceptors/logging.interceptor';
import { RedisIoAdapter } from './redis-io-adapter';

declare global {
  interface BigInt {
    toJSON(): string;
  }
}

async function bootstrap() {
  BigInt.prototype.toJSON = function () {
    return this.toString();
  };

  const app = await NestFactory.create(AppModule, {
    snapshot: true,
    abortOnError: true,
  });

  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis();

  app.useWebSocketAdapter(redisIoAdapter);

  app.use(json({ limit: '100mb' }));
  app.use(urlencoded({ limit: '100mb' }));
  app.useGlobalInterceptors(new LoggingInterceptor());

  const config = app.get(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      // whitelist: true,
    }),
  );
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  app.enableCors({
    origin: process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',')
      : ['http://localhost:3000', 'https://purepixel.io.vn', '*'],
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
      openIdConnectUrl: `${config.get<string>('OIDC_ISSUER')}.well-known/openid-configuration`,
    })
    .addSecurityRequirements('openid')
    .build();

  const document = SwaggerModule.createDocument(app, configSwagger);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      initOAuth: {
        clientId: config.get<string>('OIDC_CLIENT_ID'),
        appName: 'purepixel',
        scopes: ['openid', 'profile', 'email', 'offline_access'],
        usePkceWithAuthorizationCodeGrant: true,
      },
    },
  });

  await app.listen(3001);
}
bootstrap();
