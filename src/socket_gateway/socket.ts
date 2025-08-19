import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { transactionDocument, Transactions } from 'src/transactions/transaction.schema';


@WebSocketGateway({
  cors: { origin: '*' },
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
 private activeWatchers = new Map<string, any>();
  constructor(
    @InjectModel(Transactions.name)
    private readonly transModel: Model<transactionDocument>,
  ) {
    // this.watchTransactions();
  }

  handleConnection(client: Socket) {
    console.log('Client connected:', client.id);
  }

  handleDisconnect(client: Socket) {
    console.log('Client disconnected:', client.id);
  }

//   @SubscribeMessage('joinRoom')
//   handleJoinRoom(
//     @MessageBody() data: { userId: string; transactionId: string },
//     @ConnectedSocket() client: Socket,
//   ) {
//     const roomName = `${data.userId}_${data.transactionId}`;
//     client.join(roomName);
//     console.log(`User ${data.userId} joined room ${roomName}`);
//     return { message: `Joined ${roomName}` };
//   }

@SubscribeMessage('joinRoom')
async handleJoinRoom(
  @MessageBody() data: { userId: string; transactionId: string },
  @ConnectedSocket() client: Socket,
) {
  const roomName = `${data.userId}_${data.transactionId}`;
  client.join(roomName);

  console.log(`User ${data.userId} joined room ${roomName}`);

  const changeStream = this.transModel.watch(
    [{ $match: { 'fullDocument.txnId': data.transactionId } }],
    { fullDocument: 'updateLookup' }
  );

  // 🔥 5 minute timer (auto close if no final status)
  const timeout = setTimeout(() => {
    console.log(`⏳ 5 minutes passed. Closing watcher and socket for txnId ${data.transactionId}`);
    changeStream.close();
    client.leave(roomName);
    client.disconnect(true);
  }, 5 * 60 * 1000);

  changeStream.on('change', (change) => {
    const fullDoc = change.fullDocument;
    if (!fullDoc) return;

    // Send realtime update to client
    this.server.to(roomName).emit('paymentUpdate', {
      txnId: fullDoc.txnId,
      status: fullDoc.status,
    });

    console.log(`Status update for txnId ${fullDoc.txnId}: ${fullDoc.status}`);

    // ✅ Close only if final status
    if (['success', 'failed'].includes(fullDoc.status)) {
      console.log(`Final status received (${fullDoc.status}). Closing watcher for txnId ${fullDoc.txnId}`);

      clearTimeout(timeout); // stop timer
      changeStream.close();
      client.leave(roomName);
      client.disconnect(true);
    }
  });

  changeStream.on('close', () => {
    console.log(`Watcher closed for txnId ${data.transactionId}`);
  });

  return { message: `Watching transaction ${data.transactionId} for 5 minutes` };
} 



//   private async watchTransactions() {
//     const changeStream = this.transModel.watch();

//     changeStream.on('change', (change) => {
//       console.log('Transaction Change:', change);

//       if (change.operationType === 'insert' || change.operationType === 'update') {
//         const fullDoc = change.fullDocument;

//         // Build room name
//         const roomName = `${fullDoc.userId}_${fullDoc.txnId}`;

//         // Emit to only that user's room
//         this.server.to(roomName).emit('paymentUpdate', {
//           txnId: fullDoc.txnId,
//           status: fullDoc.status,
//         });

//         console.log(`Sent update to room ${roomName}`);
//       }
//     });
//   }
}
