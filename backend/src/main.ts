import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  app.getHttpAdapter().getInstance().set('trust proxy', 1);
  
  // Enable Helmet for security headers
  app.use(helmet());

  // Enable compression
  app.use(compression());

  // Enable global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true, // Strict validation
  }));

  // API Versioning
  app.setGlobalPrefix('api/v1');
  
  const env = process.env.APP_ENV || process.env.NODE_ENV || 'development';
  const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean) : [];
  if (env === 'production' && allowedOrigins.length === 0) {
    throw new Error('ALLOWED_ORIGINS is required in production');
  }

  app.enableCors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : ['http://localhost:3000', 'http://localhost:3001'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
