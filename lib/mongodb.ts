import { MongoClient } from 'mongodb';

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function getClientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI no definido');

  if (process.env.NODE_ENV === 'development') {
    if (!global._mongoClientPromise) {
      const client = new MongoClient(uri);
      global._mongoClientPromise = client.connect();
    }
    return global._mongoClientPromise;
  }

  const client = new MongoClient(uri);
  return client.connect();
}

// Export a proxy that defers connection until first use
const clientPromise: Promise<MongoClient> = new Proxy(
  {} as Promise<MongoClient>,
  {
    get(_target, prop) {
      return getClientPromise()[prop as keyof Promise<MongoClient>];
    },
    apply(_target, thisArg, args) {
      return (getClientPromise() as unknown as (...a: unknown[]) => unknown).apply(thisArg, args);
    },
  }
);

export default clientPromise;
