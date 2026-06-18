import dgram from "node:dgram";

type DatarefValue = {
  path: string;
  value: number;
};

const DEFAULT_XPLANE_HOST = "127.0.0.1";
const DEFAULT_XPLANE_PORT = 49000;

export function getXPlaneTarget() {
  return {
    host: process.env.XPLANE_HOST ?? DEFAULT_XPLANE_HOST,
    port: Number(process.env.XPLANE_PORT ?? DEFAULT_XPLANE_PORT),
  };
}

export async function sendDatarefs(values: DatarefValue[]) {
  const target = getXPlaneTarget();
  const socket = dgram.createSocket("udp4");

  try {
    for (const value of values) {
      const packet = createDrefPacket(value.path, value.value);
      await sendPacket(socket, packet, target.port, target.host);
    }
  } finally {
    socket.close();
  }

  return {
    target,
    sent: values,
  };
}

function sendPacket(socket: dgram.Socket, packet: Buffer, port: number, host: string) {
  return new Promise<void>((resolve, reject) => {
    socket.send(packet, port, host, (error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

function createDrefPacket(path: string, value: number) {
  const packet = Buffer.alloc(509);
  packet.write("DREF\0", 0, "ascii");
  packet.writeFloatLE(value, 5);
  packet.write(path, 9, 500, "ascii");
  return packet;
}
