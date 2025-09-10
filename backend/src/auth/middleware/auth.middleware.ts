import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // CORS 已由全局 app.enableCors 统一处理，这里不再处理预检请求，避免丢失 Access-Control-Allow-* 头
    // 如需在此处添加其他与鉴权无关的跨路由逻辑，可继续调用 next()
    next();
  }
}