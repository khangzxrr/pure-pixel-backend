import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from 'rxjs/operators'


@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private printHttpLog(context: ExecutionContext) {

    const httpContext = context.switchToHttp();

    if (httpContext) {
      const request = httpContext.getRequest();

      console.log(`${request.method} ${request.originalUrl}:`)
      console.log(request.body);
    }

  }

  intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> | Promise<Observable<any>> {
    const now = Date.now();


    return next.handle().pipe(tap(() => this.printHttpLog(context)));
  }

}
