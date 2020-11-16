const { utils, core } = require("@ckb-lumos/base");
const { normalizers } = require("ckb-js-toolkit");

function toArrayBuffer(buf) {
  var ab = new ArrayBuffer(buf.length);
  var view = new Uint8Array(ab);
  for (var i = 0; i < buf.length; ++i) {
    view[i] = buf[i];
  }
  return ab;
}

function toBigUInt64LE(num) {
  num = BigInt(num);
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(num);
  return toArrayBuffer(buf);
}

// index = "0x1" format
function generateTypeID(input, outputIndex) {
  const s = core.SerializeCellInput(normalizers.NormalizeCellInput(input));
  const i = toBigUInt64LE(outputIndex);
  const ckbHasher = new utils.CKBHasher();
  ckbHasher.update(s);
  ckbHasher.update(i);
  const hex = ckbHasher.digestHex();
  return hex;
}

function generateTypeIDScript(input, outputIndex) {
  const args = generateTypeID(input, outputIndex);
  return {
    code_hash:
      "0x00000000000000000000000000000000000000000000000000545950455f4944",
    hash_type: "type",
    args,
  };
}

function testGenerateTypeID() {
  const outPoint = {
    tx_hash:
      "0x0000000000000000000000000000000000000000000000000000000000000000",
    index: "0xffffffff",
  };

  const input = {
    previous_output: outPoint,
    since: "0x0",
  };

  const outputIndex = "0x1";

  const typeid =
    "0x8536c9d5d908bd89fc70099e4284870708b6632356aad98734fcf43f6f71c304";

  const s = generateTypeID(input, outputIndex);

  if (s !== typeid) {
    throw new Error("generated type id error!");
  } else {
    console.log("generate success");
  }
}
// testGenerateTypeID()

module.exports = {
  generateTypeID,
  generateTypeIDScript,
};
