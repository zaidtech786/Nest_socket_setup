import { Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Transactions, transactionSchema } from './transaction.schema';

@Module({
  imports:[MongooseModule.forFeature([{name:Transactions.name,schema:transactionSchema}])],
  controllers: [TransactionsController],
  providers: [TransactionsService],
})
export class TransactionsModule {}
