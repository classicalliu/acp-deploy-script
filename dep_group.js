const { core } = require("@ckb-lumos/base");
const { normalizers } = require("ckb-js-toolkit");

function serializeOutPointVec(value) {
  const array = new Uint8Array(4 + core.OutPoint.size() * value.length);
  new DataView(array.buffer).setUint32(0, value.length, true);
  for (let i = 0; i < value.length; i++) {
    const itemBuffer = core.SerializeOutPoint(
      normalizers.NormalizeOutPoint(value[i])
    );
    array.set(new Uint8Array(itemBuffer), 4 + i * core.OutPoint.size());
  }
  return array.buffer;
}

// buffer is an ArrayBuffer
function buf2hex(buffer) {
  return (
    "0x" +
    Array.prototype.map
      .call(new Uint8Array(buffer), (x) => ("00" + x.toString(16)).slice(-2))
      .join("")
  );
}

function serializeDepGroupData(outPoints) {
  const result = serializeOutPointVec(outPoints);
  const hex = buf2hex(result);
  return hex;
}

function testSerializeDepGroupData() {
  const outPoint1 = {
    tx_hash:
      "0x6db4d0597fb256cbf7fcb9082201405b0b7a95b04ec357b8a1f1be4ab88ad833",
    index: "0x0",
  };

  const outPoint2 = {
    tx_hash:
      "0x8f8c79eb6671709633fe6a46de93c0fedc9c1b8a6527a18d3983879542635c9f",
    index: "0x3",
  };

  const expected =
    "0x020000006db4d0597fb256cbf7fcb9082201405b0b7a95b04ec357b8a1f1be4ab88ad833000000008f8c79eb6671709633fe6a46de93c0fedc9c1b8a6527a18d3983879542635c9f03000000";

  const outPoints = [outPoint1, outPoint2];

  const hex = serializeDepGroupData(outPoints);

  if (hex !== expected) {
    throw new Error("serialized data error!");
  } else {
    console.log("serialize success!");
  }
}
// testSerializeDepGroupData()

module.exports = {
  serializeDepGroupData,
};
