import { Module } from '@nestjs/common';
import { SocketGateway } from './socket';
import { MongooseModule } from '@nestjs/mongoose';
import { Transactions, transactionSchema } from 'src/transactions/transaction.schema';

@Module({
  imports:[MongooseModule.forFeature([{name:Transactions.name,schema:transactionSchema}])],
    providers:[SocketGateway],
    exports:[SocketGateway]
})
export class SocketGatewayModule {}
