import dgram from "node:dgram";

type DatarefValue = {
  path: string;
  value: number;
};

type XPlaneReadResult = {
  index: number;
  value: number;
};

const DEFAULT_XPLANE_HOST = "127.0.0.1";
const DEFAULT_XPLANE_PORT = 49000;
const STATUS_DATAREF = "sim/time/total_running_time_sec";

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

export async function checkXPlaneConnection(timeoutMs = 1500) {
  const target = getXPlaneTarget();
  const socket = dgram.createSocket("udp4");
  const requestIndex = 8701;

  try {
    const result = await readDataref(socket, STATUS_DATAREF, requestIndex, target.port, target.host, timeoutMs);
    await sendPacket(socket, createRrefPacket(STATUS_DATAREF, requestIndex, 0), target.port, target.host);

    return {
      target,
      dataref: STATUS_DATAREF,
      value: result.value,
    };
  } finally {
    socket.close();
  }
}

function readDataref(
  socket: dgram.Socket,
  path: string,
  index: number,
  port: number,
  host: string,
  timeoutMs: number,
) {
  return new Promise<XPlaneReadResult>((resolve, reject) => {
    const timeout = setTimeout(() => {
      socket.off("message", onMessage);
      reject(new Error("X-Plane hat nicht geantwortet."));
    }, timeoutMs);

    function onMessage(message: Buffer) {
      const result = parseRrefResponse(message, index);

      if (!result) {
        return;
      }

      clearTimeout(timeout);
      socket.off("message", onMessage);
      resolve(result);
    }

    socket.on("message", onMessage);
    socket.bind(() => {
      socket.send(createRrefPacket(path, index, 5), port, host, (error) => {
        if (error) {
          clearTimeout(timeout);
          socket.off("message", onMessage);
          reject(error);
        }
      });
    });
  });
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

function createRrefPacket(path: string, index: number, frequency: number) {
  const packet = Buffer.alloc(413);
  packet.write("RREF\0", 0, "ascii");
  packet.writeInt32LE(frequency, 5);
  packet.writeInt32LE(index, 9);
  packet.write(path, 13, 400, "ascii");
  return packet;
}

function parseRrefResponse(message: Buffer, wantedIndex: number) {
  const header = message.subarray(0, 5).toString("ascii");

  if (header !== "RREF,") {
    return null;
  }

  for (let offset = 5; offset + 8 <= message.length; offset += 8) {
    const index = message.readInt32LE(offset);
    const value = message.readFloatLE(offset + 4);

    if (index === wantedIndex && Number.isFinite(value)) {
      return {
        index,
        value,
      };
    }
  }

  return null;
}
