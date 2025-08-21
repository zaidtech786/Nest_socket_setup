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
  }

  handleConnection(client: Socket) {
    console.log('Client connected:', client.id);
  }

  handleDisconnect(client: Socket) {
    console.log('Client disconnected:', client.id);
  }



// @SubscribeMessage('joinRoom')
// async handleJoinRoom(
//   @MessageBody() data: { userId: string; txnId: string },
//   @ConnectedSocket() client: Socket,
// ) {
//   const roomName = `${data.userId}_${data.txnId}`;
//   client.join(roomName);

//   console.log(`User ${data.userId} joined room ${roomName}`);

//   const changeStream = this.transModel.watch(
//     [{ $match: { 'fullDocument.txnId': data.txnId } }],
//     { fullDocument: 'updateLookup' }
//   );

//   const timeout = setTimeout(() => {
//     console.log(`⏳ 5 minutes passed. Closing watcher and socket for txnId ${data.txnId}`);
//     changeStream.close();
//     client.leave(roomName);
//     client.disconnect(true);
//   }, 5 * 60 * 1000);

//   changeStream.on('change', (change) => {
//     const fullDoc = change.fullDocument;
//     if (!fullDoc) return;

//     this.server.to(roomName).emit('paymentUpdate', {
//       txnId: fullDoc.txnId,
//       status: fullDoc.status,
//     });

//     console.log(`Status update for txnId ${fullDoc.txnId}: ${fullDoc.status}`);

//     if (['success', 'failed'].includes(fullDoc.status)) {
//       console.log(`Final status received (${fullDoc.status}). Closing watcher for txnId ${fullDoc.txnId}`);

//       clearTimeout(timeout); // stop timer
//       changeStream.close();
//       client.leave(roomName);
//       client.disconnect(true);
//     }
//   });

//   changeStream.on('close', () => {
//     console.log(`Watcher closed for txnId ${data.txnId}`);
//   });

//   return { message: `Watching transaction ${data.txnId} for 5 minutes` };
// } 


@SubscribeMessage('joinRoom')
async handleJoinRoom(
  @MessageBody() data: { userId: string; txnId: string },
  @ConnectedSocket() client: Socket,
) {
  const roomName = `${data.userId}_${data.txnId}`;
  client.join(roomName);

  console.log(`User ${data.userId} joined room ${roomName}`);

  const timeout = setTimeout(() => {
    console.log(`⏳ 5 minutes passed. Closing watcher and socket for txnId ${data.txnId}`);
    changeStream.close();
    client.leave(roomName);
    client.disconnect(true);
  }, 5 * 60 * 1000);

  // 1️⃣ Send the latest state from DB immediately
  const txn = await this.transModel.findOne({ txnId: data.txnId }).lean();
  if (txn) {
    client.emit("paymentUpdate", {
      txnId: txn.txnId,
      status: txn.status,
    });

    if (['success', 'failed'].includes(txn.status)) {
      this.activeWatchers.delete(data.txnId);
      clearTimeout(timeout); // stop timer
      client.leave(roomName);
      client.disconnect();
    }
    console.log(`Sent latest status of txnId ${txn.txnId}: ${txn.status}`);
  }

  // 2️⃣ Reuse existing watcher if present
  if (this.activeWatchers.has(data.txnId)) {
    return { message: `Rejoined transaction ${data.txnId}` };
  }

  // 3️⃣ Otherwise, create a watcher
  const changeStream = this.transModel.watch(
    [{ $match: { 'fullDocument.txnId': data.txnId } }],
    { fullDocument: 'updateLookup' }
  );

  this.activeWatchers.set(data.txnId, changeStream);

  changeStream.on('change', (change) => {
    const fullDoc = change.fullDocument;
    if (!fullDoc) return;

    this.server.to(roomName).emit('paymentUpdate', {
      txnId: fullDoc.txnId,
      status: fullDoc.status,
    });

    console.log(`Live update txnId ${fullDoc.txnId}: ${fullDoc.status}`);

    if (['success', 'failed'].includes(fullDoc.status)) {
      this.activeWatchers.delete(data.txnId);
      clearTimeout(timeout); // stop timer
      changeStream.close();
      client.leave(roomName);
      client.disconnect();
    }
  });

  changeStream.on('close', () => {
    this.activeWatchers.delete(data.txnId);
  });

  return { message: `Watching transaction ${data.txnId}` };
}

}
