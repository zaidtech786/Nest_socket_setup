import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TransactionsModule } from './transactions/transactions.module';
import { SocketGatewayModule } from './socket_gateway/socket_gateway.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ ConfigModule.forRoot({
      isGlobal: true,
    }),
MongooseModule.forRoot(process.env.MONGO_URI! ),
TransactionsModule, SocketGatewayModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
